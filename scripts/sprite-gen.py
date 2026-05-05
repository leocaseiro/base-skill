"""Sprite sheet generator via Gemini API.

Usage:
  ./scripts/sprite-gen.py <task>           # generate one task
  ./scripts/sprite-gen.py <task> --refine  # send a refinement message in same chat (TODO)
  ./scripts/sprite-gen.py --list           # list task names
  ./scripts/sprite-gen.py --all            # run all tasks sequentially

Env: GEMINI_API_KEY required.
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from io import BytesIO
from pathlib import Path

from google import genai
from google.genai import types
from PIL import Image as PILImage

ROOT = Path("/Users/leocaseiro/Sites/base-skill-resources/sprite-egg-hatching")
SRC = ROOT / "claude-sprite"
OUT = ROOT / "output" / "raw"
OUT.mkdir(parents=True, exist_ok=True)

MODEL = "gemini-3-pro-image-preview"
ASPECT = "16:9"
RESOLUTION = "2K"  # 2K for higher quality detail per frame

UNIVERSAL = """
STYLE & OUTPUT RULES (apply to every frame):

ABSOLUTELY CRITICAL — FLAT BACKGROUND, NO SHADOWS, NO GROUND, NO GRADIENT:
- Background is one perfectly flat solid vibrant magenta color from edge to edge of the canvas.
- ZERO drop shadows under or around the subjects. The magenta touches each subject's silhouette directly, with no soft shadow falloff, no contact shadow, no ambient occlusion.
- NO ground plane, NO floor, NO horizon line. Magenta is the same color from top to bottom.
- NO gradient, NO vignette, NO pastel softening. The top edge and bottom edge of the canvas are the EXACT same magenta hex value.
- Treat each frame like a flat 2D sticker placed on a single flat magenta sheet — subjects float on color, they do not sit in a 3D scene.

LAYOUT:
- All frames in one seamless image. NO frame dividers, NO grid borders, NO rectangular outlines, NO cell separators. The magenta runs continuously between frames.
- All frames equal-sized cells, equal vertical centering, equal scale of subject.

NO ARTIFACTS:
- NO motion lines, NO vibration waves, NO sparkle/star marks anywhere on the canvas.

EGGSHELL ANCHOR:
- The eggshell is BEIGE/CREAM with small brown speckles and natural cracks — IDENTICAL across every frame AND across both rows (when there are 2 rows).
- Do NOT theme the eggshell to the animal's color. A black-and-white animal (penguin) still hatches from the same beige speckled egg. A green/blue/red/yellow animal still hatches from the same beige speckled egg.
- Treat the eggshell as a fixed, unchangeable element — same speckles, same color, same crack pattern in every frame.

CHARACTER CONSISTENCY:
- The animal's body color, pattern, and proportions must be IDENTICAL across all 4 frames of that animal.
- Cute/happy expression: soft eyes, gentle smile, optional small tongue. NEVER aggressive teeth or fangs.

STYLE — PRESERVE THE SOURCE'S PAINTERLY LOOK:
- The target style is high-quality 3D rendered painterly illustration with soft volumetric shading, gentle highlights, and smooth body shading (no hard outlines).
- IF THE SOURCE IS ALREADY PAINTERLY (e.g. owl-style, chicken-style with soft shading and no hard outlines): match the source faithfully — same character design, same proportions, same color palette, same feather/scale/fur texture, same overall feel. Just apply the requested per-frame changes. DO NOT redesign the character.
- IF THE SOURCE IS FLAT 2D / CHIBI / THICK-OUTLINED CARTOON: render the SAME character (same colors, same species, same general shape) in the painterly 3D style described above instead. Keep the character's identity but lift the rendering quality.
- The character must remain recognizable as the same character across all frames and consistent with the source's intent. Do not change species, colors, or distinctive markings.
- Output a single PNG, ~16:9 aspect ratio, highest resolution available.

"FACE LEFT" DEFINITION (whenever the prompt uses this phrase):
- 3/4 view: the WHOLE BODY of the animal — head, neck, shoulders, torso, hips, and limbs — rotates together about 20-30 degrees to its right (which the viewer sees as a noticeable left turn). The body axis turns as a single unit, like the animal is on a turntable.
- The head MUST NOT twist independently of the body. The shoulders and torso turn the same amount as the head. No neck-twist, no head-only turn while the body faces forward.
- BOTH eyes still visible to the camera, but the face is clearly angled — not staring straight at the viewer.
- The far ear/cheek is slightly less visible than the near one. The beak/snout/mouth is clearly off-center, pointing toward the left edge of the frame. The animal's far shoulder is slightly behind the near shoulder.
- This must be a VISIBLY angled FULL-BODY pose. If only the head is turned while the body faces forward, that is WRONG — fix by rotating the body too.
- NEVER a full side profile (90°). NEVER straight-on frontal (0°). Aim for the unmistakable in-between with the whole body rotated.
"""

SOURCES = {
    "ref_owl_penguin": "2.owl+penguin (penguin should face left on 3rd emu frame).png",
    "src_egg": "1.egg-hatching (just keep the top row, with the egg hatching, and make better quality, the 4rd frame should close just a bit more of the egg).PNG",
    "src_owl_penguin": "2.owl+penguin (penguin should face left on 3rd emu frame).png",
    "src_croc_duck_2a": "2a.crocodile+duck (a reference to image 2b).png",
    "src_croc_duck_2c": "2c.crocodile+duck (better quality than image 2b).png",
    "src_dino_dragon": "3.dino+dragon (first egg should match the reference, it's curretly less broken. dragon smoke should always be in both noses, dragon tail should be up, not down) .png",
    "src_pink_emu": "4.pink-bird+emu (emu should face left on 3rd emu frame).png",
    "src_platypus_echidna": "5.platypus+echidna (first frames of each animal should have more suspense, and look like the image 2).PNG",
    "src_snake_trex": "6.snake+t-rex (t-rex should be green, not blue, and remove horn).PNG",
    "src_turtle_bird": "7.turtle+bird (blue bird first egg should follow reference, its less broken, same with turtle first egg).png",
    "src_chicken_trex": "8.chicken+tricerops (remove bottom right star from markdown).png",
}


def prompt_egg() -> str:
    return f"""Take ONLY the top row of this reference (4 frames of an empty hatching egg, no animal). Regenerate it at higher quality, preserving the exact same eggshell color, speckle pattern, and crack progression. Make these specific changes:

- Frame 1: intact egg with very faint hairline cracks.
- Frame 2: more visible cracks across the middle.
- Frame 3: deep cracks, but the egg is still ONE PIECE — top shell still fully attached, no separation.
- Frame 4: many deep cracks, the top shell is heavily cracked AND STILL ATTACHED to the bottom. NO PIECES MISSING, NO SHATTERED OPENING, NO EXPOSED INTERIOR. Imagine the egg is one frame away from breaking but still completely whole — heavy spider-web cracks all over but the surface is unbroken. The top half can be slightly displaced down by 1-2 mm at most, no opening visible inside.

No animal in any frame. Just the egg in 4 stages, in a single horizontal row of 4 frames.

ABSOLUTELY CRITICAL — NO SHADOWS, NO GROUND PLANE, NO GRADIENT:
- The eggs must FLOAT on a perfectly flat solid magenta background.
- ZERO drop shadows under or around the eggs. The magenta touches the egg silhouette directly with no soft shadow falloff.
- NO ground plane / floor / horizon line. The magenta is one uniform color from edge to edge.
- NO gradient. The top of the canvas and bottom of the canvas are EXACTLY the same magenta hex value. No darker top, no lighter bottom.
- Treat this like a flat 2D sticker — the eggs are objects laid on a single flat magenta sheet, not 3D objects sitting in a 3D scene.

{UNIVERSAL}"""


def prompt_owl_penguin() -> str:
    return f"""Regenerate this 8-frame sprite (top row owl, bottom row penguin) — 4 columns × 2 rows, single seamless image with continuous magenta between cells (NO grid lines, NO borders).

OWL ROW (top) — keep the brown/beige owl from the reference:
- Frame 1: closed beige speckled egg with a small horizontal side-to-side crack across the middle. Through the crack, the owl's two large eyes and tiny dark beak are visible. Egg otherwise intact.
- Frame 2: top shell sits on the owl's head like a hat, owl visible from chest up, sitting in the bottom shell half. Owl's wings/feathers rest on the bottom shell rim.
- Frame 3: no top shell, owl standing in the bottom shell half. Owl FACES LEFT (3/4 view, ~15° turn — both eyes still visible, NOT a full profile).
- Frame 4: full standalone owl, no shell, in 3/4 left view (already correct in source).

PENGUIN ROW (bottom) — penguin has black back/head, white belly/face, ORANGE BEAK and feet. Penguin's body is black-and-white, but the EGGSHELL IS NOT.
- Frame 1: closed BEIGE/CREAM speckled egg with brown speckles (SAME EGGSHELL AS THE OWL'S — NOT a black egg, NOT a black-and-white egg, NOT themed to the penguin's coloring). Small horizontal side-to-side crack across the middle. Through the crack, the penguin's small white face and orange beak are visible peeking out. Just like the owl frame 1, but with a small penguin face instead of an owl face.
- Frame 2: BEIGE speckled top shell sits on the penguin's head like a hat. Penguin sits in the BEIGE speckled bottom shell. Penguin's two black flippers REST ON the rim of the bottom shell — flippers visible draped over the top edge of the broken eggshell, like the penguin is leaning out and resting its arms on the eggshell. Flippers must be visible ABOVE the shell rim, NOT tucked inside.
- Frame 3: no top shell, penguin standing in the BEIGE speckled bottom shell half. Penguin FACES LEFT (3/4 view, ~15° turn — both eyes still visible, NOT a full profile).
- Frame 4: full standalone penguin, no shell — black back/head, white belly/face, orange beak/feet, in slight 3/4 left view.

CRITICAL DETAILS:
- Remove ALL small curved motion-line marks ("vibration waves") around eggs in any frame of either row.
- The penguin's egg in frames 1, 2, 3 MUST BE THE SAME BEIGE/CREAM SPECKLED EGGSHELL as the owl's egg. Both rows share the same eggshell. The model has previously incorrectly themed the penguin's egg as black/white — DO NOT do that.
- All 4 owl frames + all 4 penguin frames sit on continuous flat magenta with no dividers between them.

{UNIVERSAL}"""


def prompt_croc_duck() -> str:
    return f"""Regenerate the FIRST attached image (crocodile + duck pair sheet on magenta background — image 2c). Use the SECOND attached image (2a) only as a pose reference for the crocodile's frame 2 hands. Keep frame 1 of both rows exactly as-is. Make these specific changes:

CROCODILE ROW (top):
- Frame 1: keep exactly as reference (2c).
- Frame 2: change the pose so the crocodile's two front arms are RESTING ON the rim of the bottom shell (palms/claws on top of the broken eggshell edge), like the crocodile in the SECOND attached image (2a) frame 2. Arms visible above the shell rim, NOT poking through the shell wall. Keep the same crocodile face/expression and same top+bottom shell.
- Frame 3: same as frame 2 pose (arms resting on bottom shell rim), no top shell, crocodile visible from chest up. Arms still resting on the shell rim, NOT tucked away.
- Frame 4: keep exactly as reference (2c) — full crocodile body.

DUCK ROW (bottom):
- Frame 1: keep exactly as reference (2c).
- Frame 2: keep exactly as reference (2c) — wings raised in cute pose ABOVE the shell rim, not poking through the shell wall.
- Frame 3: change so the duck has WINGS RAISED in the same cute pose as frame 2, while sitting in the bottom shell half (no top shell). Currently in 2c, frame 3 has the duck without raised wings — change it to show wings up like frame 2.
- Frame 4: keep exactly as reference (2c).

{UNIVERSAL}"""


def prompt_dino_dragon() -> str:
    return f"""Regenerate the FIRST attached image (blue dino top row, purple dragon bottom row). Use the SECOND attached image (owl+penguin) frame 1 ONLY as a reference for the egg-crack standard — a SHORTER, WIDER horizontal crack with just the eyes and snout peeking through.

BLUE DINO ROW (top):
- Frame 1: redo the egg crack to match the owl/penguin frame 1 standard — shorter and wider horizontal crack across the middle of the egg, with the dino's eyes and snout barely peeking through. Less broken than the current source.
- Frame 2: keep exactly as source.
- Frame 3: change so the dino has its hands AND legs/feet resting on the bottom shell rim (sitting and gripping the shell with all four limbs visible above the rim). No top shell.
- Frame 4: keep exactly as source.

PURPLE DRAGON ROW (bottom):
- Frame 1: redo the egg crack to match the owl/penguin frame 1 standard — shorter wider horizontal crack with just eyes and snout peeking. Dragon FACES LEFT (3/4 view, ~15°).
- Frame 2: dragon FACES LEFT (already correct in source). Change so SMOKE puffs come out of BOTH nostrils (currently only one), and both smoke trails drift DOWN AND TO THE LEFT (away from the dragon's gaze direction).
- Frame 3: dragon FACES LEFT (3/4 view), smoke from both nostrils drifting down-left, no top shell, dragon visible from waist up in bottom shell. Wings visible.
- Frame 4: full dragon body, FACES LEFT (3/4 view), smoke from both nostrils drifting down-left, AND THE TAIL CURLED UP HIGH (not down). Tail tip raised above the body line in a happy curl.

EGGSHELL ANCHOR: both animals hatch from the SAME beige speckled eggshell as the reference's owl/penguin. Do NOT theme the eggshell green/blue/purple based on the animal. Same beige cream color, same brown speckles, same crack lines across every frame of both rows.

{UNIVERSAL}"""


def prompt_pink_emu() -> str:
    return f"""Regenerate this 8-frame sprite (top row pink bird, bottom row emu). Make these specific changes:

PINK BIRD ROW (top):
- Frame 1: keep exactly as reference.
- Frame 2: keep wings raised up in the same cute pose as reference. Wings ABOVE the shell rim, NOT poking through the shell wall.
- Frame 3: keep the pink bird with wings RAISED UP like frame 2 (visible above the shell rim, no top shell).
- Frame 4: keep exactly as reference.

EMU ROW (bottom):
- Frame 1: keep exactly as reference.
- Frame 2: change so the emu has its small wings TUCKED CLOSE to its body (not spread out). Sitting inside top+bottom shell.
- Frame 3: keep the emu with wings TUCKED close to body, no top shell. FLIP the emu so it FACES LEFT (3/4 view, ~15° turn, both eyes still visible, NOT a full profile).
- Frame 4: keep exactly as reference.

{UNIVERSAL}"""


def prompt_platypus_echidna() -> str:
    return f"""Regenerate the FIRST attached image (platypus top row, echidna bottom row) at HIGHER RESOLUTION (the source is low-res). Use the SECOND attached image (owl+penguin) frame 1 ONLY as the standard for what frame 1 should look like. Keep all eggs/shells, poses, and frame compositions exactly the same EXCEPT:

PLATYPUS ROW (top):
- Frame 1: redo to match owl/penguin frame 1 standard — small horizontal crack with only the platypus beak and eyes peeking through (currently the whole top of head is visible, that's too exposed).
- Frames 2, 3, 4: keep the same pose and shell composition, but make the platypus look HAPPIER — bigger smile, brighter eyes, slight tongue OK if cute.

ECHIDNA ROW (bottom):
- Frame 1: redo to match owl/penguin frame 1 standard — small horizontal crack with only the echidna's snout and eyes peeking through.
- Frames 2 and 4: keep the same pose and shell composition, but make the echidna look HAPPIER.
- Frame 3: FLIP the echidna horizontally so it FACES LEFT (3/4 view, ~15° turn, both eyes still visible, NOT a full profile). Make it look happier as well.

{UNIVERSAL}"""


def prompt_snake_trex() -> str:
    return f"""Regenerate this 8-frame sprite (top row red snake, bottom row T-rex). Make these specific changes:

RED SNAKE ROW (top):
- Frames 1, 2, 3: keep exactly as reference.
- Frame 4: same full snake body and pose, but ADD a small forked pink tongue sticking out of the mouth. Cute, not aggressive.

T-REX ROW (bottom):
- Frame 1: change the T-rex's color from blue/teal to BRIGHT GREEN (forest green or grass green, friendly cartoon dinosaur). REMOVE any horn, spike, or bump from the top of its head — head should be smooth.
- Frame 2: bright green, smooth head (no horn). 3/4 view facing slightly left (~15° turn, both eyes visible, NOT a full profile).
- Frame 3: bright green, smooth head. 3/4 view facing slightly left (~15° turn, both eyes visible, NOT a full profile).
- Frame 4: bright green, smooth head, full T-rex body, 3/4 view facing slightly left (~15° turn, both eyes visible, NOT a full profile, currently faces right).

T-rex looks CUTE and friendly across all frames — soft eyes, gentle smile, no visible sharp teeth or fangs. Same proportions and shell as the reference.

EGGSHELL ANCHOR: both animals hatch from the SAME beige speckled eggshell as the reference. Do NOT theme the eggshell red/green to match the animal. Eggshell stays beige cream with brown speckles.

{UNIVERSAL}"""


def prompt_turtle_bluebird() -> str:
    return f"""Regenerate the FIRST attached image (turtle top row, blue bird bottom row). Use the SECOND attached image (owl+penguin) frame 1 ONLY as reference for the egg-crack standard.

TURTLE ROW (top):
- Frame 1: redo egg crack to match owl/penguin frame 1 — shorter, wider horizontal crack with just turtle's eyes/face peeking. Less broken than current source.
- Frame 2: keep the pose, but the right limb in source looks like a flipper (water turtle). Change it to a stubby LAND-TURTLE LEG with rounded toes, matching the legs visible in frame 3 of the same row.
- Frames 3 and 4: keep exactly as source.

BLUE BIRD ROW (bottom):
- Frame 1: redo egg crack to match owl/penguin frame 1 — shorter, wider horizontal crack with just bird's beak/eyes peeking.
- Frame 2: source shows the bird with what looks like THREE wings/arms — birds have ONLY TWO wings. Remove the extra third limb. Keep both wings raised UP above the shell rim in a cute pose.
- Frame 3: change so blue bird has both WINGS RAISED UP like frame 2 (no top shell, sitting in bottom shell half, wings up).
- Frame 4: full blue bird body, show a small SOFT PINK forked tongue tip in the open beak (cute, not aggressive).

EGGSHELL ANCHOR: both animals hatch from the SAME beige speckled eggshell as the reference. Do NOT theme the eggshell green/blue based on the animal.

{UNIVERSAL}"""


def prompt_chicken_triceratops() -> str:
    return f"""Regenerate this 8-frame sprite (top row yellow chicken, bottom row blue triceratops). Make these specific changes:

CHICKEN ROW (top):
- Frame 1: keep exactly as reference.
- Frame 2: keep wings raised up cute pose exactly as reference.
- Frame 3: change so chicken has both WINGS RAISED UP like frame 2 (no top shell, sitting in bottom shell half, wings up).
- Frame 4: keep exactly as reference (no sparkle artifact on this frame — keep clean).

TRICERATOPS ROW (bottom):
- Frame 1: keep exactly as reference.
- Frame 2: keep exactly as reference (arms resting on shell rim).
- Frame 3: change so triceratops has arms RESTING ON the bottom shell rim, same pose as frame 2 (arms visible above the shell rim, hands gripping). No top shell.
- Frame 4: full triceratops body but REMOVE the sparkle/star artifact in the bottom-right corner — pure clean magenta there.

EGGSHELL ANCHOR: both animals hatch from the SAME beige speckled eggshell. Do NOT theme the eggshell yellow/blue based on the animal.

{UNIVERSAL}"""


# Each task: prompt_fn, source-image keys (in order), output filename.
TASKS = {
    "egg":         (prompt_egg,                ["src_egg"],                                          "01-generic-egg.png"),
    "owl-penguin": (prompt_owl_penguin,        ["src_owl_penguin"],                                  "02-owl-penguin.png"),
    "croc-duck":   (prompt_croc_duck,          ["src_croc_duck_2c", "src_croc_duck_2a"],             "03-crocodile-duck.png"),
    "dino-dragon": (prompt_dino_dragon,        ["src_dino_dragon", "ref_owl_penguin"],               "04-dino-dragon.png"),
    "pink-emu":    (prompt_pink_emu,           ["src_pink_emu"],                                     "05-pinkbird-emu.png"),
    "platypus":    (prompt_platypus_echidna,   ["src_platypus_echidna", "ref_owl_penguin"],          "06-platypus-echidna.png"),
    "snake-trex":  (prompt_snake_trex,         ["src_snake_trex"],                                   "07-snake-trex.png"),
    "turtle-bird": (prompt_turtle_bluebird,    ["src_turtle_bird", "ref_owl_penguin"],               "08-turtle-bluebird.png"),
    "chicken-tri": (prompt_chicken_triceratops,["src_chicken_trex"],                                 "09-chicken-triceratops.png"),
}


def run(task_name: str, model: str = MODEL) -> Path:
    if task_name not in TASKS:
        sys.exit(f"Unknown task: {task_name}. Available: {', '.join(TASKS)}")
    prompt_fn, src_keys, out_name = TASKS[task_name]
    prompt = prompt_fn()

    parts: list = [prompt]
    for k in src_keys:
        path = SRC / SOURCES[k]
        if not path.exists():
            sys.exit(f"Source missing: {path}")
        parts.append(PILImage.open(path))
        print(f"  attaching: {path.name} ({k})")

    print(f"  prompt: {len(prompt)} chars / {len(prompt.split())} words")
    print(f"  model: {model}, aspect: {ASPECT}, resolution: {RESOLUTION}")

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    t = time.time()
    resp = client.models.generate_content(
        model=model,
        contents=parts,
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
            image_config=types.ImageConfig(aspect_ratio=ASPECT, image_size=RESOLUTION),
        ),
    )
    elapsed = time.time() - t

    out_path = OUT / out_name
    saved = False
    for part in resp.parts:
        if part.text:
            print(f"  [text] {part.text[:300]}")
        elif part.inline_data:
            img = PILImage.open(BytesIO(part.inline_data.data))
            img.save(out_path, format="PNG")
            print(f"  [image] saved {out_path} ({img.size[0]}x{img.size[1]}) in {elapsed:.1f}s")
            saved = True
    if not saved:
        sys.exit("No image returned in response")
    return out_path


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("task", nargs="?", help="Task name (or 'all')")
    p.add_argument("--list", action="store_true", help="List task names")
    p.add_argument("--model", default=MODEL, help=f"Model (default: {MODEL})")
    args = p.parse_args()

    if args.list or not args.task:
        print("Tasks:")
        for k, (_, srcs, out) in TASKS.items():
            print(f"  {k:14s} → {out:35s} (sources: {', '.join(srcs)})")
        return

    if not os.environ.get("GEMINI_API_KEY"):
        sys.exit("ERROR: GEMINI_API_KEY env var not set")

    if args.task == "all":
        for name in TASKS:
            print(f"\n=== {name} ===")
            run(name, model=args.model)
    else:
        print(f"\n=== {args.task} ===")
        run(args.task, model=args.model)


if __name__ == "__main__":
    main()
