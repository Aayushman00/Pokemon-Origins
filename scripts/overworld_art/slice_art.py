"""Phase 0 art slice: quiet ground, tree, house, fence and a draft player.

Stands apart from the game's art so the look can be judged before it scales.
Rules live in docs/design/ART_BIBLE.md.
"""
import colorsys
import random
from math import hypot, pi, sin

from PIL import Image, ImageDraw, ImageFilter, ImageOps

from .world_maps import hashed
from .world_palette import LINE, WORLD

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


def _outline(img):
    """Turn every opaque pixel touching transparency into LINE."""
    src, out = img.load(), img.copy()
    dst = out.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            if src[x, y][3] and any(not (0 <= x + dx < w and 0 <= y + dy < h) or not src[x + dx, y + dy][3]
                                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                dst[x, y] = (*rgb(LINE), 255)
    return out


TREE_CLUMPS = {  # (cx, cy, r), back to front: few large shapes, silhouette first
    "A": [(16, 7, 7.5), (8, 12, 7), (24, 12, 7), (11, 18, 7), (21, 18, 7)],
    "B": [(13, 7, 7), (22, 9, 7), (7, 14, 6.5), (25, 16, 6), (15, 17, 8)],
}


def tree(variant):
    """32x32 tree on a transparent ground: broad clumps over a short trunk."""
    leaf, bark = WORLD["leaf"], WORLD["bark"]
    img = Image.new("RGBA", (32, 32))
    d = ImageDraw.Draw(img)
    d.rectangle((13, 23, 18, 30), fill=bark[1])
    d.rectangle((13, 23, 14, 30), fill=bark[0])
    d.rectangle((17, 23, 18, 30), fill=bark[2])
    d.rectangle((13, 23, 18, 25), fill=bark[3])  # canopy shade on the trunk
    clumps = TREE_CLUMPS[variant]
    owner = {}
    for i, (cx, cy, r) in enumerate(clumps):
        for y in range(32):
            for x in range(32):
                if hypot(x + .5 - cx, (y + .5 - cy) * 1.08) < r:
                    owner[x, y] = i
    px = img.load()
    for (x, y), i in owner.items():
        cx, cy, r = clumps[i]
        lit = -((x + .5 - cx) * .5 + (y + .5 - cy) * .85) / r
        tone = 0 if lit > .5 else 1 if lit > .08 else 2 if lit > -.45 else 3
        if owner.get((x, y + 1), i) > i or owner.get((x + 1, y), i) > i:
            tone = 4  # dark seam where a nearer clump overlaps this one
        px[x, y] = (*rgb(leaf[tone]), 255)
    return _outline(img)


HOUSE_DOOR_COL = 1


def _window(d, col):
    """One window inside tile column `col`, with a planter under it."""
    x0, x1 = col * T + 2, col * T + 13
    glass, wood = WORLD["glass"], WORLD["wood"]
    d.rectangle((x0, 54, x1, 66), fill=LINE)
    d.rectangle((x0 + 1, 55, x1 - 1, 59), fill=glass[1])
    d.rectangle((x0 + 1, 60, x1 - 1, 65), fill=glass[2])
    d.line((x0 + 2, 58, x0 + 4, 56), fill=glass[0])
    d.line((x0 + 6, 55, x0 + 6, 65), fill=wood[1])
    d.rectangle((x0 - 1, 67, x1 + 1, 69), fill=wood[2])
    for i, x in enumerate(range(x0, x1 + 1, 2)):  # planter blooms
        d.point((x, 66 + i % 2), fill=("#f4a0a8", "#fff2b0", "#f7d060")[i % 3])


def house():
    """80x80 house, 5x5 tiles: three rows of clay roof, two of wall."""
    roof, wall, stone, wood = WORLD["roof_clay"], WORLD["wall"], WORLD["stone"], WORLD["wood"]
    img = Image.new("RGBA", (80, 80))
    d = ImageDraw.Draw(img)
    # walls
    d.rectangle((5, 46, 74, 77), fill=wall[1])
    d.rectangle((5, 46, 8, 77), fill=wall[0])
    d.rectangle((69, 46, 74, 77), fill=wall[2])
    for y in range(53, 72, 6):
        d.line((9, y, 68, y), fill=wall[2])
    d.rectangle((5, 72, 74, 77), fill=stone[2])
    d.line((5, 72, 74, 72), fill=stone[1])
    d.rectangle((5, 48, 74, 50), fill=wall[3])  # eave shadow
    # roof: front plane between a lit left and a shaded right side plane
    for y in range(5, 46):
        t = (y - 5) / 40
        outer, inner = round(9 - 8 * t), round(15 - 6 * t)
        d.line((outer, y, inner - 1, y), fill=roof[0])
        d.line((80 - inner, y, 79 - outer, y), fill=roof[3])
        band = (y - 5) // 6
        d.line((inner, y, 79 - inner, y), fill=roof[1] if band < 3 else roof[2])
        if (y - 5) % 6 == 5:
            d.line((inner, y, 79 - inner, y), fill=roof[3])
        elif (y - 5) % 6 in (2, 3, 4):
            for x in range(inner + (band % 2) * 5, 80 - inner, 10):
                d.point((x, y), fill=roof[2] if band < 3 else roof[3])
    d.rectangle((1, 46, 78, 47), fill=roof[4])
    d.line((9, 4, 70, 4), fill=roof[0])
    # chimney
    d.rectangle((54, 0, 62, 15), fill=stone[1])
    d.rectangle((54, 0, 56, 15), fill=stone[0])
    d.rectangle((60, 0, 62, 15), fill=stone[2])
    d.rectangle((53, 0, 63, 2), fill=stone[3])
    # door
    dx = HOUSE_DOOR_COL * T
    d.rectangle((dx + 2, 54, dx + 13, 77), fill=LINE)
    d.rectangle((dx + 3, 55, dx + 12, 77), fill=wood[1])
    d.rectangle((dx + 3, 55, dx + 4, 77), fill=wood[0])
    d.rectangle((dx + 11, 55, dx + 12, 77), fill=wood[2])
    d.rectangle((dx + 5, 58, dx + 10, 61), fill=WORLD["glass"][1])
    d.point((dx + 10, 67), fill=WORLD["roof_clay"][0])
    d.rectangle((dx, 78, dx + 15, 79), fill=stone[1])
    _window(d, 2)
    _window(d, 3)
    return _outline(img)


def fence(tiles, vertical=False):
    """Post and rail fence. Vertical runs are drawn as their own art, posts stacked."""
    f = WORLD["fence"]
    if vertical:
        img = Image.new("RGBA", (T, tiles * T))
        d = ImageDraw.Draw(img)
        d.rectangle((6, 0, 9, tiles * T - 1), fill=f[1])
        d.line((6, 0, 6, tiles * T - 1), fill=f[0])
        d.line((9, 0, 9, tiles * T - 1), fill=f[2])
        for y in range(3, tiles * T, 8):
            d.rectangle((4, y, 11, y + 3), fill=f[1])
            d.line((4, y, 11, y), fill=f[0])
            d.line((4, y + 3, 11, y + 3), fill=f[2])
        return _outline(img)
    img = Image.new("RGBA", (tiles * T, T))
    d = ImageDraw.Draw(img)
    for y in (7, 11):
        d.rectangle((0, y, tiles * T - 1, y + 1), fill=f[1])
        d.line((0, y + 1, tiles * T - 1, y + 1), fill=f[2])
    for x in range(2, tiles * T, 8):
        d.rectangle((x, 4, x + 3, 14), fill=f[1])
        d.rectangle((x, 4, x, 14), fill=f[0])
        d.rectangle((x + 3, 5, x + 3, 14), fill=f[2])
    return _outline(img)


PLAYER_MATS = {
    "o": LINE, "H": "#6e6088", "h": "#4a4260", "d": "#352f48", "s": "#f4cba4", "S": "#d89e80", "e": LINE,
    "K": "#7fd0c0", "j": "#3fa79f", "J": "#2a7480", "a": "#f6b94c", "A": "#cf7f34", "b": "#9a6a44",
    "p": "#55587c", "P": "#3c3d60", "w": "#7a4c3a",
}
PLAYER_DOWN = """
.......oo.......
......ohHo......
....oohHHhoo....
...ohHHHhhhho...
..ohHHhhhhhhho..
..ohhhhhhhhhdo..
..ohhsshhsshdo..
..ohsssssssSdo..
..ossesssseSSo..
..ossesssseSSo..
...osssssSSSo...
....oaaaaaAo....
...oKaaaaAAjo...
..oKjjbajaAjJo..
..ojojjbjaAoJo..
..ojojjjbjAoJo..
..osojjjjbjoSo..
...ooJJJJJJoo...
....opppPPPo....
....opppoPPo....
....opppoPPo....
....oppPoPPo....
...owwwwowwwo...
...oooooooooo...
"""
PLAYER_UP = """
.......oo.......
......ohHo......
....oohHHhoo....
...ohHHHhhhho...
..ohHHhhhhhhho..
..ohHhhhhhhhdo..
..ohhhhhhhhhdo..
..ohhhhhhhhhdo..
..ohhhhhhhhddo..
...ohhhhhdddo...
....odddddoo....
....oaaaaaAo....
...oKaaaaAAjo...
..oKjjaAjjjjJo..
..ojojaAjjjoJo..
..ojojaAjjjoJo..
..osojjjjjjoSo..
...ooJJJJJJoo...
....opppPPPo....
....opppoPPo....
....opppoPPo....
....oppPoPPo....
...owwwwowwwo...
...oooooooooo...
"""
PLAYER_LEFT = """
........oo......
.......ohHo.....
.....oohHHhoo...
....ohHHHhhhho..
...ohHHhhhhhhho.
...ohhhhhhhhhdo.
...ohsshhhhhhdo.
..osssssshhhhdo.
..ossessssShhdo.
..ossesssSShdo..
...ossssSSddo...
....oaaaaaAo....
....oaaaaAAaao..
....oKjjjjJaAo..
....oKjbjjJoo...
....ojsbjjJo....
....ojsjbbJo....
....oJJJbbJo....
.....oppPPo.....
.....oppPPo.....
.....oppPPo.....
.....oppPPo.....
....owwwwwo.....
....oooooo......
"""


def _sprite(text):
    """A 24-row grid sitting on the bottom of a 16x32 cell."""
    rows = text.split()
    img = Image.new("RGBA", (T, 32))
    for y, row in enumerate(rows, 32 - len(rows)):
        for x, c in enumerate(row):
            if c != ".":
                img.putpixel((x, y), (*rgb(PLAYER_MATS[c]), 255))
    return img


def player_frames():
    """Draft stand frames. Scarf and hair tuft carry the silhouette; walk cycles wait for Phase 3."""
    left = _sprite(PLAYER_LEFT)
    return {"down": _sprite(PLAYER_DOWN), "up": _sprite(PLAYER_UP), "left": left, "right": ImageOps.mirror(left)}
