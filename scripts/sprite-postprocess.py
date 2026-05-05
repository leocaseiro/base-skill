"""Split pair sheets into per-animal strips, normalize to 706x768/frame, chroma-key magenta to alpha.

Input: output/raw/*.png (pair sheets from sprite-gen.py)
Output: output/final/<animal>.png (4 frames horizontal, 2824x768, transparent bg)

Usage:
  ./scripts/sprite-postprocess.py            # process every raw sheet
  ./scripts/sprite-postprocess.py 02         # process only sheet starting with "02"
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path("/Users/leocaseiro/Sites/base-skill-resources/sprite-egg-hatching")
RAW = ROOT / "output" / "raw"
FINAL = ROOT / "output" / "final"
FINAL.mkdir(parents=True, exist_ok=True)

FRAME_W = 706
FRAME_H = 768
FRAMES_PER_ROW = 4
STRIP_W = FRAME_W * FRAMES_PER_ROW  # 2824

# Chroma-key tolerance: how close to magenta a pixel must be to count as background.
# Higher = more aggressive (may eat into subject); lower = leaves halo.
CHROMA_TOLERANCE = 60  # in 0-255 RGB distance from key color

# Each pair sheet maps to 2 animal output filenames (top row, bottom row).
# For single-row sheets (egg), bottom is None.
PAIRS: dict[str, tuple[str, str | None]] = {
    "01-generic-egg.png":         ("egg",         None),
    "02-owl-penguin.png":         ("owl",         "penguin"),
    "03-crocodile-duck.png":      ("crocodile",   "duck"),
    "04-dino-dragon.png":         ("dino",        "dragon"),
    "05-pinkbird-emu.png":        ("pink-bird",   "emu"),
    "06-platypus-echidna.png":    ("platypus",    "echidna"),
    "07-snake-trex.png":          ("snake",       "trex"),
    "08-turtle-bluebird.png":     ("turtle",      "blue-bird"),
    "09-chicken-triceratops.png": ("chicken",     "triceratops"),
}


def detect_key_color(arr: np.ndarray) -> tuple[int, int, int]:
    """Sample the dominant background color from the corners of the image.

    Returns the median RGB of the four corner regions (16x16 each).
    """
    h, w = arr.shape[:2]
    s = 16
    corners = np.concatenate([
        arr[:s, :s].reshape(-1, 3),
        arr[:s, -s:].reshape(-1, 3),
        arr[-s:, :s].reshape(-1, 3),
        arr[-s:, -s:].reshape(-1, 3),
    ])
    return tuple(int(c) for c in np.median(corners, axis=0))


def chroma_key(img: Image.Image, tolerance: int = CHROMA_TOLERANCE) -> Image.Image:
    """Replace background magenta-ish pixels with full alpha-0; keep subject opaque."""
    arr = np.array(img.convert("RGB"))
    key = np.array(detect_key_color(arr), dtype=np.float32)
    diff = np.linalg.norm(arr.astype(np.float32) - key, axis=-1)
    alpha = np.clip(255 - (255 - diff * 255 / tolerance), 0, 255).astype(np.uint8)
    # Crisp threshold: pixels within tolerance of key → alpha=0, else 255.
    alpha = np.where(diff < tolerance, 0, 255).astype(np.uint8)
    rgba = np.dstack([arr, alpha])
    return Image.fromarray(rgba, mode="RGBA")


def split_rows(img: Image.Image) -> list[Image.Image]:
    """Split a pair sheet into 1 or 2 row images. Single-row sheets return [img]."""
    w, h = img.size
    # Heuristic: if aspect > 2.5:1, treat as single row.
    if w / h > 2.5:
        return [img]
    half = h // 2
    return [img.crop((0, 0, w, half)), img.crop((0, half, w, h))]


def split_frames(row: Image.Image) -> list[Image.Image]:
    """Split a row into 4 equal frames horizontally."""
    w, h = row.size
    fw = w // FRAMES_PER_ROW
    return [row.crop((i * fw, 0, (i + 1) * fw, h)) for i in range(FRAMES_PER_ROW)]


def fit_to_frame(frame: Image.Image, target_w: int = FRAME_W, target_h: int = FRAME_H) -> Image.Image:
    """Resize a frame to target dimensions, preserving aspect ratio with transparent padding."""
    fw, fh = frame.size
    scale = min(target_w / fw, target_h / fh)
    new_w = int(fw * scale)
    new_h = int(fh * scale)
    resized = frame.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    canvas.paste(resized, ((target_w - new_w) // 2, (target_h - new_h) // 2), resized)
    return canvas


def process_sheet(raw_path: Path) -> list[Path]:
    """Process one raw pair sheet → up to 2 final per-animal strip PNGs."""
    if raw_path.name not in PAIRS:
        print(f"  SKIP unknown: {raw_path.name}")
        return []

    top_name, bottom_name = PAIRS[raw_path.name]
    img = Image.open(raw_path).convert("RGB")
    print(f"  loaded {raw_path.name} ({img.size[0]}x{img.size[1]})")

    rows = split_rows(img)
    names = [top_name] + ([bottom_name] if bottom_name and len(rows) > 1 else [])
    outputs: list[Path] = []

    for row, name in zip(rows, names):
        if name is None:
            continue
        keyed = chroma_key(row)
        frames = split_frames(keyed)
        # Compose final strip
        strip = Image.new("RGBA", (STRIP_W, FRAME_H), (0, 0, 0, 0))
        for i, frame in enumerate(frames):
            sized = fit_to_frame(frame)
            strip.paste(sized, (i * FRAME_W, 0), sized)
        out_path = FINAL / f"{name}.png"
        strip.save(out_path, format="PNG")
        outputs.append(out_path)
        print(f"    → {out_path} ({STRIP_W}x{FRAME_H})")
    return outputs


def main() -> None:
    filter_str = sys.argv[1] if len(sys.argv) > 1 else None
    sheets = sorted(RAW.glob("*.png"))
    if filter_str:
        sheets = [s for s in sheets if filter_str in s.name]
    if not sheets:
        sys.exit("No raw sheets found")

    print(f"Processing {len(sheets)} sheet(s):")
    all_outputs: list[Path] = []
    for s in sheets:
        all_outputs.extend(process_sheet(s))
    print(f"\nDone. {len(all_outputs)} final PNGs in {FINAL}/")


if __name__ == "__main__":
    main()
