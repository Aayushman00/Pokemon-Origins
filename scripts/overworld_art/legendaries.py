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


# =================================================================== Articuno
ARTICUNO = {
    "ol": "#1c2c60", "deep": "#2c5ca8", "dark": "#4c8ad0", "base": "#7cc4f0", "light": "#b8e4ff",
    "belly": "#eef8ff", "belly_lo": "#c4dcf0", "eye": "#e04838", "beak": "#8e92ac", "leg": "#6c6e8c",
}
ARTICUNO_SHINY = {
    "ol": "#1c4a58", "deep": "#3c8aa8", "dark": "#68b8d0", "base": "#a4e4f0", "light": "#dcfaff",
    "belly": "#fffef4", "belly_lo": "#d8eef0", "eye": "#f07c2e", "beak": "#a8aac0", "leg": "#7a7694",
}


def articuno(f):
    p = Paint()
    up = f == 0
    wing = [(13, 14), (4, 4), (1, 6), (2, 10), (5, 14), (11, 19)] if up else [(13, 15), (3, 15), (1, 19), (4, 23), (11, 21)]
    for pts in (wing, mirror_pts(wing)):
        p.poly(pts, "base")
    p.line([(18, 22), (23, 26), (29, 29)], "base", 2)                 # long streamer tail
    p.line([(19, 23), (24, 27), (30, 30)], "dark")
    p.ell(16, 19, 6, 7, "base")                                        # body
    p.ell(16, 11, 4, 4, "base")                                        # head
    p.shade({"base": ("light", "dark")})
    # wing feather tips + stripes
    for side in (1, -1):
        for k in range(3):
            if up:
                p.line([(16 + side * (6 + k * 2), 16 - k), (16 + side * (12 - k), 5 + k * 2)], "deep")
            else:
                p.line([(16 + side * (5 + k), 17), (16 + side * (12 + k), 18 + k * 2)], "deep")
    p.ell(15.5, 21, 3.2, 4.5, "belly")
    p.line([(13, 23), (18, 23)], "belly_lo")
    for pts, role in (([(15, 8), (12, 1)], "deep"), ([(16, 7), (16, 0)], "dark"), ([(17, 8), (21, 2)], "deep")):
        p.line(pts, role)
    p.px(12, 1, "light")
    p.px(21, 2, "light")
    for x in (14, 18):
        p.px(x, 11, "eye")
        p.px(x, 10, "deep")
    p.px(16, 13, "beak")
    p.px(16, 14, "beak")
    for x in (14, 18):
        p.line([(x, 26), (x, 28)], "leg")
        p.px(x - 1, 28, "leg")
        p.px(x + 1, 28, "leg")
    p.outline()
    return p


# ===================================================================== Zapdos
ZAPDOS = {
    "ol": "#3a2410", "yellow": "#f8d040", "ylight": "#fff28c", "ydark": "#c08c28", "black": "#2e2a44",
    "beak": "#f07c2e", "beak_lo": "#a84c24", "eye": "#ffffff", "leg": "#e88848",
}
ZAPDOS_SHINY = {
    "ol": "#4a2410", "yellow": "#f8a838", "ylight": "#ffd888", "ydark": "#c07028", "black": "#4a2a44",
    "beak": "#d85040", "beak_lo": "#8a2c30", "eye": "#fff6d0", "leg": "#d86a48",
}


def zapdos(f):
    p = Paint()
    up = f == 0
    wing = ([(13, 14), (9, 8), (8, 11), (4, 2), (4, 8), (1, 4), (2, 11), (0, 12), (4, 15), (11, 19)] if up
            else [(13, 15), (7, 12), (6, 15), (1, 14), (3, 18), (0, 21), (5, 21), (3, 25), (11, 21)])
    for pts in (wing, mirror_pts(wing)):
        p.poly(pts, "yellow")
    p.ell(16, 19, 5, 6, "yellow")
    p.ell(16, 11, 3.5, 3.5, "yellow")
    p.poly([(13, 10), (11, 2), (14, 6), (16, 0), (18, 6), (21, 2), (19, 10)], "yellow")   # spiky crest
    p.shade({"yellow": ("ylight", "ydark")})
    for side in (1, -1):                                               # black lightning stripes
        if up:
            p.line([(16 + side * 7, 15), (16 + side * 10, 11), (16 + side * 11, 7)], "black")
        else:
            p.line([(16 + side * 7, 17), (16 + side * 11, 19), (16 + side * 13, 22)], "black")
    p.line([(14, 23), (16, 21), (18, 23)], "ydark")
    p.poly([(14.5, 12), (17.5, 12), (16, 18)], "beak")                 # long beak
    p.line([(17, 13), (16, 17)], "beak_lo")
    for x in (14, 18):
        p.px(x, 10, "eye")
        p.px(x, 11, "black")
    for x in (14, 18):
        p.line([(x, 25), (x, 28)], "leg")
        p.px(x - 1, 28, "leg")
        p.px(x + 1, 28, "leg")
    p.outline()
    return p


# ==================================================================== Moltres
MOLTRES = {
    "ol": "#5a2010", "body": "#f8c040", "blight": "#fff09a", "bdark": "#d08828", "flame_r": "#f05028",
    "flame_o": "#f89838", "flame_y": "#fff28c", "beak": "#d8d4e4", "eye": "#2e2a44", "leg": "#a87850",
}
MOLTRES_SHINY = {
    "ol": "#5a1838", "body": "#f8a8b8", "blight": "#ffd8e0", "bdark": "#d07088", "flame_r": "#e83878",
    "flame_o": "#f878a8", "flame_y": "#ffd0e8", "beak": "#e8e4f0", "eye": "#3a2a44", "leg": "#b07888",
}


def moltres(f):
    p = Paint()
    up = f == 0
    wing = ([(13, 14), (8, 9), (6, 3), (4, 7), (1, 2), (1, 9), (0, 13), (5, 15), (11, 19)] if up
            else [(13, 15), (6, 13), (2, 12), (3, 16), (0, 19), (3, 21), (1, 25), (7, 22), (11, 21)])
    for pts in (wing, mirror_pts(wing)):
        p.poly(pts, "flame_o")
    for pts in ((wing, 0.55), (mirror_pts(wing), 0.55)):                # inner yellow core of the flames
        core = [(16 + (x - 16) * pts[1], 17 + (y - 17) * pts[1]) for x, y in pts[0]]
        p.poly(core, "flame_y")
    # flame tail
    p.poly([(16, 22), (21, 24), (27, 23), (24, 26), (30, 28), (23, 29), (17, 26)], "flame_o")
    p.poly([(17, 23), (22, 25), (25, 26), (21, 27)], "flame_y")
    p.ell(16, 19, 5, 6, "body")
    p.ell(16, 11, 3.5, 3.5, "body")
    p.shade({"body": ("blight", "bdark")})
    # flame tips flicker: outer edge in red, shifted per frame
    for y in range(S):
        for x in range(S):
            if p.g[y][x] == "flame_o":
                n = [p.g[y + dy][x + dx] if 0 <= x + dx < S and 0 <= y + dy < S else None
                     for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1))]
                if None in n and (x + y + f) % 3 != 0:
                    p.g[y][x] = "flame_r"
    # flame crest
    crest = ([(14, 9), (12, 3), (15, 6), (16, 0), (17, 6), (20, 2), (18, 9)] if up
             else [(14, 9), (13, 2), (15, 5), (17, 1), (18, 6), (21, 3), (18, 9)])
    p.poly(crest, "flame_o")
    p.poly([(15, 8), (16, 4), (17, 8)], "flame_y")
    p.px(16, 0 if up else 1, "flame_r")
    p.poly([(15, 12), (17.5, 12), (16, 16)], "beak")
    for x in (14, 18):
        p.px(x, 11, "eye")
    for x in (14, 18):
        p.line([(x, 25), (x, 28)], "leg")
        p.px(x - 1, 28, "leg")
        p.px(x + 1, 28, "leg")
    p.outline()
    return p


# ==================================================================== Mewtwo
MEWTWO = {
    "ol": "#3a2a4a", "grey": "#d8d4e4", "glight": "#f6f4fc", "gdark": "#a8a2c0", "purple": "#9a68c8",
    "plight": "#c4a0e8", "pdark": "#6a4098", "eye": "#5a2a88",
}
MEWTWO_SHINY = {
    "ol": "#2a3a2a", "grey": "#dce4d4", "glight": "#f6fcf2", "gdark": "#a8bca0", "purple": "#68b858",
    "plight": "#a0e090", "pdark": "#3c8040", "eye": "#2a6a30",
}


def mewtwo(f):
    p = Paint()
    tail = [(19, 23), (25, 25), (28, 21), (29, 15)] if f == 0 else [(19, 23), (25, 26), (29, 23), (30, 17)]
    p.line(tail, "purple", 3)
    p.ell(tail[-1][0], tail[-1][1], 2, 2, "purple")
    p.ell(12, 24, 3, 4.5, "grey")                                      # thighs
    p.ell(19, 24, 3, 4.5, "grey")
    p.ell(11.5, 29, 2.5, 1.5, "grey")                                  # feet
    p.ell(19.5, 29, 2.5, 1.5, "grey")
    p.ell(15.5, 15, 5, 4, "grey")                                      # chest
    p.ell(15.5, 20, 3.5, 3.5, "purple")                                # abdomen
    p.line([(10, 13), (7, 18), (7, 21)], "grey", 2)                    # arms, clear of the belly
    p.line([(21, 13), (24, 18), (24, 21)], "grey", 2)
    p.ell(7, 22, 1.8, 1.6, "grey")
    p.ell(24, 22, 1.8, 1.6, "grey")
    p.line([(15, 10), (15, 12)], "grey", 2)                            # neck
    p.ell(15.5, 7, 4, 4, "grey")                                       # head
    p.poly([(11, 6), (11, 1), (13, 4)], "grey")                         # horn-ears
    p.poly([(20, 6), (20, 1), (18, 4)], "grey")
    p.shade({"grey": ("glight", "gdark"), "purple": ("plight", "pdark")})
    p.line([(19, 9), (21, 11), (19, 13)], "gdark")                      # the neck tube
    for x in (14, 17):
        p.px(x, 7, "eye")
    p.px(15, 9, "gdark")
    p.outline()
    return p


# ======================================================================= Mew
MEW = {"ol": "#8a3a5a", "pink": "#f8b4cc", "plight": "#ffdcea", "pdark": "#e080a8", "eye": "#3c62b0", "eyehi": "#ffffff"}
MEW_SHINY = {"ol": "#3a4a8a", "pink": "#a8c8f8", "plight": "#dceaff", "pdark": "#7898e0", "eye": "#3c8a50", "eyehi": "#fffff4"}


def mew(f):
    p = Paint()
    tail = [(19, 21), (24, 23), (28, 19), (28, 12), (26, 8)] if f == 0 else [(19, 21), (25, 22), (29, 17), (29, 11), (27, 7)]
    p.line(tail, "pink")
    p.ell(tail[-1][0], tail[-1][1] - 1, 2, 2.5, "pink")                # oval tail tip
    p.ell(16, 20, 4, 4, "pink")                                        # body
    p.ell(12, 25, 2, 1.6, "pink")                                      # feet
    p.ell(20, 25, 2, 1.6, "pink")
    p.ell(11, 18, 1.6, 1.4, "pink")                                    # little arms
    p.ell(21, 18, 1.6, 1.4, "pink")
    p.ell(16, 12, 6, 5, "pink")                                        # big head
    p.poly([(11, 9), (10, 4), (14, 8)], "pink")                         # ears
    p.poly([(21, 9), (22, 4), (18, 8)], "pink")
    p.shade({"pink": ("plight", "pdark")})
    for x0 in (13, 18):                                                # big eyes with a catch-light
        p.line([(x0, 11), (x0, 13)], "eye")
        p.line([(x0 + 1, 11), (x0 + 1, 13)], "eye")
        p.px(x0, 11, "eyehi")
    p.px(16, 15, "pdark")
    p.outline()
    p.shift(-3 if f == 0 else -5)                                      # it floats, bobbing 2 px
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
    from . import origin_town as town
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
