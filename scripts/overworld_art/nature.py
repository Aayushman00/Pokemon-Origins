"""Nature tileset: trail, lawn, forest canopy, pond, fence, tall grass, decor.

Rules: docs/design/ART_BIBLE.md. Blob tiles come from one idea: blur the 3x3
neighbourhood a mask describes, add low-frequency noise, threshold. The noise
repeats every 32px, so a blob tile depends on its mask plus its position
parity (`phase`), and each mask has four variants.
"""
import random
from functools import lru_cache
from math import hypot

from PIL import Image, ImageDraw, ImageFilter

from .slice_art import T, _lawn, _outline, _trail, _wave, meadow, rgb
from .tiles_v2 import E, N, NE, NW, S, SE, SW, Wb
from .world_palette import LINE, SHADOW, WORLD

SIDES = {(0, -1): N, (1, 0): E, (0, 1): S, (-1, 0): Wb}
CORNERS = {(1, -1): NE, (1, 1): SE, (-1, 1): SW, (-1, -1): NW}
STEPS = ((1, 0), (-1, 0), (0, 1), (0, -1))


def rgba(h):
    return (*rgb(h), 255)


def _cells(mask):
    """Mask bits mean "outside". Returns the 3x3 neighbourhood as inside flags."""
    inside = {(0, 0): True}
    for d, bit in SIDES.items():
        inside[d] = not mask & bit
    for (dx, dy), bit in CORNERS.items():
        inside[dx, dy] = inside[dx, 0] and inside[0, dy] and not mask & bit
    return inside


@lru_cache(None)
def _blurred(mask, blur):
    img = Image.new("L", (3 * T, 3 * T), 0)
    for (dx, dy), on in _cells(mask).items():
        if on:
            img.paste(255, ((dx + 1) * T, (dy + 1) * T, (dx + 2) * T, (dy + 2) * T))
    return img.filter(ImageFilter.GaussianBlur(blur))


def _shape(mask, phase, blur=4, salt=2.6, level=127, dy=0):
    """Inside flags for the tile plus a 1px margin, keyed by (x, y)."""
    px = _blurred(mask, blur).load()
    return {(x, y): px[T + x, T + y + dy] + _wave(x + T * phase[0], y + T * phase[1], salt) > level
            for x in range(-1, T + 1) for y in range(-1, T + 1)}


def _on_edge(shape, x, y):
    return any(not shape[x + dx, y + dy] for dx, dy in STEPS)


def _variant(phase):
    return phase[0] + 2 * phase[1]


def trail_tile(mask, phase):
    """Transparent outside the trail, so it lies over meadow or lawn alike."""
    shape = _shape(mask, phase)
    surface, rim = _trail(_variant(phase)).load(), rgba(WORLD["trail"][3])
    img = Image.new("RGBA", (T, T))
    out = img.load()
    for y in range(T):
        for x in range(T):
            if shape[x, y]:
                out[x, y] = rim if _on_edge(shape, x, y) else surface[x, y]
    return img


def lawn_tile(mask, phase):
    shape = _shape(mask, phase, salt=1.3)
    img = meadow(_variant(phase)).copy()
    surface, rim, out = _lawn(_variant(phase)).load(), rgba(WORLD["lawn"][0]), img.load()
    for y in range(T):
        for x in range(T):
            if shape[x, y]:
                out[x, y] = rim if _on_edge(shape, x, y) else surface[x, y]
    return img


CANOPY_CLUMPS = [(8, 6, 10), (25, 4, 10), (16, 17, 11), (0, 20, 10), (31, 21, 9), (9, 29, 10), (24, 31, 10)]


@lru_cache(None)
def _canopy():
    """32x32 leaf pattern that wraps, so a forest has no seams and no gaps."""
    leaf = WORLD["leaf"]
    owner, img = {}, Image.new("RGBA", (32, 32))
    out = img.load()

    def wrapped(a, b):
        return (a - b + 16) % 32 - 16

    for y in range(32):
        for x in range(32):
            for i, (cx, cy, r) in enumerate(CANOPY_CLUMPS):
                if hypot(wrapped(x, cx), wrapped(y, cy)) < r:
                    owner[x, y] = i
    for (x, y), i in owner.items():
        cx, cy, r = CANOPY_CLUMPS[i]
        lit = -(wrapped(x, cx) * .5 + wrapped(y, cy) * .85) / r
        tone = 1 if lit > .45 else 2 if lit > -.15 else 3
        if owner.get((x, (y + 1) % 32), i) != i or owner.get(((x + 1) % 32, y), i) != i:
            tone = 4
        out[x, y] = rgba(leaf[tone])
    return img


def forest_tile(mask, phase):
    """Canopy mass. The south rim drops to shaded undergrowth with trunks."""
    body = _shape(mask, phase, blur=3, salt=1.1)
    top = _shape(mask, phase, blur=3, salt=1.1, dy=6)
    canopy = {k: body[k] and top[k] for k in body}
    pattern, bark = _canopy().load(), WORLD["bark"]
    trunk = (4, 9) if phase[0] else (9, 14)
    img = Image.new("RGBA", (T, T))
    out = img.load()
    for y in range(T):
        for x in range(T):
            if canopy[x, y]:
                out[x, y] = rgba(LINE) if _on_edge(canopy, x, y) else pattern[(x + T * phase[0]) % 32, (y + T * phase[1]) % 32]
            elif body[x, y]:
                if trunk[0] <= x <= trunk[1]:
                    edge = x in trunk
                    out[x, y] = rgba(bark[3] if edge else bark[1 if x - trunk[0] < 3 else 2])
                else:
                    out[x, y] = rgba(WORLD["leaf"][4])
    return img


def pond_tile(mask, frame):
    """Opaque: meadow, an earth bank, then water with drifting ripples."""
    phase = (0, 0)
    bank, water = _shape(mask, phase, salt=.5), _shape(mask, phase, salt=.5, level=165)
    deep = _shape(mask, phase, salt=.5, level=225)
    w, b = WORLD["water"], WORLD["bank"]
    img = meadow(0).copy()
    out = img.load()
    for y in range(T):
        for x in range(T):
            if water[x, y]:
                out[x, y] = rgba(w[3] if _on_edge(water, x, y) else w[2] if deep[x, y] else w[1])
            elif bank[x, y]:
                out[x, y] = rgba(b[1] if y > 7 else b[0])
    rng = random.Random(7)
    for _ in range(4):
        x, y = rng.randrange(T), rng.randrange(T)
        for i in range(3):
            px = (x + i + frame * 5) % T
            if deep[px, y]:
                out[px, y] = rgba(w[0])
    return img


def fence_tile(links):
    """Post and rail. `links` holds N/E/S/W bits for neighbouring fence cells."""
    f = WORLD["fence"]
    img = Image.new("RGBA", (T, T))
    d = ImageDraw.Draw(img)
    left, right = (0 if links & Wb else 7), (T - 1 if links & E else 8)
    for y in (7, 11):
        if links & (E | Wb):
            d.rectangle((left, y, right, y + 1), fill=f[1])
            d.line((left, y + 1, right, y + 1), fill=f[2])
    d.rectangle((6, 0 if links & N else 3, 9, T - 1 if links & S else 13), fill=f[1])
    d.line((6, 0 if links & N else 3, 6, T - 1 if links & S else 13), fill=f[0])
    d.line((9, 0 if links & N else 3, 9, T - 1 if links & S else 13), fill=f[2])
    if links & (N | S):
        for y in range(3, T, 8):
            d.line((6, y, 9, y), fill=f[3])
    out = _outline(img, closed=False, line=f[3])
    _cast(out)
    return out


def _cast(img):
    """A translucent contact shadow on the two pixels below an object."""
    colour, opacity = SHADOW
    tone = (*rgb(colour), round(opacity * 255))
    px = img.load()
    for x in range(T):
        for y in range(T - 2, -1, -1):
            if px[x, y][3] == 255 and not px[x, y + 1][3]:
                for yy in range(y + 1, min(y + 3, T)):
                    px[x, yy] = tone
                break


def tall_grass(frame):
    """Opaque clumps on meadow: dense tufts, each tile reads as a plant."""
    g = WORLD["tall"]
    img = meadow(0).copy()
    d = ImageDraw.Draw(img)
    for cx, base in ((3, 8), (11, 7), (7, 15), (15, 15), (-1, 15)):
        lean = frame if cx % 8 == 3 else 1 - frame
        d.polygon(((cx - 3, base), (cx + 3, base), (cx + lean, base - 7)), fill=g[2])
        d.line((cx - 2, base, cx - 1 + lean, base - 5), fill=g[1])
        d.line((cx + 2, base, cx + 1 + lean, base - 4), fill=g[3])
        d.line((cx - 3, base, cx + 3, base), fill=g[3])
        d.point((cx + lean, base - 6), fill=g[0])
    return img


def tufts(seed):
    rng = random.Random(f"tufts{seed}")
    img = Image.new("RGBA", (T, T))
    dark, light = rgba(WORLD["lawn"][2]), rgba(WORLD["lawn"][0])
    for _ in range(3):
        x, y = rng.randint(2, 11), rng.randint(3, 12)
        for dx, c in ((0, dark), (2, dark), (1, light)):
            img.putpixel((x + dx, y), c)
        img.putpixel((x + 1, y + 1), dark)
    return img


BLOOMS = (("#f6a6b6", "#d86a88"), ("#fff4c4", "#e8c870"), ("#f4c0f0", "#b870c8"))


def _bloom(px, x, y, kind):
    petal, core = BLOOMS[kind]
    for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1)):
        px[x + dx, y + dy] = rgba(petal)
    px[x, y] = rgba("#f7c850" if kind != 1 else "#e88a40")
    px[x + 1, y + 1] = rgba(core)
    px[x, y + 2] = rgba(WORLD["lawn"][2])


def flowers(seed, frame):
    rng = random.Random(f"flowers{seed}")
    img = Image.new("RGBA", (T, T))
    px = img.load()
    for x, y in ((3, 3), (10, 2), (6, 9), (12, 10), (2, 11)):
        _bloom(px, x + rng.randint(-1, 1), y + (frame if rng.random() < .5 else 0), rng.randrange(3))
    return img


def plank(across=True):
    """Bridge deck, boards laid across the direction of travel. `across` is an
    east-west bridge; False turns it for north-south. Dark rails on the open sides."""
    wood = WORLD["wood"]
    img = Image.new("RGBA", (T, T))
    px = img.load()
    for y in range(T):
        for x in range(T):
            tone = (3, 0, 1, 1)[x % 4]
            if x % 4 == 2 and y in (2, 13):
                tone = 2  # nail heads
            px[x, y] = rgba(wood[3 if y in (0, T - 1) else tone])
    return img if across else img.transpose(Image.TRANSPOSE)


def bush():
    leaf = WORLD["leaf"]
    img = Image.new("RGBA", (T, T))
    px = img.load()
    for y in range(T):
        for x in range(T):
            r = hypot(x + .5 - 8, (y + .5 - 7.5) * 1.1)
            if r < 7.5:
                lit = -((x - 7.5) * .5 + (y - 7) * .85) / 7.5
                px[x, y] = rgba(leaf[1 if lit > .45 else 2 if lit > -.1 else 3])
    out = _outline(img)
    _cast(out)
    return out
