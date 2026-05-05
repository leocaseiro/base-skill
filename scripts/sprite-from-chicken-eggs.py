"""Extract per-animal sprite strips from chicken-eggs/ source sheets.

Filename conventions in the source directory:
- `<animal>.png`         single animal — Gemini duplicates the row, take TOP row only
- `<a>+<b>.png`          pair sheet — top = <a>, bottom = <b>
- `egg-cracks.png`        special: 3-frame pre-hatch sequence, output as `egg.png`

Output: per-animal RGBA strip on transparent background, 706 px per frame.
- animals: 4 frames @ 706x768 = 2824x768
- egg:     3 frames @ 706x768 = 2118x768

Background `#7e48c0` is chroma-keyed to alpha. Frames are letterbox-fit so
source aspect is preserved without cropping the subject.

Usage:
  ./scripts/sprite-from-chicken-eggs.py            # process every sheet
  ./scripts/sprite-from-chicken-eggs.py owl        # process only sheet matching "owl"
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

INPUT = Path(
    "/Users/leocaseiro/Sites/base-skill-resources/sprite-egg-hatching"
    "/BEST ONES/_EDITED-READY/chicken-eggs"
)
OUTPUT = Path(
    "/Users/leocaseiro/Sites/base-skill-resources/sprite-egg-hatching"
    "/output/sprites-clean"
)

KEY_RGB = (126, 72, 192)  # #7e48c0
TOLERANCE = 55  # 0-255 RGB distance; tuned to clear bg without eating purple-ish subjects

FRAME_W = 706
FRAME_H = 768


def chroma_key(arr: np.ndarray, tolerance: int = TOLERANCE) -> np.ndarray:
    """Replace pixels near KEY_RGB with alpha=0; keep subject opaque."""
    key = np.array(KEY_RGB, dtype=np.float32)
    diff = np.linalg.norm(arr.astype(np.float32) - key, axis=-1)
    alpha = np.where(diff < tolerance, 0, 255).astype(np.uint8)
    return np.dstack([arr, alpha])


def fit_to_frame(frame_img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Letterbox-fit a frame into target dims, preserving aspect, transparent padding."""
    fw, fh = frame_img.size
    scale = min(target_w / fw, target_h / fh)
    new_w = max(1, int(fw * scale))
    new_h = max(1, int(fh * scale))
    resized = frame_img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    canvas.paste(resized, ((target_w - new_w) // 2, (target_h - new_h) // 2), resized)
    return canvas


def emit_row(row_img: Image.Image, n_frames: int, name: str) -> Path:
    """Chroma-key the row, split into n_frames equal cells, save as one strip."""
    arr = np.array(row_img.convert("RGB"))
    keyed = Image.fromarray(chroma_key(arr), mode="RGBA")

    w, h = keyed.size
    fw = w // n_frames
    frames = [keyed.crop((i * fw, 0, (i + 1) * fw, h)) for i in range(n_frames)]

    strip = Image.new("RGBA", (FRAME_W * n_frames, FRAME_H), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sized = fit_to_frame(frame, FRAME_W, FRAME_H)
        strip.paste(sized, (i * FRAME_W, 0), sized)

    out_path = OUTPUT / f"{name}.png"
    strip.save(out_path, format="PNG")
    print(f"    -> {out_path.name} ({strip.size[0]}x{strip.size[1]}, {n_frames} frames)")
    return out_path


def process_sheet(path: Path) -> list[Path]:
    name = path.stem
    img = Image.open(path).convert("RGB")
    w, h = img.size
    print(f"{path.name} ({w}x{h})")

    if name == "egg-cracks":
        # Single-row, 3-frame egg sequence -> output as `egg.png`
        return [emit_row(img, 3, "egg")]

    if "+" in name:
        top_name, bottom_name = name.split("+", 1)
        half = h // 2
        top_row = img.crop((0, 0, w, half))
        bottom_row = img.crop((0, half, w, h))
        print(f"  pair: top={top_name}, bottom={bottom_name}")
        return [
            emit_row(top_row, 4, top_name),
            emit_row(bottom_row, 4, bottom_name),
        ]

    # Single animal: Gemini duplicated the row, take TOP only
    half = h // 2
    top_row = img.crop((0, 0, w, half))
    print(f"  single: {name} (top row only)")
    return [emit_row(top_row, 4, name)]


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    filter_str = sys.argv[1] if len(sys.argv) > 1 else None

    sheets = sorted(p for p in INPUT.glob("*.png") if not p.name.startswith("."))
    if filter_str:
        sheets = [s for s in sheets if filter_str in s.name]
    if not sheets:
        sys.exit("No sheets matched")

    print(f"Processing {len(sheets)} sheet(s)\n")
    all_outputs: list[Path] = []
    for s in sheets:
        all_outputs.extend(process_sheet(s))
    print(f"\nDone. {len(all_outputs)} strip(s) in {OUTPUT}/")


if __name__ == "__main__":
    main()
