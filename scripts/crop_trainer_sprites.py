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


if __name__ == "__main__":
    main()
