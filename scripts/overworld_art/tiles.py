"""Environment tiles appended to frontend/public/maps/tilesets/overworld.png.

Ids 0-23 are the existing hand-authored tiles from
scripts/gen_overworld_placeholders.py (painted unchanged, so old maps keep
working). Everything after is drawn here, procedurally where a formula
reads better than a grid (grass scatter, herringbone, water foam) and as
whole buildings that get sliced into 16x16 tiles.

The sheet stays 8 tiles wide; new ids continue row by row. `TILES` maps
names to ids so the map builder never hard-codes numbers.
"""
from functools import lru_cache
from PIL import Image, ImageDraw

from scripts import gen_overworld_placeholders as base

T = 16
COLS = 8

# --------------------------------------------------------------- palette
# Matches the existing tiles (P_GRASS etc.), extended with hue-shifted
# ramps: warm yellow-green light, cool blue-green shade.
C = {
    "g_hi": "#b0e070", "g": "#78c850", "g_mid": "#68b848", "g_lo": "#58a840", "g_sh": "#387838",
    "mow_a": "#88d058", "mow_b": "#78c850",
    "shadow": "#2c5e3c",
    "soil": "#a87850", "soil_lo": "#7a5236",
    "pave_hi": "#fff4dc", "pave": "#e8d8b4", "pave_mid": "#d4c098", "mortar": "#c4ac84", "pave_edge": "#f8f0e0",
    "pine_hi": "#5ca86a", "pine": "#2f7a52", "pine_lo": "#1e5640", "pine_sh": "#143a32",
    "trunk": "#8a5634", "trunk_lo": "#553044",
    "white": "#fffcf0", "white_lo": "#c8ccdc", "white_sh": "#8e92ac",
    "log": "#c08048", "log_lo": "#885030", "log_sh": "#583018", "log_ring": "#e8b070",
    "flower_r": "#f04840", "flower_r_lo": "#a82830", "flower_y": "#f8e048", "flower_w": "#ffffff",
    "flower_p": "#f08aac", "leaf": "#40a048", "leaf_lo": "#287838",
    "water_hi": "#f8fcff", "water_lt": "#b8e0f8", "water": "#78b8f0", "water_lo": "#5090e0",
    "bank": "#d8c890", "bank_lo": "#a89060",
    "outline": "#3a2426",
    "wall_hi": "#fffaf0", "wall": "#f0e4c8", "wall_lo": "#d0b890", "wall_line": "#b89c74",
    "stone": "#a8a8b8", "stone_lo": "#6c6e8c",
    "win_top": "#e8f8ff", "win_mid": "#98d0f8", "win_lo": "#5890d8", "frame": "#7a5a40",
    "door": "#c86838", "door_lo": "#8a3e2a", "knob": "#f8d848",
}
ROOFS = {  # hi edge, light face, base, dark face, eave shadow
    "red": ["#ffa088", "#f07058", "#d04838", "#a02c34", "#681c28"],
    "blue": ["#a8d0ff", "#6898e8", "#4870c8", "#2c4c98", "#1c2c60"],
    "slate": ["#d8e0f0", "#a0acc8", "#7884a8", "#525a80", "#2e3250"],
    "orange": ["#ffd088", "#f8a048", "#e07828", "#a84c24", "#6c2c20"],
}


def hexrgb(h):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


class Tile:
    """A 16x16 (or bigger) RGBA canvas with tiny pixel helpers."""

    def __init__(self, w=T, h=T, fill=None):
        self.img = Image.new("RGBA", (w, h), hexrgb(fill) if fill else (0, 0, 0, 0))
        self.w, self.h = w, h
        self.px = self.img.load()

    def set(self, x, y, col):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[x, y] = hexrgb(col) if isinstance(col, str) else col

    def rect(self, x0, y0, x1, y1, col):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.set(x, y, col)

    def paste(self, other, x=0, y=0):
        self.img.alpha_composite(other.img if isinstance(other, Tile) else other, (x, y))
        self.px = self.img.load()


def rng(seed):
    s = [seed & 0x7FFFFFFF or 1]

    def r(n):
        s[0] = (s[0] * 1103515245 + 12345) & 0x7FFFFFFF
        return (s[0] >> 8) % n
    return r


# ----------------------------------------------------------------- ground
def tuft(t, x, y, big=False):
    """A grass tuft: dark root, mid blades, a warm highlight tip (3 tones)."""
    t.set(x, y + 1, C["g_sh"])
    t.set(x - 1, y, C["g_lo"])
    t.set(x + 1, y, C["g_lo"])
    t.set(x, y, C["g_lo"])
    t.set(x - 1, y - 1, C["g_hi"])
    t.set(x + 1, y - 1, C["g_mid"])
    if big:
        t.set(x - 2, y - 1, C["g_lo"])
        t.set(x + 2, y - 1, C["g_lo"])
        t.set(x, y - 2, C["g_hi"])
        t.set(x, y - 1, C["g_mid"])


def grass(seed, tufts=3, specks=10):
    t = Tile(fill=C["g"])
    r = rng(seed)
    for _ in range(specks):
        x, y = r(16), r(16)
        t.set(x, y, C["g_hi"] if r(3) == 0 else C["g_mid"])
    for i in range(tufts):
        tuft(t, 2 + r(12), 3 + r(11), big=(i % 2 == 0))
    return t


def tuft_decal():
    """A clump of long blades: tall, three-toned, with a dark root shadow."""
    t = Tile()
    for x0, h in ((3, 7), (6, 10), (9, 8), (12, 6)):
        for y in range(14 - h, 14):
            t.set(x0, y, C["g_lo"])
            t.set(x0 + 1, y, C["g_sh"] if y > 10 else C["g_mid"])
        t.set(x0, 14 - h, C["g_hi"])
    t.rect(2, 14, 14, 14, C["g_sh"])
    tuft(t, 4, 5)
    return t


def flowers_decal(seed):
    t = Tile()
    r = rng(seed)
    cols = [C["flower_w"], C["flower_y"], C["flower_p"]]
    spots = [(4, 4), (11, 5), (7, 10), (3, 12), (12, 12)]
    for i in range(5):
        x, y = spots[(i + seed) % 5][0] + r(2), spots[(i + seed) % 5][1] + r(2)
        c = cols[(i + seed) % 3]
        t.set(x, y + 2, C["leaf_lo"])
        t.set(x - 1, y + 2, C["leaf"])
        t.set(x, y + 1, C["leaf_lo"])
        t.set(x - 1, y, c)
        t.set(x + 1, y, c)
        t.set(x, y - 1, c)
        t.set(x, y, C["flower_y"] if c != C["flower_y"] else C["flower_r"])
    return t


def mown():
    """Mown lawn: soft diagonal stripes, used as the skirt under buildings."""
    t = Tile(fill=C["mow_b"])
    for y in range(T):
        for x in range(T):
            if ((x + y) // 4) % 2 == 0:
                t.set(x, y, C["mow_a"])
    for x, y in ((3, 5), (11, 2), (7, 12), (14, 9)):
        t.set(x, y, C["g_hi"])
    return t


def flower_bed(frame):
    """Dense red/yellow bed on soil with leaves; frame 1 sways petals 1px."""
    t = Tile(fill=C["soil"])
    for y in range(T):
        for x in range(T):
            if (x * 3 + y * 5) % 7 == 0:
                t.set(x, y, C["soil_lo"])
    for i, (cx, cy) in enumerate(((3, 3), (11, 3), (7, 8), (3, 12), (12, 12))):
        sway = (frame if i % 2 == 0 else -frame)
        c, lo = (C["flower_r"], C["flower_r_lo"]) if i % 2 == 0 else (C["flower_y"], "#c89828")
        for dx, dy in ((-1, 2), (1, 2), (0, 3)):
            t.set(cx + dx, cy + dy, C["leaf"] if dx < 0 else C["leaf_lo"])
        x = cx + sway
        t.rect(x - 1, cy - 1, x + 1, cy + 1, c)
        t.set(x + 1, cy + 1, lo)
        t.set(x, cy, C["flower_w"] if c == C["flower_r"] else C["flower_r"])
        t.set(x - 1, cy - 1, C["flower_w"])
    return t


# ------------------------------------------------------------ herringbone
def _brick_at(x, y):
    """Herringbone of 4x2 bricks: H at (0,0), V at x[0,2) y[2,6), lattice (2,2),(4,-4)."""
    for k in range(-12, 13):
        for j in range(-6, 7):
            ox, oy = 2 * k + 4 * j, 2 * k - 4 * j
            if ox <= x < ox + 4 and oy <= y < oy + 2:
                return ("H", k, j)
            if ox <= x < ox + 2 and oy + 2 <= y < oy + 6:
                return ("V", k, j)
    return None


def herringbone(edges=""):
    """Paving; `edges` is any of "nswe": a light kerb on that side."""
    t = Tile()
    for y in range(T):
        for x in range(T):
            b = _brick_at(x, y)
            right, below = _brick_at(x + 1, y), _brick_at(x, y + 1)
            if b != right or b != below:
                col = C["mortar"]
            elif _brick_at(x - 1, y) != b or _brick_at(x, y - 1) != b:
                col = C["pave_hi"]
            else:
                col = C["pave"] if b[0] == "H" else C["pave_mid"]
            t.set(x, y, col)
    for side in edges:
        for i in range(T):
            pts = {"n": [(i, 0), (i, 1)], "s": [(i, 15), (i, 14)], "w": [(0, i), (1, i)], "e": [(15, i), (14, i)]}[side]
            (ox, oy), (ix, iy) = pts
            t.set(ox, oy, C["mortar"])
            t.set(ix, iy, C["pave_edge"])
    return t


# ------------------------------------------------------------------ fences
def picket():
    t = grass(77, tufts=1, specks=4)
    for x in range(0, T):
        t.set(x, 14, C["shadow"])
    for x in (1, 5, 9, 13):
        t.rect(x, 4, x + 1, 13, C["white"])
        t.set(x + 1, 5, C["white_lo"])
        t.rect(x + 1, 6, x + 1, 13, C["white_lo"])
        t.set(x, 3, C["white"])
        t.set(x + 1, 3, C["outline"])
        t.set(x, 2, C["outline"])
        t.set(x - 1, 3, C["outline"])
        for y in range(4, 14):
            t.set(x - 1, y, C["outline"]) if x - 1 >= 0 else None
            t.set(x + 2, y, C["outline"])
    for y in (7, 11):
        t.rect(0, y, 15, y, C["white"])
        t.rect(0, y + 1, 15, y + 1, C["white_sh"])
    return t


def log_fence():
    t = grass(88, tufts=1, specks=4)
    t.rect(0, 13, 15, 14, C["shadow"])
    for y0 in (5, 9):
        t.rect(0, y0, 15, y0, C["log"])
        t.rect(0, y0 + 1, 15, y0 + 1, C["log_lo"])
        t.rect(0, y0 + 2, 15, y0 + 2, C["log_sh"])
        t.rect(0, y0 - 1, 15, y0 - 1, C["outline"])
    for x in (6, 7, 8, 9):
        for y in range(2, 14):
            t.set(x, y, C["log_lo"] if x in (8, 9) else C["log"])
    t.rect(5, 2, 10, 2, C["outline"])
    t.rect(6, 3, 9, 3, C["log_ring"])
    for y in range(3, 14):
        t.set(5, y, C["outline"])
        t.set(10, y, C["outline"])
    return t


# -------------------------------------------------------------------- pine
def pine():
    """16x32 trimmed pine: three tiers, cool shade on the right, dark base shadow."""
    t = Tile(T, 2 * T)
    bg = grass(5, tufts=0, specks=3)
    t.paste(bg, 0, T)
    # base shadow ellipse on the grass
    for y in range(26, 31):
        for x in range(T):
            if ((x - 8) / 7.5) ** 2 + ((y - 28) / 2.6) ** 2 < 1:
                t.set(x, y, C["shadow"])
    t.rect(7, 23, 8, 28, C["trunk"])
    t.set(8, 24, C["trunk_lo"])
    t.set(8, 25, C["trunk_lo"])
    tiers = [(2, 10, 3), (8, 17, 5), (14, 25, 7)]  # (top y, bottom y, half width at bottom)
    for top, bot, hw in tiers:
        for y in range(top, bot):
            f = (y - top + 1) / (bot - top)
            half = max(1, round(hw * f + 0.4))
            for x in range(8 - half, 8 + half):
                rel = (x - (8 - half)) / max(1, 2 * half - 1)
                if y == bot - 1:
                    col = C["pine_lo"]
                elif rel < 0.3:
                    col = C["pine_hi"]
                elif rel > 0.7:
                    col = C["pine_lo"]
                else:
                    col = C["pine"]
                t.set(x, y, col)
    # outline
    src = t.img.copy().load()
    for y in range(2 * T):
        for x in range(T):
            if src[x, y][3] and src[x, y][:3] in [hexrgb(C[k])[:3] for k in ("pine_hi", "pine", "pine_lo")]:
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1)):
                    if 0 <= nx < T and 0 <= ny < 2 * T:
                        n = src[nx, ny]
                        if n[3] == 0 or n[:3] in [hexrgb(C[k])[:3] for k in ("g", "g_hi", "g_mid", "g_lo", "shadow")]:
                            t.set(nx, ny, C["pine_sh"])
    return t


# -------------------------------------------------------------- tall grass
def tall_grass(frame):
    t = Tile()
    for i, x0 in enumerate(range(0, 16, 4)):
        lean = frame if i % 2 else 0
        for y in range(2, 16):
            for dx in range(4):
                x = x0 + dx + (lean if y < 8 else 0)
                tip = abs(dx - 1.5) * 2 + 2
                if y < tip + (i % 2):
                    continue
                col = C["g_hi"] if dx == 0 else C["g_mid"] if dx == 1 else C["g_lo"] if dx == 2 else C["g_sh"]
                if y > 12:
                    col = C["g_sh"] if dx > 1 else C["g_lo"]
                t.set(x % 16, y, col)
        t.set(x0 + 1 + lean, 2 + (i % 2), C["g_hi"])
    return t


# ------------------------------------------------------------- water edges
def water_base(frame):
    t = Tile()
    tmp = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    grid = base.WATER_G if frame == 0 else base.shifted(base.WATER_G, 3)
    base.paint(tmp, 0, 0, grid, base.P_WATER)
    t.paste(tmp)
    return t


def water_edge(sides, frame):
    """Water with a grassy bank on `sides` (n/s/w/e); foam sways with the frame."""
    t = water_base(frame)
    g = grass(13 + len(sides), tufts=0, specks=4)
    for y in range(T):
        for x in range(T):
            d = min([{"n": y, "s": 15 - y, "w": x, "e": 15 - x}[s] for s in sides] or [99])
            if d <= 2:
                t.set(x, y, g.px[x, y])
            elif d == 3:
                t.set(x, y, C["bank"])
            elif d == 4:
                t.set(x, y, C["bank_lo"])
            elif d == 5:
                along = x if any(s in "ns" for s in sides) and all(
                    {"n": y, "s": 15 - y, "w": x, "e": 15 - x}[s] != d for s in sides if s in "we") else y
                if (along + frame * 2) % 4 < 2:
                    t.set(x, y, C["water_hi"])
    return t


# ------------------------------------------------------------- buildings
FONT = {  # 3x5 pixel glyphs
    "G": ["###", "#..", "#.#", "#.#", "###"], "Y": ["#.#", "#.#", ".#.", ".#.", ".#."],
    "M": ["#.#", "###", "###", "#.#", "#.#"], "A": [".#.", "#.#", "###", "#.#", "#.#"],
    "R": ["##.", "#.#", "##.", "#.#", "#.#"], "T": ["###", ".#.", ".#.", ".#.", ".#."],
}


def text(t, x, y, s, col, shadow=None):
    for ch in s:
        for dy, rowg in enumerate(FONT[ch]):
            for dx, c in enumerate(rowg):
                if c == "#":
                    if shadow:
                        t.set(x + dx + 1, y + dy + 1, shadow)
                    t.set(x + dx, y + dy, col)
        x += 4


def roof(t, x0, y0, w, h, ramp):
    """Shaded roof: ridge highlight, light left half / darker right half,
    vertical shingle seams, edge highlights and a dark eave line."""
    hi, light, mid, dark, eave = ramp
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            col = light if x < x0 + w // 2 else mid
            if (x - x0) % 6 == 5:
                col = dark if x >= x0 + w // 2 else mid
            if (y - y0) % 5 == 4:
                col = dark if x >= x0 + w // 2 else mid
            t.set(x, y, col)
    t.rect(x0, y0, x0 + w - 1, y0, C["outline"])
    t.rect(x0 + 1, y0 + 1, x0 + w - 2, y0 + 2, hi)          # ridge highlight
    t.rect(x0 + w // 2, y0 + 1, x0 + w - 2, y0 + 2, light)
    for y in range(y0, y0 + h):
        t.set(x0, y, C["outline"])
        t.set(x0 + w - 1, y, C["outline"])
        t.set(x0 + 1, y, hi)                                 # left edge highlight
        t.set(x0 + w - 2, y, dark)
    t.rect(x0, y0 + h - 2, x0 + w - 1, y0 + h - 2, dark)
    t.rect(x0, y0 + h - 1, x0 + w - 1, y0 + h - 1, eave)


def wall(t, x0, y0, w, h):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            col = C["wall"]
            if (y - y0) % 4 == 3:
                col = C["wall_line"]
            if x >= x0 + w - 3:
                col = C["wall_lo"] if col == C["wall"] else col
            t.set(x, y, col)
    t.rect(x0, y0, x0 + w - 1, y0 + 1, C["wall_lo"])          # eave shadow
    t.rect(x0, y0 + h - 3, x0 + w - 1, y0 + h - 2, C["stone"])  # stone footing
    t.rect(x0, y0 + h - 1, x0 + w - 1, y0 + h - 1, C["stone_lo"])
    for y in range(y0, y0 + h):
        t.set(x0, y, C["outline"])
        t.set(x0 + w - 1, y, C["outline"])
        t.set(x0 + 1, y, C["wall_hi"])


def window(t, x, y, w=10, h=8):
    t.rect(x, y, x + w - 1, y + h - 1, C["frame"])
    for yy in range(y + 1, y + h - 1):
        f = (yy - y - 1) / max(1, h - 3)
        col = C["win_top"] if f < 0.25 else C["win_mid"] if f < 0.7 else C["win_lo"]
        t.rect(x + 1, yy, x + w - 2, yy, col)
    t.rect(x + w // 2, y + 1, x + w // 2, y + h - 2, C["frame"])
    t.set(x + 2, y + 2, C["water_hi"])
    t.set(x + 3, y + 2, C["water_hi"])
    t.rect(x - 1, y + h, x + w, y + h, C["wall_lo"])


def door(t, x, y, w=10, h=14, col=None, lo=None):
    t.rect(x - 1, y - 1, x + w, y + h - 1, C["outline"])
    t.rect(x, y, x + w - 1, y + h - 1, col or C["door"])
    t.rect(x + w - 3, y, x + w - 1, y + h - 1, lo or C["door_lo"])
    t.rect(x + 2, y + 2, x + w - 5, y + 5, C["win_mid"])
    t.set(x + w - 4, y + 8, C["knob"])


def house(roof_ramp="red", sign=None, emblem=False):
    """4x4 tiles: roof rows 0-1 (drawn above actors), wall rows 2-3."""
    t = Tile(64, 64)
    t.paste(mown_block(64, 64))
    roof(t, 1, 4, 62, 30, ROOFS[roof_ramp])
    wall(t, 3, 34, 58, 28)
    window(t, 8, 40)
    window(t, 46, 40)
    door(t, 27, 47)
    if sign:
        t.rect(22, 36, 41, 44, C["outline"])
        t.rect(23, 37, 40, 43, sign[1])
        text(t, 24, 38, sign[0], C["white"], shadow=C["outline"])
    if emblem:  # care centre: white plate with a red cross
        t.rect(26, 35, 37, 45, C["outline"])
        t.rect(27, 36, 36, 44, C["white"])
        t.rect(30, 37, 33, 43, "#e04838")
        t.rect(28, 39, 35, 41, "#e04838")
    return t


def gym():
    """6x5 tiles: tall slate building with a lettered plate and double door."""
    t = Tile(96, 80)
    t.paste(mown_block(96, 80))
    roof(t, 1, 3, 94, 30, ROOFS["slate"])
    # roof skylight band
    for x in range(10, 86, 8):
        t.rect(x, 12, x + 4, 16, ROOFS["slate"][0])
        t.rect(x, 17, x + 4, 17, ROOFS["slate"][3])
    wall(t, 3, 33, 90, 46)
    # pillars
    for px in (8, 82):
        t.rect(px, 33, px + 5, 75, C["white"])
        t.rect(px + 4, 33, px + 5, 75, C["white_lo"])
        t.rect(px - 1, 33, px - 1, 75, C["outline"])
        t.rect(px + 6, 33, px + 6, 75, C["outline"])
    window(t, 18, 40, 14, 10)
    window(t, 64, 40, 14, 10)
    # sign plate
    t.rect(34, 36, 61, 46, C["outline"])
    t.rect(35, 37, 60, 45, "#e04838")
    t.rect(35, 45, 60, 45, "#a02c34")
    text(t, 42, 39, "GYM", C["white"], shadow=C["outline"])
    # double door
    door(t, 36, 56, 11, 20, "#7884a8", "#525a80")
    door(t, 48, 56, 11, 20, "#7884a8", "#525a80")
    return t


def mown_block(w, h):
    b = Tile(w, h)
    m = mown()
    for y in range(0, h, T):
        for x in range(0, w, T):
            b.paste(m, x, y)
    return b


def gym_sign():
    t = grass(21, tufts=1, specks=3)
    t.rect(7, 9, 8, 15, C["log_lo"])
    t.rect(1, 2, 14, 10, C["outline"])
    t.rect(2, 3, 13, 9, "#e04838")
    t.rect(2, 9, 13, 9, "#a02c34")
    # badge emblem: a little white star-burst
    for x, y in ((7, 4), (6, 5), (7, 5), (8, 5), (5, 6), (7, 6), (9, 6), (7, 7), (6, 7), (8, 7)):
        t.set(x, y, C["white"])
    t.set(7, 6, C["knob"])
    return t


def bush():
    t = grass(31, tufts=0, specks=3)
    for y in range(3, 15):
        for x in range(1, 15):
            if ((x - 7.5) / 7) ** 2 + ((y - 9) / 6) ** 2 < 1:
                rel = (x - 1) / 13
                t.set(x, y, C["pine_hi"] if rel < 0.35 and y < 10 else C["pine"] if rel < 0.7 else C["pine_lo"])
    t.rect(3, 14, 12, 14, C["shadow"])
    for x, y in ((5, 6), (9, 8), (6, 10)):
        t.set(x, y, C["g_hi"])
    return t


# -------------------------------------------------------------- assembly
from . import tiles_v2 as v2  # noqa: E402  (v2 art reuses the helpers above)

def slice_into(img, cols, rows):
    return [img.crop((x * T, y * T, (x + 1) * T, (y + 1) * T)) for y in range(rows) for x in range(cols)]


@lru_cache(None)
@lru_cache(maxsize=1)
def new_tiles():
    """[(name, Image)] in id order, starting at id 24."""
    out = []
    add = lambda name, t: out.append((name, t.img if isinstance(t, Tile) else t))
    for i in range(4):
        add(f"grass{i}", grass(100 + i * 17, tufts=3 + i % 2, specks=10 + i))
    add("mown", mown())
    add("tufts", tuft_decal())
    add("flowers0", flowers_decal(1))
    add("flowers1", flowers_decal(2))
    add("bedA", v2.flowers_v2(0, 0))       # v2: clusters on grass, not a soil square
    add("bedB", v2.flowers_v2(1, 0))
    add("pave", herringbone())
    for edges in ("n", "s", "w", "e", "nw", "ne", "sw", "se"):
        add(f"pave_{edges}", herringbone(edges))
    add("picket", v2.picket_v2())             # v2 in place: boards with grass gaps
    add("logfence", v2.log_v2())
    p = pine()
    add("pine_top", p.img.crop((0, 0, T, T)))
    add("pine_base", p.img.crop((0, T, T, 2 * T)))
    add("tallA", v2.tall_grass_v2(0))      # v2: leaning blades, no dark band
    add("tallB", v2.tall_grass_v2(1))
    for sides in ("n", "s", "w", "e", "nw", "ne", "sw", "se"):
        add(f"shore_{sides}A", water_edge(sides, 0))
        add(f"shore_{sides}B", water_edge(sides, 1))
    add("gym_sign", gym_sign())
    add("bush", bush())
    for name, img, cols, rows in (("house", v2.house_v3().img, 4, 4),
                                  ("center", v2.center_v3().img, 4, 4),
                                  ("mart", v2.mart_v3().img, 4, 4),
                                  ("gym", v2.gym_v3().img, 6, 5)):
        for i, part in enumerate(slice_into(img, cols, rows)):
            add(f"{name}_{i % cols}_{i // cols}", part)
    # ---- v2 additions (stage 2 slice): appended so every older id is stable
    add("bed2A", v2.flowers_v2(0, 1, seed=160))
    add("bed2B", v2.flowers_v2(1, 1, seed=160))
    for variant, leaf in (("A", "oak"), ("B", "lime")):
        for i, part in enumerate(slice_into(v2.oak(variant, leaf).img, 2, 2)):
            add(f"oak{variant}_{i % 2}_{i // 2}", part)
    add("doormat", v2.doormat())
    # ---- stage 3b: border forest (2x2, tiles seamlessly; also the off-map border)
    for variant, leaf in (("A", "forest"), ("B", "forest2")):
        for i, part in enumerate(slice_into(v2.border_tree(variant, leaf).img, 2, 2)):
            add(f"forest{variant}_{i % 2}_{i // 2}", part)
    # ---- stage 3b: dirt path autotile (47-tile blob set, soft grass edges)
    for mask in v2.blob_masks():
        add(f"path_{mask}", v2.path_tile(mask))
    # ---- stage 3b: pond autotile (47 masks x 3 animation frames) + decor
    for mask in v2.blob_masks():
        for f in range(3):
            add(f"pond_{mask}_{f}", v2.pond_tile(mask, f))
    add("lily", v2.lily_pads())
    add("reeds", v2.reeds())
    # ---- stage 3b: fence ends, v2 ledge, props (each casts a soft shadow)
    for e in ("l", "r"):
        add(f"picket_{e}", v2.picket_v2(e))
        add(f"log_{e}", v2.log_v2(e))
    add("ledge", v2.ledge_v2())
    add("ledge_l", v2.ledge_v2("l"))
    add("ledge_r", v2.ledge_v2("r"))
    add("rock2", v2.rock_v2())
    add("barrel", v2.barrel())
    add("crate", v2.crate())
    add("bench_l", v2.bench("l"))
    add("bench_r", v2.bench("r"))
    lamp = v2.lamp().img
    add("lamp_top", lamp.crop((0, 0, T, T)))
    add("lamp_base", lamp.crop((0, T, T, 2 * T)))
    add("veg", v2.veg_bed())
    add("laundry_l", v2.laundry("l"))
    add("laundry_r", v2.laundry("r"))
    add("plank", v2.plank())
    # ---- art overhaul: new nature art replaces old tiles in place, blob sets append
    from . import nature
    from .slice_art import meadow
    swap = {f"grass{i}": meadow(i) for i in range(4)}
    swap.update(tufts=nature.tufts(0), flowers0=nature.flowers(1, 0), flowers1=nature.flowers(2, 0),
                bedA=nature.flowers(3, 0), bedB=nature.flowers(3, 1), bed2A=nature.flowers(4, 0),
                bed2B=nature.flowers(4, 1), tallA=nature.tall_grass("meadow", 0, 0, 0), tallB=nature.tall_grass("meadow", 0, 0, 1), bush=nature.bush(),
                plank=nature.plank(True))
    for mask in v2.blob_masks():
        for f in range(3):
            swap[f"pond_{mask}_{f}"] = nature.pond_tile(mask, f)
    out[:] = [(name, swap.get(name, tile)) for name, tile in out]
    for mask in v2.blob_masks():
        for px, py in ((0, 0), (1, 0), (0, 1), (1, 1)):
            add(f"trail_{mask}_{px}{py}", nature.trail_tile(mask, (px, py)))
            add(f"lawn_{mask}_{px}{py}", nature.lawn_tile(mask, (px, py)))
            add(f"forest_{mask}_{px}{py}", nature.forest_tile(mask, (px, py)))
    for links in range(16):
        add(f"fence_{links}", nature.fence_tile(links))
    add("plank_v", nature.plank(False))
    for biome in nature.TALL:
        for mask in range(16):
            for phase in (0, 1):
                add(f"tall_{biome}_{mask}_{phase}_0", nature.tall_grass(biome, mask, phase, 0))
                add(f"tall_{biome}_{mask}_{phase}_1", nature.tall_grass(biome, mask, phase, 1))
    for tone in nature.CANOPY_TONES:
        for px, py in ((0, 0), (1, 0), (0, 1), (1, 1)):
            add(f"forest_{tone}_{px}{py}", nature.forest_tile(0, (px, py), tone))
    add("pebbles", nature.pebbles())
    add("mushrooms", nature.mushrooms())
    add("reeds", nature.reeds())
    add("lily0", nature.lily(False))
    add("lily1", nature.lily(True))
    add("doormat", nature.doormat())
    add("crops0", nature.crops(0))
    add("crops1", nature.crops(1))
    for part in "lmr":
        add(f"ledge_{part}", nature.ledge(part))
    for kind in "ABF":
        for i, tile in enumerate(slice_into(nature.standing_tree(kind), 2, 2)):
            add(f"tree{kind}_{i % 2}_{i // 2}", tile)
    from .buildings import BUILDINGS, PROPS
    for name, (make, _) in BUILDINGS.items():
        art = make()
        cols = art.width // T
        for i, part in enumerate(slice_into(art, cols, 5)):
            add(f"{name}_{i % cols}_{i // cols}", part)
    for name in ("sign", "mailbox", "bench", "barrel", "crate", "rock", "stump"):
        add(f"prop_{name}", PROPS[name])
    for name in ("lamp", "well"):
        add(f"prop_{name}_top", PROPS[name].crop((0, 0, T, T)))
        add(f"prop_{name}_base", PROPS[name].crop((0, T, T, 2 * T)))
    from .gym_art import gym_tiles
    from .town_art import town_tiles
    for name, t in gym_tiles() + town_tiles():
        add(name, t)
    return out


FIRST_NEW = 24


@lru_cache(maxsize=1)
def tile_ids():
    return {name: FIRST_NEW + i for i, (name, _) in enumerate(new_tiles())}


def tileset_image():
    """Old tiles 0-23 exactly as before, then the new ones."""
    tiles = new_tiles()
    total = FIRST_NEW + len(tiles)
    rows = (total + COLS - 1) // COLS
    img = Image.new("RGBA", (COLS * T, rows * T), (0, 0, 0, 0))
    for i, (b, over, palette) in enumerate(base.build_tiles()):
        ox, oy = (i % COLS) * T, (i // COLS) * T
        if b:
            base.paint(img, ox, oy, b, palette)
        if over:
            base.paint(img, ox, oy, over, palette)
    for i, (_, tile) in enumerate(tiles):
        idx = FIRST_NEW + i
        img.alpha_composite(tile, ((idx % COLS) * T, (idx // COLS) * T))
    return img, total
