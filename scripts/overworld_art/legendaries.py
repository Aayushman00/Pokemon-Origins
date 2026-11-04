"""Legendary Pokemon overworld sprites + the Legend Grove showcase map.

  frontend/public/sprites/overworld/legendary/<dex>.png   64x32: 2 idle frames of 32x32
  frontend/public/sprites/overworld/legendary/manifest.json   names + shiny palette maps
  frontend/public/maps/legend_grove.json                  a clearing with all of them

Articuno #144, Zapdos #145, Moltres #146, Mewtwo #150, Mew #151.

Each sprite is painted from simple shapes in named colour ROLES (base,
light, dark, outline...). Light comes from the top-left: a rim pass turns
role pixels next to empty space into that role's light / dark tone, then a
1 px outline goes round the silhouette. Idle: birds flap (wings up / down),
Mew hovers (bobs 2 px), Mewtwo's tail sways.

Shiny = palette swap, not new art: the manifest maps every normal colour to
its shiny colour and the game recolours the sheet at load time. The ground
shadow is drawn by the renderer (no semi-transparent pixels in the sheets).
Battle front/back sprites already exist under sprites/battle/<dex>/.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "frontend" / "public" / "sprites" / "overworld" / "legendary"
S = 32


class Paint:
    def __init__(self):
        self.g = [[None] * S for _ in range(S)]

    def px(self, x, y, role):
        if 0 <= x < S and 0 <= y < S:
            self.g[y][x] = role

    def ell(self, cx, cy, rx, ry, role):
        for y in range(S):
            for x in range(S):
                if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                    self.g[y][x] = role

    def poly(self, pts, role):
        for y in range(S):
            for x in range(S):
                px, py, inside = x + 0.5, y + 0.5, False
                for i in range(len(pts)):
                    (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % len(pts)]
                    if (y1 > py) != (y2 > py) and px < (x2 - x1) * (py - y1) / (y2 - y1) + x1:
                        inside = not inside
                if inside:
                    self.g[y][x] = role

    def line(self, pts, role, w=1):
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = max(abs(x1 - x0), abs(y1 - y0), 1)
            for i in range(n + 1):
                x = round(x0 + (x1 - x0) * i / n)
                y = round(y0 + (y1 - y0) * i / n)
                for dx in range(w):
                    for dy in range(w):
                        self.px(x + dx - w // 2, y + dy - w // 2, role)

    def shade(self, groups):
        """groups: {role: (light_role, dark_role)}. Top/left edges light,
        bottom/right edges dark (only where the neighbour is empty or another group)."""
        src = [r[:] for r in self.g]
        for y in range(S):
            for x in range(S):
                role = src[y][x]
                if role not in groups:
                    continue
                light, dark = groups[role]
                up = src[y - 1][x] if y else None
                left = src[y][x - 1] if x else None
                down = src[y + 1][x] if y < S - 1 else None
                right = src[y][x + 1] if x < S - 1 else None
                if down not in (role, light, dark) or right not in (role, light, dark):
                    self.g[y][x] = dark
                elif up not in (role, light, dark) or left not in (role, light, dark):
                    self.g[y][x] = light

    def outline(self, role="ol"):
        src = [r[:] for r in self.g]
        for y in range(S):
            for x in range(S):
                if src[y][x] is not None:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < S and 0 <= ny < S and src[ny][nx] not in (None, role):
                        self.g[y][x] = role
                        break

    def shift(self, dy):
        out = [[None] * S for _ in range(S)]
        for y in range(S):
            if 0 <= y + dy < S:
                out[y + dy] = self.g[y][:]
        self.g = out

    def image(self, pal):
        img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        p = img.load()
        for y in range(S):
            for x in range(S):
                role = self.g[y][x]
                if role is not None:
                    h = pal[role]
                    p[x, y] = (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)
        return img


def mirror_pts(pts):
    return [(S - x, y) for x, y in pts]


def wing_detail(p, mask, shoulder, roles, tips, tip_frac=0.68):
    """Feather structure on a wing mask (set of pixels): darker tips past
    tip_frac of the reach, a feather shaft from near the shoulder out to every
    spike tip of the wing outline, one row of rounded covert scallops (light
    crown, shadow beneath), and a lit leading edge."""
    from math import hypot
    sx, sy = shoulder
    reach = max(hypot(x + 0.5 - sx, y + 0.5 - sy) for x, y in mask)
    for x, y in mask:
        if hypot(x + 0.5 - sx, y + 0.5 - sy) > reach * tip_frac:
            p.g[y][x] = roles["tip"]
    for tx, ty in tips:                                       # feather shafts
        d = hypot(tx - sx, ty - sy)
        if d < reach * 0.5:
            continue
        n = int(d)
        for i in range(int(n * 0.35), n):
            x = round(sx + (tx - sx) * i / n)
            y = round(sy + (ty - sy) * i / n)
            if (x, y) in mask:
                p.g[y][x] = roles["sep"]
    for x, y in mask:                                         # covert scallops
        d = hypot(x + 0.5 - sx, y + 0.5 - sy)
        if 3.4 <= d < 4.4 and (x + y) % 3 == 0:
            p.g[y][x] = roles["covert"]
        elif 4.4 <= d < 5.4 and (x + y) % 3 == 1:
            p.g[y][x] = roles["sep"]
    for x, y in mask:
        if (x, y - 1) not in mask and p.g[y][x] != roles["tip"]:
            p.g[y][x] = roles["edge"]


def poly_mask(pts):
    p = Paint()
    p.poly(pts, "m")
    return {(x, y) for y in range(S) for x in range(S) if p.g[y][x] == "m"}


def toes(p, x, y, role, claw):
    p.line([(x, y - 3), (x, y)], role)
    for dx in (-1, 0, 1):
        p.px(x + dx, y, role)
    p.px(x - 2, y + 1, claw)
    p.px(x, y + 1, claw)
    p.px(x + 2, y + 1, claw)


# =================================================================== Articuno
ARTICUNO = {
    "ol": "#1c2c60", "deep": "#2c5ca8", "dark": "#4c8ad0", "base": "#7cc4f0", "light": "#b8e4ff",
    "frost": "#ffffff", "belly": "#e2f4ff", "belly_lo": "#a8d0ee", "eye": "#e04838", "beak": "#9aa0be",
    "beak_lo": "#5c5e7c", "leg": "#6c6e8c",
}
ARTICUNO_SHINY = {
    "ol": "#1c4a58", "deep": "#3c8aa8", "dark": "#68b8d0", "base": "#a4e4f0", "light": "#dcfaff",
    "frost": "#fffff4", "belly": "#f4fffc", "belly_lo": "#c4e6ec", "eye": "#f07c2e", "beak": "#b4b6c8",
    "beak_lo": "#6c6e84", "leg": "#7a7694",
}


def articuno(f):
    p = Paint()
    up = f == 0
    # long streamer tail: three segments, lit top edge, feather notches
    tail = [(18, 21), (23, 25), (27, 27), (31, 28)]
    p.line(tail, "base", 3)
    p.line([(19, 21), (24, 24), (28, 26), (31, 27)], "light")
    for x, y in ((22, 25), (25, 26), (28, 28)):
        p.px(x, y, "deep")
    # wings
    wing = [(13, 14), (5, 3), (1, 5), (1, 10), (4, 14), (11, 19)] if up else [(13, 15), (3, 14), (0, 18), (3, 23), (11, 21)]
    masks = []
    for pts in (wing, mirror_pts(wing)):
        p.poly(pts, "base")
        masks.append(poly_mask(pts))
    p.ell(16, 19, 6, 7, "base")
    p.ell(16, 11, 4.2, 4.2, "base")
    p.shade({"base": ("light", "dark")})
    from math import pi
    for side, mask in zip((-1, 1), masks):
        mask = {(x, y) for x, y in mask if p.g[y][x] in ("base", "light", "dark")}
        shoulder = (16 + side * 3, 15)
        pts = wing if side < 0 else mirror_pts(wing)
        wing_detail(p, mask, shoulder, {"tip": "deep", "sep": "dark", "covert": "light", "edge": "light"}, pts)
    # chest: pale belly with V feather scales
    p.ell(15.6, 20.5, 3.4, 4.8, "belly")
    for cx, cy in ((14, 18), (17, 20), (14, 22)):                         # three V scales
        p.px(cx - 1, cy, "belly_lo")
        p.px(cx, cy + 1, "belly_lo")
        p.px(cx + 1, cy, "belly_lo")
    p.line([(14, 25), (17, 25)], "belly_lo")
    # crest: three curved plumes with lit tips
    for pts, role in (([(15, 8), (14, 5), (12, 2), (11, 0)], "dark"), ([(16, 7), (16, 3), (17, 0)], "deep"),
                      ([(17, 8), (19, 5), (21, 2), (22, 1)], "dark")):
        p.line(pts, role)
        p.px(*pts[-1], "light")
    p.px(16, 1, "frost")
    # face: fierce brow, red eyes, two-tone beak
    for x in (14, 18):
        p.px(x, 11, "eye")
        p.px(x, 10, "deep")
        p.px(x + (1 if x < 16 else -1), 10, "deep")
    p.px(13, 12, "light")
    p.px(16, 12, "beak")
    p.px(16, 13, "beak")
    p.px(17, 13, "beak_lo")
    p.px(16, 14, "beak_lo")
    # frost glints on the wings
    for x, y in ((6, 6), (25, 6)) if up else ((5, 17), (26, 17)):
        p.px(x, y, "frost")
    toes(p, 14, 28, "leg", "ol")
    toes(p, 18, 28, "leg", "ol")
    p.outline()
    return p


# ===================================================================== Zapdos
ZAPDOS = {
    "ol": "#3a2410", "yellow": "#f8d040", "ylight": "#fff28c", "ydark": "#c08c28", "ydeep": "#8a5a20",
    "black": "#2e2a44", "beak": "#f07c2e", "beak_hi": "#f8b070", "beak_lo": "#a84c24", "eye": "#ffffff",
    "leg": "#e88848",
}
ZAPDOS_SHINY = {
    "ol": "#4a2410", "yellow": "#f8a838", "ylight": "#ffd888", "ydark": "#c07028", "ydeep": "#8a4818",
    "black": "#4a2a44", "beak": "#d85040", "beak_hi": "#f08870", "beak_lo": "#8a2c30", "eye": "#fff6d0",
    "leg": "#d86a48",
}


def zapdos(f):
    p = Paint()
    up = f == 0
    wing = ([(13, 14), (9, 8), (8, 11), (4, 2), (4, 8), (1, 4), (2, 11), (0, 12), (4, 15), (11, 19)] if up
            else [(13, 15), (7, 12), (6, 15), (1, 14), (3, 18), (0, 21), (5, 21), (3, 25), (11, 21)])
    masks = []
    for pts in (wing, mirror_pts(wing)):
        p.poly(pts, "yellow")
        masks.append(poly_mask(pts))
    p.ell(16, 19, 5, 6, "yellow")
    p.ell(16, 11, 3.6, 3.6, "yellow")
    crest = [(13, 10), (11, 2), (14, 6), (16, 0), (18, 6), (21, 2), (19, 10)]
    p.poly(crest, "yellow")
    p.shade({"yellow": ("ylight", "ydark")})
    for side, mask in zip((-1, 1), masks):
        mask = {(x, y) for x, y in mask if p.g[y][x] in ("yellow", "ylight", "ydark")}
        shoulder = (16 + side * 3, 15)
        pts = wing if side < 0 else mirror_pts(wing)
        wing_detail(p, mask, shoulder, {"tip": "ydeep", "sep": "ydark", "covert": "ylight", "edge": "ylight"},
                    pts, tip_frac=0.8)
        # black spike tips: wing pixels that are the far end of a spike
        for x, y in mask:
            n = sum((x + dx, y + dy) in mask for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if n <= 1:
                p.g[y][x] = "black"
    for x, y in ((11, 2), (16, 0), (21, 2)):                              # crest spike tips
        p.px(x, y, "black")
    p.line([(15, 3), (16, 7)], "ylight")
    # chest: zig-zag feathering
    p.line([(13, 20), (14, 22), (15, 20), (16, 22), (17, 20), (18, 22), (19, 20)], "ydark")
    p.line([(14, 24), (16, 23), (18, 24)], "ydark")
    # beak: long, lit top, dark lower edge, nostril
    p.poly([(14.5, 12), (17.5, 12), (16, 18)], "beak")
    p.line([(15, 12), (16, 15)], "beak_hi")
    p.line([(17, 13), (16, 17)], "beak_lo")
    p.px(16, 13, "beak_lo")
    # eyes: white with a pupil, under a heavy brow
    for x, side in ((14, -1), (18, 1)):
        p.px(x, 11, "eye")
        p.px(x - side, 11, "black")
        p.px(x, 10, "ydeep")
        p.px(x - side, 10, "ydeep")
    toes(p, 14, 28, "leg", "ol")
    toes(p, 18, 28, "leg", "ol")
    p.outline()
    return p


# ==================================================================== Moltres
MOLTRES = {
    "ol": "#5a2010", "body": "#f8c040", "blight": "#fff09a", "bdark": "#d08828", "flame_r": "#e83828",
    "flame_o": "#f88830", "flame_y": "#ffd848", "flame_w": "#fffce0", "beak": "#d8d4e4", "beak_lo": "#8e8aa8",
    "eye": "#2e2a44", "leg": "#a87850",
}
MOLTRES_SHINY = {
    "ol": "#5a1838", "body": "#f8a8b8", "blight": "#ffd8e0", "bdark": "#d07088", "flame_r": "#d82868",
    "flame_o": "#f070a0", "flame_y": "#ffb0d0", "flame_w": "#fff0f8", "beak": "#e8e4f0", "beak_lo": "#9a96b0",
    "eye": "#3a2a44", "leg": "#b07888",
}


def flame_fill(p, pts, f, cx, cy):
    """Layered flame inside a polygon: red tongues at the rim, then orange,
    yellow, and a white-hot core nearest (cx, cy). Rim flickers with frame f."""
    from math import hypot
    mask = poly_mask(pts)
    reach = max(hypot(x - cx, y - cy) for x, y in mask)
    for x, y in mask:
        d = hypot(x + 0.5 - cx, y + 0.5 - cy) / reach
        jitter = ((x * 7 + y * 13 + f * 5) % 7) / 40
        k = d + jitter
        role = "flame_w" if k < 0.3 else "flame_y" if k < 0.55 else "flame_o" if k < 0.8 else "flame_r"
        p.px(x, y, role)
    # ragged tongues: drop some rim pixels, flicker per frame
    for x, y in mask:
        edge = any((x + dx, y + dy) not in mask for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        if edge and (x * 3 + y + f * 2) % 5 == 0:
            p.g[y][x] = None
    return mask


def moltres(f):
    p = Paint()
    up = f == 0
    wing = ([(13, 14), (8, 9), (6, 2), (4, 7), (1, 1), (1, 9), (0, 13), (5, 15), (11, 19)] if up
            else [(13, 15), (6, 13), (2, 11), (3, 16), (0, 19), (3, 21), (1, 26), (7, 22), (11, 21)])
    for pts in (wing, mirror_pts(wing)):
        sx = 13 if pts is wing else 19
        flame_fill(p, pts, f, sx, 16)
    flame_fill(p, [(16, 22), (21, 24), (27, 22), (25, 26), (31, 28), (23, 30), (17, 26)], f, 17, 24)   # tail
    p.ell(16, 19, 5, 6, "body")
    p.ell(16, 11, 3.6, 3.6, "body")
    p.shade({"body": ("blight", "bdark")})
    for y in (17, 19, 21):                                                  # scalloped body feathers
        for x in range(13, 20, 2):
            p.px(x + (y // 2) % 2, y, "bdark")
    p.ell(15, 20, 1.5, 2, "blight")
    crest = ([(14, 9), (12, 2), (15, 5), (16, 0), (17, 5), (20, 2), (18, 9)] if up
             else [(14, 9), (13, 1), (15, 4), (17, 0), (18, 5), (21, 3), (18, 9)])
    flame_fill(p, crest, f, 16, 8)
    p.poly([(15, 12), (17.5, 12), (16, 16)], "beak")
    p.line([(17, 13), (16, 15)], "beak_lo")
    for x in (14, 18):
        p.px(x, 11, "eye")
        p.px(x, 10, "bdark")
    p.px(13, 10, "flame_w")
    toes(p, 14, 28, "leg", "ol")
    toes(p, 18, 28, "leg", "ol")
    p.outline()
    return p


# ==================================================================== Mewtwo
# Hand-drawn pixel grids (every pixel chosen), not shapes: the body is one
# grid; the tail is a separate layer behind it so the idle can sway it.
MEWTWO = {
    "ol": "#3a2a4a", "grey": "#d8d4e4", "glight": "#f6f4fc", "gdark": "#a8a2c0", "gdeep": "#7e7896",
    "purple": "#9a68c8", "plight": "#c4a0e8", "pdark": "#6a4098", "eye": "#5a2a88",
}
MEWTWO_SHINY = {
    "ol": "#2a3a2a", "grey": "#dce4d4", "glight": "#f6fcf2", "gdark": "#a8bca0", "gdeep": "#7a9076",
    "purple": "#68b858", "plight": "#a0e090", "pdark": "#3c8040", "eye": "#2a6a30",
}
MEWTWO_KEY = {"K": "ol", "W": "glight", "g": "grey", "d": "gdark", "D": "gdeep",
              "P": "plight", "p": "purple", "q": "pdark", "e": "eye"}

MEWTWO_BODY = [
    "................................",
    "...........K........K...........",
    "..........KWK......KgK..........",
    "..........KgdKKKKKKdgK..........",
    "...........KWggggggdK...........",
    "..........KWgDggggDgdK..........",
    "..........KggeDggDegdK..........",
    "...........KgggggggdK...........",
    "............KggddgdK............",
    ".............KDggdKKDK..........",
    "...........KKWggggdDDK..........",
    "........KKKWggggggggdKKK........",
    ".......KWgKgWgggggggddKgdK......",
    ".......KggKgggdggdgggdKgdK......",
    ".......KggKdggggggggddKgdK......",
    ".......KgdKKdPppppppqdKKgdK.....",
    ".......KgdK.KPpppppqqK.KgdK.....",
    "......KWggdKKqqqqqqqqKKggdK.....",
    "......KgWgdK.KPppppqK.KgggdK....",
    "......KgggdK.KPppppqK.KggddK....",
    "......KDgDK..KKqqqqKK..KDgDK....",
    ".......KKK..KWggKKggdK..KKK.....",
    "...........KWgggKKgggdK.........",
    "...........KggggK.KggddK........",
    "...........KgggdK.KgdddK........",
    "............KgdK...KgdK.........",
    "............KgdK...KgdK.........",
    "............KgdK...KgdK.........",
    "...........KWgdK...KgddK........",
    "..........KWgggdK.KggdddK.......",
    "..........KKKKKKK.KKKKKKK.......",
    "................................",
]


def grid_layer(p, rows, key):
    for y, row in enumerate(rows):
        assert len(row) == S, (y, len(row), row)
        for x, ch in enumerate(row):
            if ch != ".":
                p.px(x, y, key[ch])


def mewtwo(f):
    p = Paint()
    # tail behind the body: thick, curls up on his right; sways per frame
    path = [(21, 22), (25, 25), (28, 23), (29, 19), (28, 15)] if f == 0 else [(21, 22), (25, 26), (29, 24), (30, 20), (30, 16)]
    p.line(path, "purple", 3)
    tip = path[-1]
    p.ell(tip[0] + 0.5, tip[1] + 0.5, 1.8, 2.2, "purple")
    lit = [(22, 21), (25, 24), (27, 22), (28, 18)] if f == 0 else [(22, 21), (25, 25), (28, 23), (29, 19)]
    p.line(lit, "plight")
    for x, y in ((24, 26), (28, 24)) if f == 0 else ((24, 27), (29, 25)):
        p.px(x, y, "pdark")
    p.outline()
    grid_layer(p, MEWTWO_BODY, MEWTWO_KEY)
    return p


# ======================================================================= Mew
MEW = {"ol": "#8a3a5a", "pink": "#f8b4cc", "plight": "#ffdcea", "pdark": "#e080a8", "pdeep": "#c05888",
       "eye": "#3c62b0", "eye_dk": "#1c2c60", "eye_lt": "#6c9ce8", "eyehi": "#ffffff"}
MEW_SHINY = {"ol": "#3a4a8a", "pink": "#a8c8f8", "plight": "#dceaff", "pdark": "#7898e0", "pdeep": "#5070c0",
             "eye": "#3c8a50", "eye_dk": "#1c4c28", "eye_lt": "#70c070", "eyehi": "#fffff4"}
MEW_KEY = {"K": "ol", "P": "plight", "p": "pink", "d": "pdark", "q": "pdeep",
           "E": "eye_dk", "e": "eye", "L": "eye_lt", "H": "eyehi"}

MEW_BODY = [
    "................................",
    "................................",
    "................................",
    "..........K..........K..........",
    ".........KPK........KdK.........",
    ".........KpqK......KqdK.........",
    ".........KpqqKKKKKKqqdK.........",
    "........KPpppPPPPPPpppdK........",
    "........KPpPPpppppppppdK........",
    ".......KPppppppppppppppdK.......",
    ".......KpppEEppppppEEppdK.......",
    ".......KpppHeppppppHeppdK.......",
    ".......KpppLLppppppLLppdK.......",
    "........KdpppppqqppppddK........",
    ".........KddppppppppddK.........",
    "..........KKdPPPPPPdKK..........",
    ".........KpKPPPPPPPPKdK.........",
    "........KppKpPPPPPPdKpdK........",
    ".........KKKpPPPPPPdKKK.........",
    "...........KppPPPPddK...........",
    "..........KpppppppdddK..........",
    ".........KPpdKKKKKKpddK.........",
    ".........KPpdK....KppdK.........",
    ".........KpqqK....KpqqK.........",
    "..........KKK......KKK..........",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
]


def mew(f):
    p = Paint()
    # long thin tail behind: from the right hip, curving up to an oval tip
    path = [(21, 20), (25, 22), (27, 20), (28, 15), (27, 10), (26, 7)] if f == 0 else \
           [(21, 20), (25, 23), (28, 21), (29, 16), (28, 11), (27, 8)]
    p.line(path, "pink", 2)
    p.line([(x - 1, y) for x, y in path[2:]], "plight")
    tip = path[-1]
    p.ell(tip[0] + 0.5, tip[1] - 1.5, 2.3, 3.0, "pink")
    p.px(tip[0] - 1, tip[1] - 3, "plight")
    p.px(tip[0], tip[1] - 3, "plight")
    p.px(tip[0] + 1, tip[1] - 1, "pdark")
    p.px(tip[0] + 1, tip[1], "pdark")
    p.outline()
    grid_layer(p, MEW_BODY, MEW_KEY)
    p.shift(0 if f == 0 else -2)                                       # hover bob
    return p


ROSTER = [
    (144, "Articuno", articuno, ARTICUNO, ARTICUNO_SHINY),
    (145, "Zapdos", zapdos, ZAPDOS, ZAPDOS_SHINY),
    (146, "Moltres", moltres, MOLTRES, MOLTRES_SHINY),
    (150, "Mewtwo", mewtwo, MEWTWO, MEWTWO_SHINY),
    (151, "Mew", mew, MEW, MEW_SHINY),
]
FLYING = {144, 145, 146, 151}   # the renderer separates their shadow from the body


def sheet(fn, pal):
    img = Image.new("RGBA", (2 * S, S), (0, 0, 0, 0))
    for f in range(2):
        img.alpha_composite(fn(f).image(pal), (f * S, 0))
    return img


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for dex, name, fn, pal, shiny in ROSTER:
        sheet(fn, pal).save(OUT / f"{dex}.png")
        assert set(pal) == set(shiny), name
        assert len(set(pal.values())) == len(pal), f"{name}: two roles share a colour"
        manifest.append({"dex": dex, "name": name, "sprite": f"legend_{dex}", "flying": dex in FLYING,
                         "shiny": {pal[k]: shiny[k] for k in pal}})
    (OUT / "manifest.json").write_text(json.dumps({"frame": S, "frames": 2, "legendaries": manifest}, indent=1) + "\n")
    return manifest


# ================================================================ Legend Grove
def grove():
    """A forest clearing (not linked into the world yet) to meet each legendary.
    Open it with /overworld?map=legend_grove. Their real homes are a design call."""
    from scripts import gen_overworld_placeholders as base
    from . import world_maps as town
    from .tiles_v2 import blob_mask

    ID = town.ID
    W, H = 18, 14
    m = town.Town(W, H, base.GRASS)
    m.props = [("border", ",".join(str(ID[f"forestA_{x}_{y}"]) for y in (0, 1) for x in (0, 1)))]
    for y in range(H):
        for x in range(W):
            m.put("ground", x, y, ID[f"grass{town.hashed(x, y) % 4}"])
            if y < 2 or y >= H - 2 or x < 2 or x >= W - 2:
                v = "A" if ((x // 2) + (y // 2)) % 2 == 0 else "B"
                m.put("objects", x, y, ID[f"forest{v}_{x % 2}_{y % 2}"], base.SOLID)
    path = {(x, y) for x in range(8, 10) for y in range(5, 12)} | {(x, y) for x in range(4, 14) for y in range(6, 8)}
    for (x, y) in path:
        mask = blob_mask(lambda dx, dy: (x + dx, y + dy) not in path)
        m.put("ground", x, y, ID[f"path_{mask}"])
    for x, y in ((3, 3), (14, 3), (3, 10), (14, 10), (6, 11), (11, 11)):
        m.put("ground", x, y, ID["bedA" if (x + y) % 2 else "bed2A"])
    spots = [(144, 4, 4, False), (145, 9, 3, False), (146, 13, 4, False), (150, 5, 9, False), (151, 12, 9, False), (151, 15, 7, True)]
    names = {dex: name for dex, name, *_ in ROSTER}
    cries = {144: "Kyaaa!", 145: "Gyaoo!", 146: "Gyaoo!", 150: "...!", 151: "Mew!"}
    for dex, x, y, shiny in spots:
        script = [{"op": "cry", "dex": dex},
                  {"op": "say", "text": f"{'Shiny ' if shiny else ''}{names[dex].upper()}: {cries[dex]}"},
                  {"op": "battle", "wild": dex, "shiny": shiny}]
        m.obj("npcs", f"{names[dex].lower()}{'_shiny' if shiny else ''}", x, y, point=True, sprite=f"legend_{dex}",
              facing="down", kind="legendary", dex=dex, shiny=shiny, script=json.dumps(script))
        m.block(x, y)
    m.obj("signs", "grove_sign", 7, 11, text="LEGEND GROVE - A quiet place where legends rest. (Showcase: talk to one to meet it.)")
    m.put("objects", 7, 11, base.SIGN, base.SOLID)
    data = m.build()
    return town.finish(data, m)
