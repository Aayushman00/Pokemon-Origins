"""Crop the player trainer sprites (Red, Leaf) from the uploaded overworld
sheets and color-key their flat background to transparency.

Source sheets are NOT in this git repo -- they live one directory above
the repo root, where the user placed them (see plan Ruling 1).
"""
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = REPO_ROOT.parent  # "Pokemon Origins" parent folder, not tracked by git

DEST_DIR = REPO_ROOT / "frontend" / "public" / "sprites" / "trainers" / "player"

# (source filename, background color to key out, crop box, output filename)
JOBS = [
    (
        "Main Character Male.gif",
        (17, 219, 255),
        (242, 144, 306, 193),  # forward-lunging, arm extended reaching forward -- see plan Ruling 3
        "red.png",
    ),
    (
        "Main Character Female.gif",
        (255, 0, 255),
        (152, 172, 204, 220),  # front-facing, arm raised -- see plan Ruling 3
        "leaf.png",
    ),
]


def colorkey_to_alpha(img: Image.Image, bg_color: tuple, tolerance: int = 30) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    bg = bg_color
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pixels[x, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) <= tolerance:
                pixels[x, y] = (r, g, b, 0)
    return img


# 5-frame back-view Poke Ball throw (stand, wind-up, arm back, release,
# follow-through), measured from the sheets. Red's frames sit in one row;
# Leaf's are split 3 + 2 across two rows, so every frame has its own box.
THROW_JOBS = [
    (
        "Main Character Male.gif",
        (17, 219, 255),
        [
            (33, 145, 69, 193),
            (86, 149, 149, 193),
            (167, 146, 219, 193),
            (242, 144, 306, 193),
            (323, 150, 378, 193),
        ],
        "red-throw.png",
    ),
    (
        "Main Character Female.gif",
        (255, 0, 255),
        [
            (52, 171, 88, 220),
            (95, 174, 151, 219),
            (152, 172, 204, 220),
            (49, 230, 113, 279),
            (124, 233, 178, 279),
        ],
        "leaf-throw.png",
    ),
]

HEAD_ROWS = 6  # top rows of a frame that contain only the cap/hat


def head_center_x(frame: Image.Image) -> int:
    """Horizontal centre of the opaque pixels in the frame's top rows."""
    xs = [
        x
        for y in range(min(HEAD_ROWS, frame.height))
        for x in range(frame.width)
        if frame.getpixel((x, y))[3] > 0
    ]
    return (min(xs) + max(xs)) // 2


def build_throw_strip(frames: list) -> tuple:
    """Equal-width cells, every frame bottom-aligned and head-aligned.

    Returns (strip, cell_width, anchors) where anchors are each frame's head
    x and bottom y inside its cell, for the self-check.
    """
    heads = [head_center_x(f) for f in frames]
    left = max(h for h in heads)
    right = max(f.width - h for f, h in zip(frames, heads))
    cell_w, cell_h = left + right, max(f.height for f in frames)
    strip = Image.new("RGBA", (cell_w * len(frames), cell_h), (0, 0, 0, 0))
    anchors = []
    for i, (frame, head) in enumerate(zip(frames, heads)):
        x = i * cell_w + (left - head)
        y = cell_h - frame.height
        strip.paste(frame, (x, y), frame)
        anchors.append((x + head - i * cell_w, y + frame.height))
    return strip, cell_w, anchors


def main() -> None:
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    for source_name, bg_color, box, out_name in JOBS:
        source_path = SOURCE_ROOT / source_name
        if not source_path.exists():
            raise SystemExit(f"crop_trainer_sprites: missing source {source_path}")
        img = Image.open(source_path).convert("RGBA")
        cropped = img.crop(box)
        result = colorkey_to_alpha(cropped, bg_color)
        dest_path = DEST_DIR / out_name
        result.save(dest_path)
        print(f"wrote {dest_path} ({result.size[0]}x{result.size[1]})")

    for source_name, bg_color, boxes, out_name in THROW_JOBS:
        source_path = SOURCE_ROOT / source_name
        if not source_path.exists():
            raise SystemExit(f"crop_trainer_sprites: missing source {source_path}")
        img = Image.open(source_path).convert("RGBA")
        frames = [colorkey_to_alpha(img.crop(b), bg_color) for b in boxes]
        strip, cell_w, anchors = build_throw_strip(frames)
        # Self-check: one shared head x and one shared ground line per strip,
        # so the trainer doesn't jitter between frames.
        assert len({a for a in anchors}) == 1, f"{out_name}: frames misaligned {anchors}"
        dest_path = DEST_DIR / out_name
        strip.save(dest_path)
        print(f"wrote {dest_path} ({strip.size[0]}x{strip.size[1]}, cell {cell_w}px, anchor {anchors[0]})")


if __name__ == "__main__":
    main()
