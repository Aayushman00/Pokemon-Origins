"""Building kit and props, drawn whole and cut into tiles. Nothing is stretched:
each building is placed at its own size. Rules: docs/design/ART_BIBLE.md.
"""
from math import hypot

from PIL import Image, ImageDraw

from .nature import _canopy, _cast, rgba
from .slice_art import T, _outline, building
from .world_palette import LINE, WORLD

HEART = ["..x.x..", ".xxxxx.", ".xxxxx.", "..xxx..", "...x..."]
STAR = ["...x...", "..xxx..", "xxxxxxx", "..xxx..", ".x...x."]


def _emblem(d, cx, cy, glyph, colour):
    """A white plate with a glyph, sitting on the fascia above the door."""
    d.rectangle((cx - 6, cy - 4, cx + 6, cy + 4), fill=LINE)
    d.rectangle((cx - 5, cy - 3, cx + 5, cy + 3), fill=WORLD["wall"][0])
    for y, row in enumerate(glyph):
        for x, c in enumerate(row):
            if c == "x":
                d.point((cx - 3 + x, cy - 2 + y), fill=colour)


def _awning(d, x0, x1, colour):
    for x in range(x0, x1 + 1):
        d.line((x, 48, x, 52), fill=colour if (x - x0) // 3 % 2 == 0 else WORLD["wall"][0])
    d.line((x0, 53, x1, 53), fill=WORLD["wall"][3])


def _finish(img):
    return _outline(img)


def home(roof, door_col=2, windows=(1, 3)):
    return lambda: _finish(building(5, roof, door_col, windows, chimney=3))


def lab():
    """Seven wide, with a small observatory dome on the ridge."""
    img = building(7, "roof_slate", 3, (1, 2, 4, 5))
    d = ImageDraw.Draw(img)
    glass, stone = WORLD["glass"], WORLD["stone"]
    d.pieslice((40, 2, 71, 33), 180, 360, fill=stone[1])
    d.pieslice((43, 5, 68, 30), 180, 360, fill=glass[2])
    d.pieslice((43, 5, 56, 30), 180, 270, fill=glass[1])
    d.line((56, 5, 56, 17), fill=stone[3])
    d.rectangle((38, 18, 73, 22), fill=stone[2])
    d.line((38, 18, 73, 18), fill=stone[0])
    return _finish(img)


def center():
    img = building(6, "roof_rose", 3, (1, 4), glass_door=True)
    d = ImageDraw.Draw(img)
    _awning(d, 36, 75, WORLD["roof_rose"][2])
    _emblem(d, 56, 42, HEART, WORLD["roof_rose"][2])
    return _finish(img)


def mart():
    img = building(6, "roof_sky", 3, (1, 4), glass_door=True)
    d = ImageDraw.Draw(img)
    _awning(d, 36, 75, WORLD["roof_sky"][2])
    _emblem(d, 56, 42, STAR, WORLD["roof_sky"][2])
    return _finish(img)


def trunk_gym():
    """Mossgate's Gym: a hollow trunk with a lit archway, 6x5 tiles."""
    bark, lawn = WORLD["bark"], WORLD["lawn"]
    img = Image.new("RGBA", (96, 80))
    px = img.load()
    for y in range(20, 80):
        flare = max(0, y - 58) ** 2 / 34
        left, right = round(14 - flare), round(81 + flare)
        for x in range(max(left, 0), min(right, 95) + 1):
            t = (x - left) / (right - left)
            tone = 0 if t < .16 else 1 if t < .66 else 2
            if (x + (y // 7) % 3) % 11 == 0:
                tone = 3 if tone else 1
            px[x, y] = rgba(bark[tone])
    pattern = _canopy().load()
    for y in range(0, 42):
        for x in range(96):
            if any(hypot(x - cx, y - cy) < r for cx, cy, r in ((18, 19, 18), (46, 15, 20), (77, 19, 18), (32, 26, 13), (62, 26, 13))):
                px[x, y] = pattern[x % 32, y % 32]
    d = ImageDraw.Draw(img)
    for x, y, r in ((12, 72, 5), (30, 66, 3), (78, 70, 4), (86, 76, 4)):  # moss on the roots
        d.ellipse((x - r, y - r // 2, x + r, y + r // 2), fill=lawn[1])
    d.pieslice((47, 50, 64, 70), 180, 360, fill=LINE)
    d.rectangle((47, 60, 64, 79), fill=LINE)
    d.pieslice((49, 52, 62, 68), 180, 360, fill="#f7c850")
    d.rectangle((49, 60, 62, 79), fill="#d88a3c")
    d.rectangle((49, 74, 62, 79), fill=WORLD["trail"][2])
    return _finish(img)


BUILDINGS = {  # name: (draw, door column)
    "home_clay": (home("roof_clay"), 2),
    "home_slate": (home("roof_slate"), 2),
    "home_moss": (home("roof_moss"), 2),
    "lab": (lab, 3),
    "care_center": (center, 3),
    "corner_shop": (mart, 3),
    "trunk_gym": (trunk_gym, 3),
}


WINDOWS = {"home_clay": (1, 3), "home_slate": (1, 3), "home_moss": (1, 3), "lab": (1, 2, 4, 5),
           "care_center": (1, 4), "corner_shop": (1, 4)}


def _prop(draw, size=(T, T)):
    img = Image.new("RGBA", size)
    draw(ImageDraw.Draw(img))
    out = _outline(img)
    if size[1] == T:
        _cast(out)
    return out


def _lamp(d):
    s, w = WORLD["stone"], WORLD["wood"]
    d.rectangle((7, 11, 8, 30), fill=s[3])
    d.line((7, 11, 7, 30), fill=s[2])
    d.rectangle((5, 29, 10, 31), fill=s[3])
    d.rectangle((5, 4, 10, 10), fill="#ffe59a")
    d.rectangle((9, 5, 10, 10), fill="#f4bf58")
    d.rectangle((4, 3, 11, 3), fill=w[3])
    d.rectangle((6, 1, 9, 2), fill=w[3])


def _sign(d):
    w = WORLD["wood"]
    d.rectangle((7, 10, 8, 14), fill=w[2])
    d.rectangle((2, 2, 13, 10), fill=w[1])
    d.rectangle((2, 2, 13, 3), fill=w[0])
    for y in (5, 7):
        d.line((4, y, 11, y), fill=w[3])


def _mailbox(d):
    s = WORLD["fence"]
    d.rectangle((7, 10, 8, 14), fill=WORLD["wood"][2])
    d.rectangle((3, 3, 12, 10), fill=s[1])
    d.rectangle((3, 3, 12, 4), fill=s[0])
    d.rectangle((10, 5, 12, 10), fill=s[2])
    d.rectangle((12, 1, 13, 4), fill=WORLD["roof_clay"][2])


def _well(d):
    s, w, water = WORLD["stone"], WORLD["wood"], WORLD["water"]
    d.rectangle((2, 3, 3, 22), fill=w[2])
    d.rectangle((12, 3, 13, 22), fill=w[2])
    d.polygon(((0, 8), (7, 0), (8, 0), (15, 8)), fill=WORLD["roof_clay"][2])
    d.line((0, 8, 7, 0), fill=WORLD["roof_clay"][0])
    d.rectangle((1, 18, 14, 30), fill=s[1])
    d.rectangle((1, 18, 14, 19), fill=s[0])
    d.rectangle((3, 20, 12, 23), fill=water[3])
    for y in (25, 28):
        d.line((1, y, 14, y), fill=s[2])
    for x in (4, 9):
        d.line((x, 25, x, 28), fill=s[2])


def _bench(d):
    w = WORLD["wood"]
    d.rectangle((1, 3, 14, 6), fill=w[1])
    d.line((1, 3, 14, 3), fill=w[0])
    d.rectangle((1, 8, 14, 10), fill=w[0])
    for x in (2, 12):
        d.rectangle((x, 11, x + 1, 14), fill=w[3])


def _barrel(d):
    w, s = WORLD["wood"], WORLD["stone"]
    d.rectangle((3, 2, 12, 14), fill=w[1])
    d.rectangle((3, 2, 5, 14), fill=w[0])
    d.rectangle((10, 2, 12, 14), fill=w[2])
    for y in (4, 11):
        d.line((3, y, 12, y), fill=s[3])


def _crate(d):
    w = WORLD["wood"]
    d.rectangle((2, 3, 13, 14), fill=w[1])
    d.rectangle((2, 3, 13, 4), fill=w[0])
    d.line((2, 3, 13, 14), fill=w[2])
    d.line((13, 3, 2, 14), fill=w[2])


PROPS = {
    "lamp": _prop(_lamp, (T, 2 * T)),
    "well": _prop(_well, (T, 2 * T)),
    "sign": _prop(_sign),
    "mailbox": _prop(_mailbox),
    "bench": _prop(_bench),
    "barrel": _prop(_barrel),
    "crate": _prop(_crate),
}
