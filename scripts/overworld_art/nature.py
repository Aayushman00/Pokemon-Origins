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
from .world_palette import LINE, SHADOW, TALL, WORLD

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


# Which clumps of a canopy block take another tone. Only clumps wholly inside
# the block change, so tones follow tree shapes and nothing breaks at a seam.
CANOPY_TONES = {"sun": ("leaf_sun", 0), "deep": ("leaf_deep", 1), "amber": ("leaf_amber", 2)}


@lru_cache(None)
def _canopy(tone=None):
    """32x32 leaf pattern that wraps, so a forest has no seams and no gaps."""
    ramp, pick = CANOPY_TONES.get(tone, ("leaf", None))
    inside = [i for i, (cx, cy, r) in enumerate(CANOPY_CLUMPS) if r <= cx <= 32 - r and r <= cy <= 32 - r]
    chosen = set(inside[pick % len(inside)::2 if tone != "amber" else len(inside)]) if tone and inside else set()
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
        out[x, y] = rgba(WORLD[ramp if i in chosen else "leaf"][tone])
    return img


def forest_tile(mask, phase, tone=None):
    """Canopy mass. The south rim drops to shaded undergrowth with trunks."""
    body = _shape(mask, phase, blur=3, salt=1.1)
    top = _shape(mask, phase, blur=3, salt=1.1, dy=6)
    canopy = {k: body[k] and top[k] for k in body}
    pattern, bark = _canopy(tone).load(), WORLD["bark"]
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


# Each tuft fans from its root: x offset, how far the tip bends, height lost, tone.
# Outer blades go down first, so the lit middle lies over them.
BLADES = ((-4, -2, 3, 3), (4, 2, 3, 3), (-3, -2, 2, 2), (3, 2, 1, 2), (-2, -1, 1, 1), (2, 1, 2, 2), (-1, -1, 0, 1), (1, 1, 1, 1), (0, 0, 0, 1))


def _tuft(put, cx, base, seed, frame, ramp):
    r = random.Random(f"tall{seed}")
    lean = r.choice((-1, 0, 0, 1)) + (frame if r.random() < .6 else 0)
    height = r.randint(7, 8)
    for x, bend, short, tone in BLADES:
        tall = height - short
        for i in range(tall):
            t = i / (tall - 1)
            tip = i == tall - 1 and tone == 1
            put(round(cx + x * (1 - .35 * t) + (bend + lean) * t * t), base - i, ramp[0] if tip else ramp[tone])


def tall_grass(biome, mask, phase, frame):
    """Rows of tufts that run on across tiles, so a patch reads as one field.
    `mask` holds N/E/S/W bits for open sides: tufts past them are left out and
    the gaps stay see-through, so the patch ends in tips, not a square. Tiles
    alternate `phase` to double the repeat."""
    ramp = TALL[biome]
    img = Image.new("RGBA", (T, T))
    px = img.load()

    def put(x, y, tone):
        if 0 <= x < T and 0 <= y < T:
            px[x, y] = rgba(tone)

    for cx, base in ((4, 7), (12, 7), (0, 15), (8, 15), (16, 15)):
        if (cx == 0 and mask & Wb) or (cx == T and mask & E):
            continue
        _tuft(put, cx, base, (cx + T * phase) % 32 + base * 32, frame, ramp)

    drawn = {(x, y) for x in range(T) for y in range(T) if px[x, y][3]}

    def closed(x, y, dx, dy, bit):
        """Blades lie that way, or the patch runs on past the tile."""
        while 0 <= x < T and 0 <= y < T:
            if (x, y) in drawn:
                return True
            x, y = x + dx, y + dy
        return not mask & bit

    for x in range(T):
        for y in range(T):
            if (x, y) not in drawn and all(closed(x, y, *d, bit) for d, bit in SIDES.items()):
                px[x, y] = rgba(ramp[3])
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


def _decal():
    img = Image.new("RGBA", (T, T))
    return img, ImageDraw.Draw(img)


def pebbles():
    img, d = _decal()
    stone = WORLD["stone"]
    for x, y, w in ((3, 9, 3), (8, 11, 2), (10, 6, 2)):
        d.rectangle((x, y, x + w, y + 1), fill=stone[1])
        d.line((x, y, x + w - 1, y), fill=stone[0])
        d.line((x, y + 2, x + w, y + 2), fill=stone[3])
    return img


def mushrooms():
    img, d = _decal()
    cap = WORLD["cap"]
    for x, y, r in ((4, 8, 3), (10, 10, 2)):
        d.rectangle((x, y + 1, x + 1, y + 4), fill="#efe6d0")
        d.line((x + 1, y + 2, x + 1, y + 4), fill="#c8bca4")
        d.rectangle((x - r, y - 1, x + r + 1, y + 1), fill=cap[1])
        d.line((x - r + 1, y - 2, x + r, y - 2), fill=cap[0])
        d.line((x - r, y + 1, x + r + 1, y + 1), fill=cap[2])
        d.point((x - 1, y), fill="#fff4e0")
    return img


def reeds():
    img, d = _decal()
    reed = WORLD["reed"]
    for x, top in ((3, 3), (6, 6), (9, 2), (12, 7)):
        d.line((x, top, x, 15), fill=reed[1])
        d.point((x + 1, top + 5), fill=reed[0])
    for x, top in ((3, 3), (9, 2)):
        d.rectangle((x, top, x + 1, top + 3), fill=reed[2])
    return img


def lily(bloom):
    img, d = _decal()
    pad = WORLD["lily"]
    for x, y in ((3, 4), (9, 9)):
        d.ellipse((x, y, x + 5, y + 3), fill=pad[1])
        d.line((x + 1, y, x + 4, y), fill=pad[0])
        d.point((x + 3, y + 2), fill=pad[0])
    if bloom:
        d.rectangle((5, 4, 6, 5), fill=pad[2])
        d.point((5, 3), fill="#ffffff")
    return img


def doormat():
    img, d = _decal()
    d.rectangle((3, 0, 12, 4), fill="#c8a870")
    d.line((3, 4, 12, 4), fill="#9c7a58")
    for x in range(4, 12, 2):
        d.line((x, 1, x, 2), fill="#a88a5c")
    return img


def crops(kind):
    """Opaque tilled soil in rows, planted with leafy heads or sprouts."""
    soil, leaf = WORLD["soil"], WORLD["leaf"]
    img = Image.new("RGBA", (T, T), rgba(soil[1]))
    d = ImageDraw.Draw(img)
    for y in (3, 11):
        d.rectangle((0, y + 3, 15, y + 4), fill=soil[2])
        d.line((0, y + 2, 15, y + 2), fill=soil[0])
        for x in (3, 11):
            if kind:
                d.rectangle((x - 2, y - 1, x + 2, y + 2), fill=leaf[2])
                d.line((x - 1, y - 1, x + 1, y - 1), fill=leaf[0])
                d.point((x, y + 1), fill=leaf[3])
            else:
                d.line((x, y - 1, x, y + 2), fill=leaf[2])
                d.point((x - 1, y), fill=leaf[1])
                d.point((x + 1, y - 1), fill=leaf[1])
    return img


def ledge(part):
    """South-facing drop, one tile: a lip of grass hanging over an earth face.
    `part` is l, m or r; the ends curl back into the ground."""
    earth, lawn = WORLD["ledge"], WORLD["lawn"]
    img, _ = _decal()
    px = img.load()
    for x in range(T):
        inset = {"l": max(0, 4 - x), "r": max(0, x - 11)}.get(part, 0)
        hang = 8 + (0, 1, 2, 1, 0, 1)[x % 6]
        for y in range(4 + inset, 15 - inset // 2):
            if y <= hang:
                tone = lawn[0] if y == 4 + inset else lawn[1]
            elif y == hang + 1:
                tone = earth[2]  # shade under the overhang
            elif y >= 14 - inset // 2:
                tone = earth[2]
            else:
                tone = earth[2] if (x * 3 + y) % 11 == 0 else earth[0] if x % 5 == 1 else earth[1]
            px[x, y] = rgba(tone)
    return img


def standing_tree(kind):
    """32x32 lone tree with a ground shadow. F bears fruit."""
    from .slice_art import tree
    img = tree("B" if kind == "B" else "A")
    px = img.load()
    if kind == "F":
        for x, y in ((9, 8), (19, 6), (24, 12), (13, 14), (6, 15), (20, 18), (11, 20)):
            for dx, dy, c in ((0, 0, "#e0584c"), (1, 0, "#e0584c"), (0, 1, "#a83c38"), (1, 1, "#a83c38")):
                px[x + dx, y + dy] = rgba(c)
            px[x, y] = rgba("#ffb4a0")
    colour, opacity = SHADOW
    tone = (*rgb(colour), round(opacity * 255))
    for y in range(27, 32):
        for x in range(32):
            if not px[x, y][3] and ((x - 17) / 11) ** 2 + ((y - 29) / 2.6) ** 2 < 1:
                px[x, y] = tone
    return img


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
