"""Generate a flat, un-blurred elliptical battlefield shadow.

This is not cropped from an external source -- FRLG's own battle shadows
are simple flat ellipses, cheap to draw directly and safer than hunting
for a pre-made asset with an unknown license. See plan Ruling 3/4.
"""
from pathlib import Path

from PIL import Image, ImageDraw

REPO_ROOT = Path(__file__).resolve().parents[1]
DEST_PATH = REPO_ROOT / "frontend" / "public" / "shadows" / "oval.png"

CANVAS_SIZE = (200, 60)  # padding around the ellipse so nothing gets clipped when scaled
ELLIPSE_BOX = (10, 10, 190, 50)  # 180x40 flat ellipse, centered with 10px padding
SHADOW_COLOR = (20, 20, 20, 89)  # ~35% opacity (89/255), flat, no blur -- see plan Ruling 4


def main() -> None:
    DEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse(ELLIPSE_BOX, fill=SHADOW_COLOR)
    img.save(DEST_PATH)
    print(f"wrote {DEST_PATH} ({img.size[0]}x{img.size[1]})")


if __name__ == "__main__":
    main()
