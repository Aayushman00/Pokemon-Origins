"""One 240x160 Dawnbrook screen in the new look, beside the current game.

  python -m scripts.overworld_art.slice_scene

Writes docs/design/art-slice/. The game's tilesets and maps are not touched.
"""
from pathlib import Path

from PIL import Image, ImageDraw

from .render_map import render
from .slice_art import T, fence, ground_layer, house, player_frames, rgb, tree
from .tiles import new_tiles
from .world_palette import LINE, SHADOW

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "design" / "art-slice"

GRID = [
    "lllllllllllllll",
    "lllllllllllllll",
    "ll.............",
    "ll..lllllll.ll.",
    "ll..lllllll.ll.",
    "ll..lllllll.ll.",
    "ll..lllllll.ll.",
    "ll....,........",
    "ll,,,,,,,,,,,,,",
    "ll,,,,,,,,,,,,,",
]
HOUSE_AT = (5, 2)
PLAYER_AT = (6, 7)  # the feet tile, just below the door
TREES = [(x, 0, "AB"[x // 2 % 2]) for x in range(0, 15, 2)] + [(0, y, "BA"[y // 2 % 2]) for y in (2, 4, 6, 8)]
FLOWERS = [(12, 3), (13, 3), (12, 4), (13, 4), (12, 5), (13, 5), (3, 6), (3, 7)]


def _shadow(layer, x0, y0, x1, y1):
    colour, opacity = SHADOW
    ImageDraw.Draw(layer).ellipse((x0, y0, x1, y1), fill=(*rgb(colour), round(opacity * 255)))


def scene():
    img = ground_layer(GRID)
    flower = dict(new_tiles())["flowers0"]
    frames = player_frames()
    px, py = PLAYER_AT[0] * T, PLAYER_AT[1] * T
    hx, hy = HOUSE_AT[0] * T, HOUSE_AT[1] * T
    objects = [(house(), hx, hy), (frames["down"], px, py - T), (fence(4), 11 * T, 6 * T), (fence(4, vertical=True), 11 * T, 3 * T)]
    objects += [(tree(v), x * T, y * T) for x, y, v in TREES]
    objects += [(flower, x * T, y * T) for x, y in FLOWERS]

    shadows = Image.new("RGBA", img.size)
    _shadow(shadows, hx + 4, hy + 72, hx + 86, hy + 86)
    _shadow(shadows, px + 2, py + 11, px + 14, py + 16)
    _shadow(shadows, 11 * T, 6 * T + 11, 15 * T + 8, 6 * T + 19)
    _shadow(shadows, 11 * T + 6, 3 * T + 2, 11 * T + 16, 7 * T)
    for x, y, _ in TREES:
        _shadow(shadows, x * T + 5, y * T + 26, x * T + 30, y * T + 34)
    img.alpha_composite(shadows)
    for sprite, x, y in sorted(objects, key=lambda o: o[2] + o[0].height):
        img.alpha_composite(sprite, (max(x, 0), max(y, 0)))
    return img


def before():
    """The same screen of the current game: Dawnbrook tiles x 0-14, y 2-11."""
    return render("dawnbrook").crop((0, 2 * T, 15 * T, 12 * T))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    after = scene()
    big = lambda im: im.resize((im.width * 3, im.height * 3), Image.NEAREST)
    after.save(OUT / "slice_1x.png")
    big(after).save(OUT / "slice_3x.png")
    pair = Image.new("RGBA", (720 * 2 + 16, 480), (*rgb(LINE), 255))
    pair.paste(big(before()), (0, 0))
    pair.paste(big(after), (736, 0))
    pair.save(OUT / "before_after.png")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
