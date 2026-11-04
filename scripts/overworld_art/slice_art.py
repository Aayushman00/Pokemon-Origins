"""Phase 0 art slice: quiet ground, tree, house, fence and a draft player.

Stands apart from the game's art so the look can be judged before it scales.
Rules live in docs/design/ART_BIBLE.md.
"""
import colorsys
import random
from math import pi, sin

from PIL import Image, ImageFilter

from .world_maps import hashed
from .world_palette import WORLD

T = 16


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def opaque(img):
    rgba = img.convert("RGBA")
    return [c for c in (rgba.getpixel((x, y)) for y in range(rgba.height) for x in range(rgba.width)) if c[3]]


def luma(img):
    """Rec.601 luma of every opaque pixel, 0-1."""
    return [(.299 * r + .587 * g + .114 * b) / 255 for r, g, b, _ in opaque(img)]


def mean_saturation(img):
    px = opaque(img)
    return sum(colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)[1] for r, g, b, _ in px) / len(px)


def _surface(ramp, variant, marks):
    """A 16x16 tile of ramp[1] with a few seeded `marks(rng, tile)` kept off its edges."""
    t = Image.new("RGBA", (T, T), (*rgb(WORLD[ramp][1]), 255))
    marks(random.Random(f"{ramp}{variant}"), t)
    return t


def _flecks(ramp, count, tones):
    def marks(rng, t):
        for _ in range(count):
            x, y = rng.randint(2, 12), rng.randint(2, 13)
            tone = (*rgb(WORLD[ramp][rng.choice(tones)]), 255)
            t.putpixel((x, y), tone)
            if rng.random() < .5:
                t.putpixel((x + 1, y), tone)
    return marks


def meadow(variant):
    return _surface("meadow", variant, _flecks("meadow", 3 + variant % 2, (0, 2)))


def _lawn(variant):
    def marks(rng, t):  # small grass tufts, not noise
        for _ in range(2):
            x, y = rng.randint(3, 11), rng.randint(3, 12)
            dark, light = (*rgb(WORLD["lawn"][2]), 255), (*rgb(WORLD["lawn"][0]), 255)
            t.putpixel((x, y), dark)
            t.putpixel((x + 2, y), dark)
            t.putpixel((x + 1, y + 1), dark)
            t.putpixel((x + 1, y), light)
    return _surface("lawn", variant, marks)


def _trail(variant):
    return _surface("trail", variant, _flecks("trail", 3, (0, 2, 2)))


SURFACES = {".": meadow, "l": _lawn, ",": _trail}


def _wave(x, y, salt):
    """Low-frequency edge noise. Period 16, so a tile depends only on its
    neighbours and Phase 1 can cut this into a blob tile set."""
    return (sin(2 * pi * (x + 2 * y) / 16 + salt) + sin(2 * pi * (2 * x - y) / 16 + 2 * salt)) * 22


def _field(cells, material):
    """Blurred mask of `material`, padded by one replicated cell on each side."""
    h, w = len(cells), len(cells[0])
    img = Image.new("L", ((w + 2) * T, (h + 2) * T), 0)
    for y in range(-1, h + 1):
        for x in range(-1, w + 1):
            if cells[min(max(y, 0), h - 1)][min(max(x, 0), w - 1)] == material:
                img.paste(255, ((x + 1) * T, (y + 1) * T, (x + 2) * T, (y + 2) * T))
    return img.filter(ImageFilter.GaussianBlur(4)).load()


def ground_layer(cells):
    """Paint rows of "." meadow, "l" lawn, "," trail. Corners round off and
    edges wander because each pixel takes the strongest blurred material."""
    h, w = len(cells), len(cells[0])
    fields = {m: _field(cells, m) for m in SURFACES}
    salts = {".": 0.0, "l": 1.3, ",": 2.6}
    owner = {}
    for py in range(h * T):
        for px in range(w * T):
            owner[px, py] = max(SURFACES, key=lambda m: fields[m][px + T, py + T] + _wave(px, py, salts[m]))
    tiles = {(m, v): SURFACES[m](v).load() for m in SURFACES for v in range(4)}
    out = Image.new("RGBA", (w * T, h * T))
    px_out = out.load()
    rims = {",": (*rgb(WORLD["trail"][3]), 255), "l": (*rgb(WORLD["lawn"][0]), 255)}
    for (px, py), m in owner.items():
        v = hashed(px // T, py // T) % 4
        px_out[px, py] = tiles[m, v][px % T, py % T]
        if m in rims and any(owner.get((px + dx, py + dy), m) != m for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            px_out[px, py] = rims[m]
    return out
