"""Smoke-test which image-gen models work on free tier and compare quality.

Generates a tiny test sprite from each candidate model so we can pick one.
"""
import os
import sys
import time
from pathlib import Path

from google import genai
from google.genai import types

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("ERROR: GEMINI_API_KEY not set", file=sys.stderr)
    sys.exit(1)

OUT = Path("/Users/leocaseiro/Sites/base-skill-resources/sprite-egg-hatching/output/_smoke")
OUT.mkdir(parents=True, exist_ok=True)

PROMPT = (
    "A 3D-rendered painterly cute hatching egg sprite, 4 frames in a row showing progression: "
    "(1) intact egg with small horizontal crack and a tiny chick beak peeking through, "
    "(2) chick face visible inside top-and-bottom shell halves, "
    "(3) chick standing in the bottom shell half, no top shell, "
    "(4) full chick standing happy with no shell. "
    "Solid magenta background (#FF00FF). No drop shadows. No motion lines or vibration waves. "
    "Each frame equally sized with consistent lighting and color. Stylized like a children's mobile game."
)

CANDIDATES = [
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image-preview",
]

client = genai.Client(api_key=API_KEY)

for model in CANDIDATES:
    print(f"\n=== Testing {model} ===")
    t = time.time()
    try:
        resp = client.models.generate_content(
            model=model,
            contents=[PROMPT],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
                image_config=types.ImageConfig(aspect_ratio="16:9"),
            ),
        )
        elapsed = time.time() - t
        saved = False
        for part in resp.parts:
            if part.text:
                print(f"  [text] {part.text[:200]}")
            elif part.inline_data:
                img = part.as_image()
                fname = OUT / f"smoke_{model.replace('/', '_')}.png"
                img.save(fname, format="PNG")
                print(f"  [image] saved {fname} ({img.size}, {elapsed:.1f}s)")
                saved = True
        if not saved:
            print("  [warn] no image returned")
    except Exception as e:
        print(f"  [error] {type(e).__name__}: {e}")
