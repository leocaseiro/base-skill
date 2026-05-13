#!/usr/bin/env python3
"""
Rebuild the egg-hatch sprite strips from the high-quality masters,
fixing the per-frame cropping that the original strip-build pipeline
introduced (see DinoEggHatch SpriteInspector story for symptoms).

Pipeline:
  1. For each master in `<RESOURCES>/output/sprites-clean/<animal>.png`,
     slice the image into N equal frames (3 for egg, 4 for animals).
  2. For every frame, find the true content bbox via the alpha channel.
  3. Pick a per-strip "scale-to-fit" factor: large enough that the
     widest/tallest frame in this strip fills the target cell minus
     padding, small enough that everything fits.
  4. Resize every frame by that factor and centre it inside a uniform
     `TARGET_FRAME_W x TARGET_FRAME_H` cell.
  5. Concatenate cells horizontally into a clean strip.
  6. Optionally run pngquant for size, then write to
     `public/sprites/egg-hatch/strips/<name>.png`.

Run:
  python3 scripts/rebuild-egg-hatch-strips.py            # build + write
  python3 scripts/rebuild-egg-hatch-strips.py --dry-run  # report only
  python3 scripts/rebuild-egg-hatch-strips.py --no-quant # skip pngquant
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import NamedTuple

import numpy as np
from PIL import Image
from scipy import ndimage

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[1]


def find_resources_dir() -> Path:
    """Walk up the filesystem looking for base-skill-resources alongside
    the repo. Works whether the repo is at ~/Sites/base-skill or inside a
    worktree like ~/Sites/base-skill/worktrees/<branch>."""
    rel = (
        "base-skill-resources"
        "/sprite-egg-hatching"
        "/BEST ONES/_EDITED-READY/chicken-eggs/bg-transparent"
    )
    here = REPO_ROOT
    for _ in range(6):
        candidate = here.parent / rel
        if candidate.is_dir():
            return candidate
        here = here.parent
    return Path.home() / "Sites" / rel


RESOURCES_DIR = find_resources_dir()
TARGET_DIR = REPO_ROOT / "public" / "sprites" / "egg-hatch" / "strips"

# Filename → (output_name(s), n_frames). Pair sheets emit two strips,
# single-animal sheets emit one (top row only — Gemini duplicates the row).
EGG_OUTPUT_NAME = "egg"
EGG_INPUT_STEM = "egg-cracks"

# Per-output extra scaling at strip-build time. Most size tweaks are now
# handled in the renderer (see DISPLAY_SCALE in sprites.ts) so the strip
# data stays clean and we don't have to regenerate every time we want to
# nudge an animal. Reserve this for cases where the strip itself needs a
# different baseline scale.
EXTRA_SCALE: dict[str, float] = {}

# Final per-frame slot dimensions in the rebuilt strip. Matches today's
# 480x535 so the React renderer doesn't need to change. Padding leaves a
# few pixels of breathing room around the largest content so nothing
# touches the slot edge after rebuild.
TARGET_FRAME_W = 480
TARGET_FRAME_H = 535
PADDING_X = 8
PADDING_Y = 8

# Per-source frame counts. Egg has 3 frames; everything else 4.
FRAME_COUNTS = {"egg": 3}
DEFAULT_FRAMES = 4


# --------------------------------------------------------------------------
# Core
# --------------------------------------------------------------------------


class FrameSpec(NamedTuple):
    """A frame cropped from a master, ready to be placed in a target cell."""

    image: Image.Image  # cropped to alpha bbox, native master scale
    bbox: tuple[int, int, int, int]  # (x0, y0, x1, y1) in master coords


def slice_master(
    master: Image.Image,
    n_frames: int,
    alpha_threshold: int = 8,
    dilation_px: int = 12,
) -> list[FrameSpec]:
    """Slice a master into N frames using connected-component analysis.

    Why not a naive `crop(slot).getbbox()` per frame?
    The painterly masters sometimes draw a frame's appendage (e.g. a
    flipper tip) past its slot boundary into the neighbour's slot, AND
    leave a thin transparent gap between the main body and the appendage.
    A naive bbox per slot either:
      - clips the appendage (if it crosses the slot edge), or
      - mis-attributes a wisp from the neighbour to this slot.

    Algorithm:
      1. Build an alpha mask over the entire master.
      2. Dilate it (a few px) so a body and its near-by appendage merge
         into a single connected component.
      3. Label connected components on the dilated mask.
      4. For each component, find the slot that owns the most of its
         pixels (overlap-area majority). That slot's frame inherits the
         whole component, including any pixels that physically sit in
         the neighbour slot.
      5. For each frame, emit the union of its assigned components using
         the original (non-dilated) alpha — dilation is only used to
         decide grouping, never to bloat the visible pixels.
    """
    if master.mode != "RGBA":
        master = master.convert("RGBA")
    w, h = master.size
    slot_w = w // n_frames

    arr = np.array(master)
    alpha = arr[:, :, 3]
    mask = alpha > alpha_threshold

    if not mask.any():
        return [
            FrameSpec(
                image=master.crop((i * slot_w, 0, (i + 1) * slot_w, h)),
                bbox=(0, 0, slot_w, h),
            )
            for i in range(n_frames)
        ]

    structure = np.ones((3, 3), dtype=bool)
    if dilation_px > 0:
        dilated = ndimage.binary_dilation(
            mask, structure=structure, iterations=dilation_px
        )
    else:
        dilated = mask
    labels, n_components = ndimage.label(dilated, structure=structure)

    # Group component IDs by the frame slot that owns the most of their pixels.
    components_per_frame: list[list[int]] = [[] for _ in range(n_frames)]
    for cid in range(1, n_components + 1):
        comp_mask = labels == cid
        # Per-slot pixel count for this component.
        per_slot = [
            int(comp_mask[:, i * slot_w : (i + 1) * slot_w].sum())
            for i in range(n_frames)
        ]
        owner = int(np.argmax(per_slot))
        # Tiny components (likely speckle) are dropped.
        if sum(per_slot) < 50:
            continue
        components_per_frame[owner].append(cid)

    frames: list[FrameSpec] = []
    for i, cids in enumerate(components_per_frame):
        # Build a per-frame keep-mask: ORIGINAL (non-dilated) pixels of any
        # component this frame owns. This keeps the visible silhouette crisp.
        keep = np.zeros_like(mask, dtype=bool)
        for cid in cids:
            keep |= (labels == cid) & mask
        if not keep.any():
            # Frame is empty (shouldn't happen for our assets, but be safe).
            frames.append(
                FrameSpec(
                    image=Image.new("RGBA", (slot_w, h), (0, 0, 0, 0)),
                    bbox=(0, 0, slot_w, h),
                )
            )
            continue

        # Emit only the kept pixels.
        out = arr.copy()
        out[~keep] = 0
        kept_img = Image.fromarray(out, mode="RGBA")
        bbox = kept_img.getbbox()
        cropped = kept_img.crop(bbox) if bbox else kept_img
        frames.append(FrameSpec(image=cropped, bbox=bbox or (0, 0, w, h)))

    return frames


class StripJob(NamedTuple):
    """One rebuild target: an output animal name and the source row image."""

    name: str
    source_row: Image.Image
    n_frames: int


def jobs_from_sheet(path: Path) -> list[StripJob]:
    """Decompose a chicken-eggs sheet into one or two StripJobs.

    Conventions inherited from sprite-from-chicken-eggs.py:
      - `egg-cracks.png`         → 3-frame egg sequence, output as `egg.png`
      - `<a>+<b>.png` pair sheet → top row=<a>, bottom row=<b>, 4 frames each
      - `<animal>.png`           → top row only (Gemini duplicates the row)
    """
    name = path.stem
    img = Image.open(path).convert("RGBA")
    w, h = img.size

    if name == EGG_INPUT_STEM:
        # Single-row, 3-frame egg sequence. The bg-transparent egg sheet
        # actually has aspect ratio > 2 so it's already a single row.
        if w / h > 2.5:
            row = img
        else:
            row = img.crop((0, 0, w, h // 2))
        return [StripJob(name=EGG_OUTPUT_NAME, source_row=row, n_frames=3)]

    half = h // 2
    top_row = img.crop((0, 0, w, half))
    if "+" in name:
        top_name, bottom_name = name.split("+", 1)
        bottom_row = img.crop((0, half, w, h))
        return [
            StripJob(name=top_name, source_row=top_row, n_frames=DEFAULT_FRAMES),
            StripJob(
                name=bottom_name, source_row=bottom_row, n_frames=DEFAULT_FRAMES
            ),
        ]

    # Single animal — Gemini duplicates the row, take the top only.
    return [StripJob(name=name, source_row=top_row, n_frames=DEFAULT_FRAMES)]


def build_strip(job: StripJob) -> Image.Image:
    """Compose a clean strip from one StripJob, scaled to fit TARGET_FRAME_*."""
    frames = slice_master(job.source_row, job.n_frames)

    max_w = max(f.image.width for f in frames)
    max_h = max(f.image.height for f in frames)

    avail_w = TARGET_FRAME_W - 2 * PADDING_X
    avail_h = TARGET_FRAME_H - 2 * PADDING_Y
    scale = min(avail_w / max_w, avail_h / max_h) * EXTRA_SCALE.get(job.name, 1.0)

    strip = Image.new(
        "RGBA",
        (job.n_frames * TARGET_FRAME_W, TARGET_FRAME_H),
        (0, 0, 0, 0),
    )

    for i, frame in enumerate(frames):
        new_w = max(1, round(frame.image.width * scale))
        new_h = max(1, round(frame.image.height * scale))
        scaled = frame.image.resize((new_w, new_h), Image.LANCZOS)

        # If EXTRA_SCALE pushed the scaled subject larger than the cell,
        # crop the overflow centred on the CoM so the visible silhouette
        # grows but never spills into the neighbouring slot. The flipper
        # tips on a turtle's wide frame may end up trimmed; everything
        # else (standing pose, head) gains the requested size boost.
        if new_w > TARGET_FRAME_W or new_h > TARGET_FRAME_H:
            scaled_alpha_pre = np.array(scaled)[:, :, 3]
            ys_pre, xs_pre = np.where(scaled_alpha_pre > 8)
            cx = int(xs_pre.mean()) if len(xs_pre) else new_w // 2
            cy = int(ys_pre.mean()) if len(ys_pre) else new_h // 2
            crop_w = min(new_w, TARGET_FRAME_W)
            crop_h = min(new_h, TARGET_FRAME_H)
            x0 = max(0, min(new_w - crop_w, cx - crop_w // 2))
            y0 = max(0, min(new_h - crop_h, cy - crop_h // 2))
            scaled = scaled.crop((x0, y0, x0 + crop_w, y0 + crop_h))
            new_w, new_h = scaled.size

        slot_x = i * TARGET_FRAME_W

        # Centre by *centre of mass* of the alpha mask, not by bbox.
        # bbox-centering puts an asymmetric subject (dinosaur with tail
        # right, platypus with bill left, tortoise with head up) visibly
        # off-centre because the bbox includes thin appendages that pull
        # the bbox centre away from the perceived visual centre. CoM
        # weights every opaque pixel equally, so the heavier "body" mass
        # lands at the cell centre. Falls back to bbox-centre if the
        # frame has no opaque pixels (defensive — shouldn't happen).
        scaled_alpha = np.array(scaled)[:, :, 3]
        ys, xs = np.where(scaled_alpha > 8)
        if len(xs) > 0:
            com_x = int(xs.mean())
            com_y = int(ys.mean())
            offset_x = slot_x + TARGET_FRAME_W // 2 - com_x
            offset_y = TARGET_FRAME_H // 2 - com_y
            # Clamp so the bbox stays within the cell — a heavy off-side
            # subject might otherwise spill into the next slot.
            min_x = slot_x + PADDING_X
            max_x = slot_x + TARGET_FRAME_W - new_w - PADDING_X
            min_y = PADDING_Y
            max_y = TARGET_FRAME_H - new_h - PADDING_Y
            offset_x = max(min_x, min(max_x, offset_x))
            offset_y = max(min_y, min(max_y, offset_y))
        else:
            offset_x = slot_x + (TARGET_FRAME_W - new_w) // 2
            offset_y = (TARGET_FRAME_H - new_h) // 2

        strip.paste(scaled, (offset_x, offset_y), scaled)

    return strip


def quantize(path: Path) -> int:
    """Run pngquant in-place. Returns the new file size or -1 on failure."""
    try:
        subprocess.run(
            [
                "pngquant",
                "--force",
                "--skip-if-larger",
                "--strip",
                "--quality",
                "65-90",
                "--ext",
                ".png",
                str(path),
            ],
            check=True,
            capture_output=True,
        )
        return path.stat().st_size
    except (subprocess.CalledProcessError, FileNotFoundError):
        return -1


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Build in memory and print stats; don't write files.",
    )
    parser.add_argument(
        "--no-quant",
        action="store_true",
        help="Skip pngquant compression.",
    )
    parser.add_argument(
        "--source",
        default=str(RESOURCES_DIR),
        help=f"Master sprites dir (default: {RESOURCES_DIR})",
    )
    parser.add_argument(
        "--out",
        default=str(TARGET_DIR),
        help=f"Output strips dir (default: {TARGET_DIR})",
    )
    parser.add_argument(
        "--only",
        nargs="*",
        help="Restrict to specific animal names (no extension).",
    )
    args = parser.parse_args()

    src_dir = Path(args.source)
    out_dir = Path(args.out)
    if not src_dir.is_dir():
        print(f"ERROR: source dir not found: {src_dir}", file=sys.stderr)
        return 1

    if not args.dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)

    sources = sorted(p for p in src_dir.glob("*.png"))
    # Expand each source sheet into one or two StripJobs.
    jobs: list[StripJob] = []
    for src in sources:
        jobs.extend(jobs_from_sheet(src))

    if args.only:
        wanted = set(args.only)
        jobs = [j for j in jobs if j.name in wanted]

    print(
        f"Rebuilding {len(jobs)} strip(s) from {src_dir} → {out_dir}\n"
        f"Target frame: {TARGET_FRAME_W}x{TARGET_FRAME_H} "
        f"(pad {PADDING_X}/{PADDING_Y})\n"
    )

    total_old = 0
    total_new = 0
    for job in jobs:
        strip = build_strip(job)
        out_path = out_dir / f"{job.name}.png"

        old_size = out_path.stat().st_size if out_path.exists() else 0
        total_old += old_size

        if args.dry_run:
            print(
                f"  {job.name:14s} row={job.source_row.size}  "
                f"new_strip={strip.size}  (existing={old_size:>7}b)"
            )
            continue

        # Write to a temp file then atomically replace, so a failed
        # quantize doesn't leave a half-written PNG in place.
        with tempfile.NamedTemporaryFile(
            suffix=".png", delete=False, dir=out_dir
        ) as tmp:
            tmp_path = Path(tmp.name)
        try:
            strip.save(tmp_path, format="PNG", optimize=True)
            new_size = tmp_path.stat().st_size
            if not args.no_quant:
                quant_size = quantize(tmp_path)
                if quant_size > 0:
                    new_size = quant_size
            tmp_path.replace(out_path)
        except Exception:
            tmp_path.unlink(missing_ok=True)
            raise

        total_new += new_size
        delta = new_size - old_size
        sign = "+" if delta >= 0 else ""
        print(
            f"  {job.name:14s} row={job.source_row.size}  "
            f"strip={strip.size}  size={new_size:>7}b "
            f"({sign}{delta}b)"
        )

    if not args.dry_run:
        print(
            f"\nTotal: {total_old}b → {total_new}b "
            f"(delta {total_new - total_old:+d}b)"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
