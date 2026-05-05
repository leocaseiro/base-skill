"""Build per-animal sprite strips, a combined atlas, and a JSON manifest.

Source: hand-cleaned transparent PNGs from
  BEST ONES/_EDITED-READY/chicken-eggs/bg-transparent/

Filename convention:
- `<animal>.png`   single animal, top row only (Gemini duplicated the row)
- `<a>+<b>.png`    pair sheet, top=<a>, bottom=<b>
- `egg-cracks.png` 3-frame pre-hatch egg sequence -> output as `egg`

Output layout (`output/sprites/`):
- `strips/<name>.png`   per-sprite horizontal strip (animals 4 frames, egg 3)
- `atlas/sprites.png`   single combined atlas, 4 columns x N rows
- `atlas/manifest.json` frame coordinates per sprite

Frame size canon: 600 x 669.
- Animal sources are 2400x1339 -> 600x669.5 per cell (rounded to 669) — no scaling.
- Egg source is 3584x1184 -> 1194x1184 per cell, letterbox-fit into 600x669
  (downscale only, LANCZOS, preserves quality).
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

INPUT = Path(
    "/Users/leocaseiro/Sites/base-skill-resources/sprite-egg-hatching"
    "/BEST ONES/_EDITED-READY/chicken-eggs/bg-transparent"
)
OUTPUT = Path(
    "/Users/leocaseiro/Sites/base-skill-resources/sprite-egg-hatching"
    "/output/sprites"
)
STRIPS = OUTPUT / "strips"
ATLAS_DIR = OUTPUT / "atlas"

FRAME_W = 480  # 2x the typical display size of 240px (retina-ready, 75% smaller PNGs than native 600px)
FRAME_H = 535  # preserves ~600:669 aspect ratio (480 / 600 * 669 = 535.2)

ANIMAL_FRAMES = 4
EGG_FRAMES = 3
ATLAS_COLS = 4

# Order in the atlas (egg first so animation timeline is visually obvious).
SPRITE_ORDER = [
    "egg",
    "owl",
    "penguin",
    "parrot",
    "duck",
    "crocodile",
    "dino",
    "dragon-female",
    "dragon-male",
    "snake",
    "t-rex",
    "triceratops",
    "turtle",
    "tortoise",
    "echidna",
    "platypus",
    "yellow-bird",
    "blue-bird",
    "pink-bird",
    "emu",
]


def fit_to_frame(frame_img: Image.Image, target_w: int = FRAME_W, target_h: int = FRAME_H) -> Image.Image:
    """Letterbox-fit (downscale-only ok, upscale skipped) into target dims."""
    fw, fh = frame_img.size
    scale = min(target_w / fw, target_h / fh, 1.0)  # never upscale
    new_w = max(1, int(round(fw * scale)))
    new_h = max(1, int(round(fh * scale)))
    if (new_w, new_h) != (fw, fh):
        frame_img = frame_img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    canvas.paste(frame_img, ((target_w - new_w) // 2, (target_h - new_h) // 2), frame_img)
    return canvas


def split_frames(row: Image.Image, n: int) -> list[Image.Image]:
    w, h = row.size
    fw = w // n
    return [row.crop((i * fw, 0, (i + 1) * fw, h)) for i in range(n)]


def make_strip(frames: list[Image.Image]) -> Image.Image:
    n = len(frames)
    strip = Image.new("RGBA", (FRAME_W * n, FRAME_H), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sized = fit_to_frame(frame)
        strip.paste(sized, (i * FRAME_W, 0), sized)
    return strip


def extract_sprites(path: Path) -> dict[str, list[Image.Image]]:
    """Return a {sprite_name: [frame, ...]} dict for one source sheet."""
    name = path.stem
    img = Image.open(path).convert("RGBA")
    w, h = img.size

    if name == "egg-cracks":
        return {"egg": split_frames(img, EGG_FRAMES)}

    if "+" in name:
        top_name, bottom_name = name.split("+", 1)
        half = h // 2
        top_row = img.crop((0, 0, w, half))
        bottom_row = img.crop((0, half, w, h))
        return {
            top_name: split_frames(top_row, ANIMAL_FRAMES),
            bottom_name: split_frames(bottom_row, ANIMAL_FRAMES),
        }

    half = h // 2
    top_row = img.crop((0, 0, w, half))
    return {name: split_frames(top_row, ANIMAL_FRAMES)}


def build() -> None:
    STRIPS.mkdir(parents=True, exist_ok=True)
    ATLAS_DIR.mkdir(parents=True, exist_ok=True)

    sources = sorted(p for p in INPUT.glob("*.png") if not p.name.startswith("."))
    print(f"Reading {len(sources)} source sheet(s)\n")

    sprites: dict[str, list[Image.Image]] = {}
    for src in sources:
        for name, frames in extract_sprites(src).items():
            if name in sprites:
                print(f"  WARNING: duplicate sprite name '{name}' from {src.name}")
            sprites[name] = frames
            print(f"  {src.name} -> {name} ({len(frames)} frames)")

    missing = [n for n in SPRITE_ORDER if n not in sprites]
    extra = [n for n in sprites if n not in SPRITE_ORDER]
    if missing:
        print(f"\nWARNING: missing from SPRITE_ORDER: {missing}")
    if extra:
        print(f"\nWARNING: extra sprites not in SPRITE_ORDER (skipping in atlas): {extra}")

    # Per-sprite strips
    print("\nWriting strips:")
    for name, frames in sprites.items():
        strip = make_strip(frames)
        out = STRIPS / f"{name}.png"
        strip.save(out, format="PNG")
        print(f"  {out.name}  ({strip.size[0]}x{strip.size[1]}, {len(frames)} frames)")

    # Combined atlas (4 cols x N rows)
    rows = [n for n in SPRITE_ORDER if n in sprites]
    atlas_rows = len(rows)
    atlas_w = FRAME_W * ATLAS_COLS
    atlas_h = FRAME_H * atlas_rows
    atlas = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))

    manifest_sprites: dict[str, dict] = {}
    for row_idx, name in enumerate(rows):
        frames = sprites[name]
        cells = []
        for col_idx, frame in enumerate(frames):
            sized = fit_to_frame(frame)
            x = col_idx * FRAME_W
            y = row_idx * FRAME_H
            atlas.paste(sized, (x, y), sized)
            cells.append({"x": x, "y": y, "w": FRAME_W, "h": FRAME_H})
        manifest_sprites[name] = {
            "row": row_idx,
            "frames": len(frames),
            "cells": cells,
        }

    atlas_path = ATLAS_DIR / "sprites.png"
    atlas.save(atlas_path, format="PNG", optimize=True)
    print(f"\nAtlas: {atlas_path.name}  ({atlas_w}x{atlas_h}, {atlas_rows} rows)")

    manifest = {
        "version": 1,
        "frame_size": {"w": FRAME_W, "h": FRAME_H},
        "atlas": "sprites.png",
        "atlas_size": {"w": atlas_w, "h": atlas_h},
        "columns": ATLAS_COLS,
        "rows": atlas_rows,
        "sprites": manifest_sprites,
    }
    manifest_path = ATLAS_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(f"Manifest: {manifest_path.name}")

    print(f"\nDone. {len(sprites)} sprite(s).")


if __name__ == "__main__":
    build()
