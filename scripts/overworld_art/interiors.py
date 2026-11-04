"""Interiors v2: Care Centre, Mart and home, painted as whole rooms.

  frontend/public/maps/tilesets/interior.png   unique 16x16 tiles, 8 columns
  frontend/public/maps/origin_center.json, origin_mart.json, origin_home.json

Each room is painted as ONE picture (so furniture spans tiles and casts big
soft floor shadows across tile edges, the way FireRed rooms look), then
sliced into 16x16 tiles and de-duplicated across all rooms. Animated parts
(the healing machine) are painted once per frame; any tile that differs
between frames becomes a Tiled animation. Collision, NPCs, signs and warps
are plain data on top, so the engine contract is unchanged.

Style (after the FireRed refs, original art): rooms with diagonally cut top
corners and narrow side-wall bands, a two-row back wall (top cap, trim,
face, wainscot, baseboard), bold patterned floors, 3/4-view furniture, a
soft shadow under every piece, a red exit mat on the bottom edge.
Counter staff are talked to ACROSS the counter: the counter cell in front of
them carries their script as a sign. Gyms are decided per gym later.
"""
import json
from math import hypot

from PIL import Image

from scripts import gen_overworld_placeholders as base

from .tiles import T, Tile, hexrgb

COLS = 8
OL = "#3a2426"
COL_FIRST = 1000
ANIM_MS = 260
BLACK = "#000000"

# ============================================================== floor themes
# Every floor pixel remembers its pattern key, so shadows and light can
# recolour it later: normal / shadow (cool, darker) / light (heal pad).
FLOORS = {
    "center": {
        "normal": {"base": "#f6eebe", "line": "#dcce94", "inset": "#fffad8", "lo": "#eadca4"},
        "shadow": {"base": "#ddd09c", "line": "#c2b27a", "inset": "#e8dcac", "lo": "#d0c08a"},
        "light": {"base": "#fffbe4", "line": "#ece2b8", "inset": "#ffffff", "lo": "#f6efcc"},
    },
    "mart": {
        "normal": {"base": "#5c88dc", "line": "#4470c4", "inset": "#94bcf6", "lo": "#709ce6"},
        "shadow": {"base": "#4870c4", "line": "#3458a8", "inset": "#6f98e0", "lo": "#5884d0"},
    },
    "home": {
        "normal": {"base": "#d6bc68", "line": "#a88c40", "inset": "#c6a856", "lo": "#e6d080", "grid": "#8c8ca0"},
        "shadow": {"base": "#bca458", "line": "#8c7434", "inset": "#ac9248", "lo": "#ccb46c", "grid": "#74748a"},
    },
}


def floor_key(theme, x, y):
    u, v = x % 16, y % 16
    if theme == "center":            # cream tiles with a raised inset square
        if u == 0 or v == 0:
            return "line"
        if 3 <= u <= 13 and 3 <= v <= 13:
            return "lo" if (u == 13 or v == 13) else "inset"
        return "base"
    if theme == "mart":              # two-tone blue grid, lighter squares on a checker
        if u == 0 or v == 0:
            return "line"
        if 3 <= u <= 12 and 3 <= v <= 12:
            return "inset" if ((x // 16) + (y // 16)) % 2 == 0 else "lo"
        return "base"
    # home: parquet basket weave, 8x8 blocks of three planks, grey tile marks
    if (u in (0, 15)) and (v in (0, 15)):
        return "grid"
    bx, by = x // 8, y // 8
    a = (y % 8) if (bx + by) % 2 == 0 else (x % 8)
    if a % 3 == 2 or a == 7:
        return "line"
    return "base" if (a // 3) % 2 == 0 else "lo"


class Room:
    """A pixel canvas for one room plus the floor-key map for recolouring."""

    def __init__(self, w, h, theme):
        self.w, self.h, self.theme = w, h, theme
        self.t = Tile(w * T, h * T, fill=BLACK)
        self.key = [[None] * (w * T) for _ in range(h * T)]
        self.solid = set()
        for y in range(2 * T, (h - 1) * T):
            for x in range(T, (w - 1) * T):
                k = floor_key(theme, x, y)
                self.key[y][x] = k
                self.t.set(x, y, FLOORS[theme]["normal"][k])

    # --- painting helpers
    def set(self, x, y, c):
        if 0 <= x < self.w * T and 0 <= y < self.h * T:
            self.t.set(x, y, c)
            self.key[y][x] = None   # no longer floor

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.set(x, y, c)

    def box(self, x0, y0, x1, y1, fill, ol=OL):
        self.rect(x0, y0, x1, y1, ol)
        self.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, fill)

    def recolor(self, inside, mode):
        """Recolour floor pixels where inside(x, y) is true (shadow / light)."""
        pal = FLOORS[self.theme][mode]
        for y in range(self.h * T):
            for x in range(self.w * T):
                k = self.key[y][x]
                if k is not None and inside(x, y):
                    self.t.set(x, y, pal[k])

    def shadow_rect(self, x0, y0, x1, y1, soft=True):
        """Soft drop shadow: solid core, dithered 2 px rim."""
        def inside(x, y):
            if not (x0 <= x <= x1 and y0 <= y <= y1):
                return False
            edge = min(x - x0, x1 - x, y - y0, y1 - y)
            return edge >= 2 or not soft or (x + y) % 2 == 0
        self.recolor(inside, "shadow")

    def shadow_ellipse(self, cx, cy, rx, ry):
        self.recolor(lambda x, y: ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 < 1, "shadow")

    def block(self, *cells):
        self.solid.update(cells)


# =============================================================== room shell
WALLS = {
    "center": {"cap": "#fffaf0", "cap_lo": "#e8dcc0", "trim": "#e88848", "trim_hi": "#f8b070", "face": "#f8ecc4",
               "face_lo": "#ead8a8", "stripe": "#e8b878", "low": "#f0dca8", "base": "#c08c58"},
    "mart": {"cap": "#ffffff", "cap_lo": "#d8f0d0", "trim": "#68c060", "trim_hi": "#a0e090", "face": "#f2e48c",
             "face_lo": "#e0cc6c", "stripe": "#7ca0e0", "low": "#e8d478", "base": "#8c92ac"},
    "home": {"cap": "#ffffff", "cap_lo": "#dce8f6", "trim": "#a8c4ec", "trim_hi": "#d4e4fa", "face": "#d4e6f8",
             "face_lo": "#bcd2ee", "stripe": "#6c90d0", "low": "#a8c4ec", "base": "#4c6cb0"},
}


def wall_px(theme, x, y):
    """Back-wall colour at pixel row y (0..31) for a given theme."""
    w = WALLS[theme]
    if y == 0 or y == 4:
        return OL
    if y <= 3:
        return w["cap"] if y < 3 else w["cap_lo"]
    if y <= 8:
        return w["trim_hi"] if y == 5 else w["trim"]
    if theme == "center" and y <= 12:    # orange scallops hanging from the trim
        u = x % 16
        return w["trim"] if hypot(u - 8, y - 8) < 4.6 else w["face"]
    if y <= 22:
        return w["face_lo"] if y == 22 else w["face"]
    if y <= 25:
        return w["stripe"]
    if y <= 29:
        return w["low"]
    return w["base"] if y == 30 else OL


def shell(r):
    """Back wall (rows 0-1) with cut top corners, side-wall bands, bottom edge."""
    W, H, th = r.w * T, r.h * T, r.theme
    side = WALLS[th]
    for y in range(2 * T):
        # diagonal cut corners: from 15 px in at the top to the side band (9 px in)
        cut = 9 + round(6 * (2 * T - 1 - y) / (2 * T - 1))
        for x in range(cut, W - cut):
            r.set(x, y, wall_px(th, x, y))
        r.set(cut - 1, y, OL)
        r.set(W - cut, y, OL)
    for y in range(2 * T, H - T):           # side bands: wall seen at an angle
        for x in range(T - 7, T):
            c = side["face"] if x > T - 5 else side["stripe"] if x > T - 7 else OL
            r.set(x, y, c)
            r.set(W - 1 - x, y, c if c != side["face"] else side["face_lo"])
        r.set(T - 1, y, side["face_lo"])
        r.set(W - T, y, side["face_lo"])
    for x in range(T - 7, W - T + 7):       # bottom lip
        r.set(x, H - T, OL)
    r.block(*[(x, y) for y in range(r.h) for x in range(r.w) if x in (0, r.w - 1) or y in (0, 1, r.h - 1)])


def mat(r, cx):
    """Red exit mat in the bottom edge at tile column cx."""
    x0, y0 = cx * T, (r.h - 1) * T
    r.box(x0 - 2, y0 - 3, x0 + T + 1, y0 + T - 2, "#f08870")
    r.rect(x0 + 1, y0, x0 + T - 2, y0 + T - 5, "#c85840")
    r.rect(x0 + 1, y0, x0 + T - 2, y0, "#a8402c")
    r.solid.discard((cx, r.h - 1))


# ============================================================ shared props
def plant_palm(r, cx, by):
    """Tall potted palm (FireRed style): white pot on a stand, starry leaves.
    cx = centre px, by = bottom px."""
    r.shadow_ellipse(cx - 2, by - 1, 9, 3)
    r.box(cx - 6, by - 12, cx + 5, by - 1, "#f4f4f8")
    r.rect(cx - 5, by - 11, cx + 4, by - 10, "#ffffff")
    r.rect(cx + 2, by - 9, cx + 4, by - 2, "#c8ccdc")
    r.rect(cx - 4, by - 5, cx + 3, by - 5, "#c8ccdc")
    r.rect(cx - 1, by - 20, cx, by - 12, "#8a5634")
    leaves = [(0, -28, 6), (-6, -24, 5), (6, -24, 5), (-4, -18, 5), (4, -18, 5), (0, -21, 5)]
    for dx, dy, rad in leaves:
        for y in range(-rad, rad + 1):
            for x in range(-rad, rad + 1):
                if abs(x) + abs(y) <= rad and (abs(x) <= 1 or abs(y) <= 1 or abs(x) == abs(y)):
                    lit = x + y < 0
                    r.set(cx + dx + x, by + dy + y, "#9cd468" if lit else "#58a840")
    for dx, dy, rad in leaves:
        r.set(cx + dx, by + dy, "#c4ec80")


def glass_pane(r, x0, y0, x1, y1, tint="#c4def4", goods=None):
    """Glass with two diagonal glints (and optional goods behind it)."""
    r.box(x0, y0, x1, y1, tint)
    if goods:
        for i, gy in enumerate(range(y0 + 4, y1 - 3, 7)):
            for gx in range(x0 + 2, x1 - 2, 4):
                r.rect(gx, gy, gx + 2, gy + 3, goods[(gx // 4 + i) % len(goods)])
    for k in range(0, (x1 - x0) // 2):
        for off in (0, 4):
            x, y = x0 + 3 + k + off, y0 + 2 + k
            if x < x1 and y < y1:
                r.set(x, y, "#ffffff")


def seat(r, x0, y0):
    """Yellow cube seat in 3/4 view (top + front), with a shadow."""
    r.shadow_rect(x0 - 3, y0 + 5, x0 + 12, y0 + 17)
    r.box(x0, y0, x0 + 14, y0 + 13, "#f8d040")
    r.rect(x0 + 1, y0 + 1, x0 + 13, y0 + 7, "#fff28c")
    r.rect(x0 + 1, y0 + 8, x0 + 13, y0 + 8, OL)
    r.rect(x0 + 11, y0 + 9, x0 + 13, y0 + 12, "#c08c28")
    r.set(x0 + 3, y0 + 3, "#ffffff")


def glass_table(r, x0, y0, w=30, h=24):
    r.shadow_rect(x0 - 3, y0 + 8, x0 + w - 2, y0 + h + 6)
    for lx in (x0 + 3, x0 + w - 4):
        r.rect(lx, y0 + h - 6, lx + 1, y0 + h + 1, "#6c6e8c")
    r.box(x0, y0, x0 + w, y0 + h - 5, "#c4e6fa")
    r.rect(x0 + 1, y0 + h - 9, x0 + w - 1, y0 + h - 6, "#8cc4ec")
    r.rect(x0 + 1, y0 + 1, x0 + w - 1, y0 + 1, "#ffffff")
    for k in range(10):
        r.set(x0 + 6 + k, y0 + 3 + k // 2, "#ffffff")
        r.set(x0 + 10 + k, y0 + 3 + k // 2, "#ffffff")


# =============================================================== CARE CENTRE
def paint_center(frame):
    r = Room(15, 10, "center")
    shell(r)
    th = WALLS["center"]
    # bookshelf (top-left, on the wall)
    r.box(T + 2, 6, 3 * T - 3, 2 * T + 2, "#58a840")
    for i, sy in enumerate((10, 18)):
        r.rect(T + 4, sy, 3 * T - 5, sy + 5, "#3a7c44")
        for bx in range(T + 5, 3 * T - 5, 3):
            r.rect(bx, sy, bx + 1, sy + 5, ("#e84a3c", "#f8d040", "#4c78e0", "#ffffff", "#f07ca8")[(bx + i) % 5])
    r.rect(T + 3, 7, 3 * T - 4, 8, "#9cd468")
    # wall monitor (centre-top) and PC terminal (right)
    r.box(6 * T + 4, 6, 9 * T - 5, 21, "#4e4a66")
    r.rect(6 * T + 6, 8, 9 * T - 7, 19, "#6c6e8c")
    r.rect(6 * T + 6, 8, 9 * T - 7, 9, "#9aa0be")
    r.box(13 * T - 2, 4, 14 * T - 2, 2 * T + 6, "#e6e6ee")
    r.rect(13 * T, 6, 14 * T - 4, 14, "#4e4a66")
    r.rect(13 * T + 1, 7, 14 * T - 5, 9, "#6898e8")
    r.rect(13 * T, 18, 14 * T - 4, 24, "#c8ccdc")
    for x in range(13 * T + 1, 14 * T - 4, 2):
        r.set(x, 21, "#6c6e8c")
    r.shadow_rect(13 * T - 4, 2 * T + 4, 14 * T - 4, 2 * T + 9)
    # --- U-shaped counter: arms run back to the wall
    c_top, c_hi, c_mid, c_front = "#f08070", "#f8a898", "#e06858", "#c85040"
    L, R_, TOPY, FRONT = 3 * T, 12 * T - 1, 3 * T, 3 * T + 11
    r.shadow_rect(L - 2, FRONT + 8, R_ + 2, FRONT + 20)          # floor shadow under the counter
    for ax in (L, R_ - T + 1):                                   # side arms
        r.box(ax, 2 * T - 6, ax + T - 1, FRONT, c_top)
        r.rect(ax + 1, 2 * T - 5, ax + T - 2, 2 * T - 4, c_hi)
    r.box(L, TOPY, R_, FRONT, c_top)                             # counter top
    r.rect(L + 1, TOPY + 1, R_ - 1, TOPY + 2, c_hi)
    r.rect(L + 1, FRONT - 3, R_ - 1, FRONT - 1, c_mid)
    r.box(L, FRONT, R_, FRONT + 4, c_front)                      # front face
    r.box(L + 2, FRONT + 4, R_ - 2, FRONT + 8, "#b8bccc")         # grey plinth
    r.rect(L + 3, FRONT + 5, R_ - 3, FRONT + 5, "#e6e6ee")
    r.rect(7 * T + 3, TOPY + 4, 8 * T - 4, TOPY + 9, OL)          # sign-in paper
    r.rect(7 * T + 4, TOPY + 5, 8 * T - 5, TOPY + 8, "#ffffff")
    # flower pots on the arms
    for px in (L + 8, R_ - 7):
        r.box(px - 5, 2 * T - 2, px + 4, 2 * T + 7, "#f8d040")
        r.rect(px + 2, 2 * T - 1, px + 3, 2 * T + 6, "#c08c28")
        for dx, dy, c in ((-4, -6, "#ffffff"), (0, -8, "#f07ca8"), (3, -6, "#ffffff"), (-2, -4, "#f07ca8"),
                          (2, -3, "#ffffff"), (-5, -3, "#58a840"), (5, -3, "#58a840")):
            r.rect(px + dx, 2 * T + dy, px + dx + 1, 2 * T + dy + 1, c)
        r.set(px, 2 * T - 7, "#f8d040")
    # --- healing machine behind the counter (left of the nurse)
    mx0, mx1 = 4 * T + 2, 6 * T + 6
    r.box(mx0, 6, mx1, 2 * T + 12, "#f4f4f8")
    r.rect(mx0 + 1, 7, mx1 - 1, 8, "#ffffff")
    r.rect(mx1 - 3, 9, mx1 - 1, 2 * T + 11, "#c8ccdc")
    r.box(mx0 + 6, 10, mx1 - 7, 25, "#2f6a3c")                     # screen with 6 lights
    lit = frame % 3
    for i in range(3):
        for j in range(2):
            on = (i + j) % 3 == lit
            x, y = mx0 + 9 + i * 6, 13 + j * 6
            r.rect(x, y, x + 3, y + 3, "#9cf0a0" if on else "#58a840")
            if on:
                r.set(x, y, "#ffffff")
    r.rect(mx0 + 12, 2 * T - 1, mx0 + 17, 2 * T + 6, "#e04838")     # red cross
    r.rect(mx0 + 9, 2 * T + 1, mx0 + 20, 2 * T + 4, "#e04838")
    # desk phone (right of the nurse)
    r.box(9 * T + 1, 2 * T - 4, 10 * T - 2, 2 * T + 9, "#f4f4f8")
    r.rect(9 * T + 6, 2 * T - 1, 9 * T + 9, 2 * T + 2, "#e04838")
    r.rect(9 * T + 3, 2 * T + 5, 10 * T - 4, 2 * T + 6, "#c8ccdc")
    # --- heal pad: a lit dome, shaded top half, bright lower half
    cx, cy, rx, ry = 7.5 * T, 6.0 * T, 2.4 * T, 2.0 * T
    def pad(mode_lower):
        def inside(x, y):
            d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2
            if d >= 1.0 or (d > 0.86 and (x + y) % 2):
                return False
            return (y >= cy) == mode_lower
        return inside
    r.recolor(pad(True), "light")
    r.recolor(pad(False), "shadow")
    # lounge: seats + glass tables, plants
    seat(r, 12 * T, 5 * T)
    glass_table(r, 12 * T - 2, 6 * T + 4)
    seat(r, 2 * T + 1, 5 * T)
    glass_table(r, T + 3, 6 * T + 4)
    mat(r, 7)
    # collision
    r.block(*[(x, 2) for x in range(1, 14) if x != 7], (13, 2))
    r.block(*[(x, 3) for x in range(3, 12)], (3, 2), (11, 2))
    r.block((12, 5), (12, 6), (13, 6), (12, 7), (13, 7), (2, 5), (1, 6), (2, 6), (1, 7), (2, 7))
    r.solid.discard((7, 2))      # the nurse stands here (her NPC blocks it)
    return r


# ====================================================================== MART
GOODS = ["#e84a3c", "#f8d040", "#58a840", "#4c78e0", "#f07ca8", "#ffffff", "#f07c2e", "#40b8b0"]


def shelf_unit(r, x0, y0, h=3 * T):
    """Tall white shelving unit, front-top view, goods on 3 shelves, shadow."""
    r.shadow_rect(x0 - 5, y0 + 6, x0 + 10, y0 + h + 5)
    r.box(x0, y0, x0 + T - 1, y0 + h - 1, "#f4f4f8")
    r.rect(x0 + 1, y0 + 1, x0 + T - 2, y0 + 4, "#ffffff")            # top cap
    r.rect(x0 + T - 4, y0 + 5, x0 + T - 2, y0 + h - 2, "#c8ccdc")     # side panel
    r.rect(x0 + 12, y0 + 5, x0 + 12, y0 + h - 2, "#9aa0be")
    for i, sy in enumerate(range(y0 + 7, y0 + h - 8, 12)):
        r.rect(x0 + 2, sy, x0 + 11, sy + 7, "#dde3ee")
        for gx in range(x0 + 2, x0 + 11, 3):
            c = GOODS[(gx // 3 + i * 2 + x0) % len(GOODS)]
            r.rect(gx, sy + 1, gx + 1, sy + 6, c)
            r.set(gx, sy + 1, "#ffffff")
        r.rect(x0 + 2, sy + 8, x0 + 11, sy + 8, "#9aa0be")
    r.rect(x0 + 1, y0 + h - 4, x0 + T - 2, y0 + h - 2, "#e04838")      # red kick plate
    r.rect(x0 + 1, y0 + h - 4, x0 + T - 2, y0 + h - 4, "#f07058")


def glass_counter(r, x0, y0, x1, y1):
    """Glass display counter: glassy top with glints, blue front, yellow base."""
    r.shadow_rect(x0 - 4, y1 - 2, x1 + 2, y1 + 8)
    glass_pane(r, x0, y0, x1, y1 - 10, tint="#e8e4f4")
    r.box(x0, y1 - 10, x1, y1 - 3, "#a8c8f0")
    for x in range(x0 + 6, x1 - 2, 8):
        r.rect(x, y1 - 9, x, y1 - 4, "#ffffff")
    r.rect(x0 + 1, y1 - 9, x1 - 1, y1 - 9, "#d4e6fa")
    r.box(x0, y1 - 3, x1, y1, "#e8c858")


def paint_mart(frame):
    r = Room(14, 10, "mart")
    shell(r)
    # poster
    r.box(3 * T + 2, 6, 4 * T + 12, 26, "#ffffff")
    r.rect(3 * T + 5, 9, 4 * T + 9, 12, "#4c78e0")
    for x in range(3 * T + 5, 4 * T + 10, 3):
        r.rect(x, 15, x + 1, 18, "#f8d040")
    r.rect(3 * T + 5, 21, 4 * T + 9, 22, "#e84a3c")
    # glass display cabinets on the back wall
    for i in range(3):
        x0 = 6 * T + 1 + i * T
        glass_pane(r, x0, 4, x0 + T - 2, 2 * T - 1, tint="#cfe6f6", goods=["#f8d040", "#f2b832", "#fff28c"])
    # chiller cases (protrude into the floor)
    for i in range(2):
        x0 = 10 * T + i * T
        r.shadow_rect(x0 - 3, 3 * T - 2, x0 + T - 2, 3 * T + 6)
        r.box(x0, 2 * T - 10, x0 + T - 1, 3 * T - 1, "#f4f4f8")
        r.rect(x0 + 1, 2 * T - 9, x0 + T - 2, 2 * T - 6, "#ffffff")
        r.rect(x0 + 4, 2 * T - 8, x0 + T - 5, 2 * T - 7, "#9cf0a0")
        r.box(x0 + 1, 2 * T - 4, x0 + T - 2, 2 * T + 9, "#dde3ee")
        for j, gy in enumerate((2 * T - 2, 2 * T + 3)):
            for gx in range(x0 + 2, x0 + T - 3, 3):
                r.rect(gx, gy, gx + 1, gy + 3, GOODS[(gx + j + i) % 4])
        r.box(x0, 2 * T + 9, x0 + T - 1, 3 * T - 1, "#6898e8")
        r.rect(x0 + 2, 2 * T + 11, x0 + T - 3, 2 * T + 12, "#94c4ff")
    # palm (top-left), box behind the counter
    plant_palm(r, 2 * T + 8, 3 * T - 2)
    r.shadow_rect(T - 1, 4 * T - 3, 2 * T + 2, 4 * T + 3)
    r.box(T + 1, 3 * T + 1, 2 * T + 1, 4 * T - 2, "#e8c070")
    r.rect(T + 2, 3 * T + 2, 2 * T, 3 * T + 5, "#f8d890")
    r.rect(T + 8, 3 * T + 2, T + 9, 4 * T - 3, "#c09048")
    # register desk (vertical) + glass counter (L-shape around the clerk)
    r.shadow_rect(4 * T - 4, 6 * T - 4, 5 * T + 2, 6 * T + 6)
    r.box(4 * T, 2 * T - 2, 5 * T - 1, 6 * T - 1, "#c8e0f8")
    r.rect(4 * T + 1, 2 * T - 1, 5 * T - 2, 2 * T, "#ffffff")
    r.rect(5 * T - 4, 2 * T + 1, 5 * T - 2, 6 * T - 6, "#94b4e0")
    r.box(4 * T + 1, 6 * T - 6, 5 * T - 2, 6 * T - 1, "#8e92ac")
    r.box(4 * T + 2, 2 * T + 2, 5 * T - 3, 3 * T + 4, "#e6e6ee")       # cash register
    r.rect(4 * T + 3, 2 * T + 3, 5 * T - 4, 2 * T + 7, "#4e4a66")
    r.rect(4 * T + 4, 2 * T + 4, 5 * T - 6, 2 * T + 5, "#9cf0a0")
    for y in (2 * T + 10, 2 * T + 13):
        for x in range(4 * T + 4, 5 * T - 4, 3):
            r.rect(x, y, x + 1, y + 1, "#9aa0be")
    r.box(4 * T + 4, 3 * T + 8, 5 * T - 5, 4 * T + 2, "#f6eebe")        # note pad
    glass_counter(r, T + 1, 4 * T + 6, 4 * T - 1, 6 * T - 1)
    # shelving units (two together, a gap, one more)
    for col in (9, 10, 12):
        shelf_unit(r, col * T, 5 * T)
    # second glass case (bottom-left)
    glass_counter(r, 2 * T, 7 * T + 2, 4 * T + 6, 8 * T + 12)
    mat(r, 6)
    r.block((1, 2), (2, 2), (3, 2), (1, 3), (4, 2), (4, 3), (4, 4), (4, 5), (1, 4), (2, 4), (3, 4), (1, 5), (2, 5), (3, 5),
            (10, 2), (11, 2), (2, 7), (3, 7), (4, 7), (2, 8), (3, 8), (4, 8),
            (9, 5), (9, 6), (9, 7), (10, 5), (10, 6), (10, 7), (12, 5), (12, 6), (12, 7))
    return r


# ====================================================================== HOME
def paint_home(frame):
    r = Room(13, 10, "home")
    shell(r)
    # kitchen: sink unit, glass cupboard, bin, cooker, TV
    r.box(T + 1, 6, 3 * T - 1, 2 * T - 1, "#f4f4f8")
    r.rect(T + 2, 7, 3 * T - 2, 8, "#ffffff")
    r.box(T + 4, 9, 2 * T + 8, 15, "#c8ccdc")
    r.rect(T + 11, 4, T + 12, 9, "#9aa0be")
    r.box(2 * T + 11, 9, 3 * T - 4, 14, "#e6e6ee")
    r.box(T + 1, 2 * T - 12, 3 * T - 1, 2 * T - 1, "#6898e8")
    for x in (T + 6, 2 * T + 8):
        r.rect(x, 2 * T - 8, x + 5, 2 * T - 7, "#c2ecff")
    r.box(3 * T, 2, 4 * T, 2 * T - 1, "#e8c070")                          # glass cupboard
    glass_pane(r, 3 * T + 2, 4, 4 * T - 2, 17, tint="#d4ecf8")
    r.rect(3 * T + 2, 20, 4 * T - 2, 28, "#c09048")
    r.rect(3 * T + 7, 23, 3 * T + 9, 24, "#8a5634")
    r.box(4 * T + 3, 2 * T - 13, 5 * T - 4, 2 * T - 1, "#f4f4f8")         # bin
    r.rect(4 * T + 4, 2 * T - 12, 5 * T - 5, 2 * T - 11, "#c8ccdc")
    r.box(6 * T + 1, 4, 7 * T + 14, 2 * T - 1, "#e6e6ee")                  # cooker
    r.box(6 * T + 4, 6, 7 * T + 11, 14, "#9aa0be")
    for x in (6 * T + 7, 7 * T + 4):
        r.box(x, 7, x + 5, 12, "#4e4a66")
    r.box(6 * T + 4, 18, 7 * T + 11, 2 * T - 4, "#c2ecff")
    r.rect(6 * T + 5, 19, 7 * T + 10, 20, "#ffffff")
    r.box(8 * T + 2, 8, 9 * T + 13, 2 * T - 6, "#4e4a66")                  # TV
    r.rect(8 * T + 4, 10, 9 * T + 11, 2 * T - 9, "#6898e8")
    r.rect(8 * T + 4, 10, 9 * T + 11, 12, "#c2ecff")
    r.rect(8 * T + 9, 16, 9 * T + 4, 19, "#f8d040")
    r.box(8 * T + 6, 2 * T - 6, 9 * T + 9, 2 * T - 1, "#8a5634")
    # staircase up (right), small rug at its foot
    sx0 = 10 * T + 2
    for i in range(6):
        y0 = 2 + i * 7
        r.box(sx0 + i * 3, y0, 12 * T + 14, y0 + 7, "#f2d878")
        r.rect(sx0 + i * 3 + 1, y0 + 1, 12 * T + 13, y0 + 2, "#fff0a6")
        r.rect(sx0 + i * 3 + 1, y0 + 6, 12 * T + 13, y0 + 6, "#c8a848")
    for i in range(7):
        r.rect(sx0 + i * 3, 2 + i * 7, sx0 + i * 3 + 1, 2 + i * 7 + 3, "#a8803c")
    r.rect(sx0, 2, sx0 + 1, 3 * T, "#c8a848")
    r.shadow_rect(10 * T, 3 * T - 2, 12 * T + 14, 3 * T + 6)
    r.box(9 * T + 2, 2 * T + 1, 10 * T - 3, 3 * T + 12, "#f08c6c")
    r.rect(9 * T + 4, 2 * T + 3, 10 * T - 5, 3 * T + 10, "#e86a4c")
    for y in (2 * T + 1, 3 * T + 12):
        for x in range(9 * T + 3, 10 * T - 3, 2):
            r.set(x, y, "#fff0d8")
    # big green rug with border + dots, checked table, four chairs
    rx0, ry0, rx1, ry1 = 3 * T, 3 * T, 11 * T - 1, 8 * T - 1
    r.box(rx0, ry0, rx1, ry1, "#68b858")
    r.rect(rx0 + 3, ry0 + 3, rx1 - 3, ry1 - 3, "#f4f4f8")
    r.rect(rx0 + 5, ry0 + 5, rx1 - 5, ry1 - 5, "#68b858")
    for y in range(ry0 + 9, ry1 - 7, 8):
        for x in range(rx0 + 9, rx1 - 7, 8):
            if not (6 * T - 4 <= x <= 8 * T + 4 and 4 * T - 2 <= y <= 6 * T + 6):
                r.rect(x, y, x + 1, y + 1, "#f8d040")
    tx0, ty0, tx1, ty1 = 6 * T, 4 * T + 2, 8 * T - 1, 6 * T + 4
    for y in range(ty1 - 2, ty1 + 6):                                       # table shadow on the rug
        for x in range(tx0 - 3, tx1 - 1):
            if (x + y) % 2 == 0 or y < ty1 + 4:
                r.set(x, y, "#4c9a44")
    r.box(tx0, ty0, tx1, ty1 - 3, "#f2e098")
    for y in range(ty0 + 2, ty1 - 6):
        for x in range(tx0 + 2, tx1 - 2):
            on = ((x - tx0) // 4 + (y - ty0) // 4) % 2 == 0
            r.set(x, y, "#5c88dc" if on else "#ffffff")
    r.box(tx0, ty1 - 3, tx1, ty1, "#c8a848")
    for lx in (tx0 + 2, tx1 - 3):
        r.rect(lx, ty1, lx + 1, ty1 + 3, "#8a6a30")
    for (cx, cy, face) in ((5 * T + 1, 4 * T, "r"), (5 * T + 1, 5 * T + 2, "r"), (8 * T + 1, 4 * T, "l"), (8 * T + 1, 5 * T + 2, "l")):
        for y in range(cy + 11, cy + 16):
            for x in range(cx - 1, cx + 12):
                if (x + y) % 2 == 0 or y > cy + 12:
                    r.set(x, y, "#4c9a44")
        r.box(cx, cy + 3, cx + 12, cy + 12, "#94c4ff")
        r.rect(cx + 1, cy + 4, cx + 11, cy + 6, "#c2ecff")
        back = cx if face == "r" else cx + 9
        r.box(back, cy - 3, back + 3, cy + 12, "#6898e8")
        r.rect(back + 1, cy - 2, back + 2, cy + 8, "#94c4ff")
        for lx in (cx + 1, cx + 10):
            r.rect(lx, cy + 12, lx + 1, cy + 14, "#4e4a66")
    plant_palm(r, T + 8, 8 * T + 14)
    plant_palm(r, 11 * T + 8, 8 * T + 14)
    mat(r, 4)
    r.block((10, 2), (11, 2), (12, 2), (6, 4), (7, 4), (6, 5), (7, 5), (5, 4), (5, 5), (8, 4), (8, 5), (1, 8), (11, 8))
    return r


# ==================================================== slice + dedupe + maps
ROOMS = {"origin_center": (paint_center, 3), "origin_mart": (paint_mart, 1), "origin_home": (paint_home, 1)}


def _tile_bytes(img):
    return img.tobytes()


_CACHE = {}


def build():
    """Paint every room (every frame), slice, de-duplicate.
    Returns (tile_images, {map_id: (room, ground_ids, anims)})."""
    if _CACHE:
        return _CACHE["v"]
    tiles, index = [], {}

    def tile_id(img):
        k = _tile_bytes(img)
        if k not in index:
            index[k] = len(tiles)
            tiles.append(img)
        return index[k]

    out = {}
    for map_id, (paint, frames) in ROOMS.items():
        rooms = [paint(f) for f in range(frames)]
        r0 = rooms[0]
        ground, anims = [], {}
        for ty in range(r0.h):
            for tx in range(r0.w):
                box = (tx * T, ty * T, tx * T + T, ty * T + T)
                ids = [tile_id(rm.t.img.crop(box)) for rm in rooms]
                ground.append(ids[0])
                if len(set(ids)) > 1:
                    anims[ids[0]] = ids
        out[map_id] = (r0, ground, anims)
    _CACHE["v"] = (tiles, out)
    return _CACHE["v"]


def tileset_image():
    tiles, _ = build()
    rows = (len(tiles) + COLS - 1) // COLS
    img = Image.new("RGBA", (COLS * T, rows * T), (0, 0, 0, 0))
    for i, tile in enumerate(tiles):
        img.alpha_composite(tile, ((i % COLS) * T, (i // COLS) * T))
    return img, len(tiles)


def script(*ops):
    return json.dumps(list(ops))


def say(text):
    return {"op": "say", "text": text}


class MapData(base.MapBuilder):
    def npc(self, name, x, y, sprite, facing, *ops):
        self.obj("npcs", name, x, y, point=True, sprite=sprite, facing=facing, script=script(*ops))
        self.block(x, y)

    def sign(self, name, x, y, text=None, ops=None):
        self.obj("signs", name, x, y, **({"script": script(*ops)} if ops else {"text": text}))


# where each building's door is in Origin Town (door cells, x list, y)
DOORS = {"origin_home": ([4], 6), "origin_center": ([25, 26], 6), "origin_mart": ([26], 22)}
# exit mat column inside each room; you arrive one row above it, facing up
MAT = {"origin_home": 4, "origin_center": 7, "origin_mart": 6}
ARRIVE = {k: [(MAT[k], ROOMS_H - 2)] * len(DOORS[k][0]) for k, ROOMS_H in (("origin_home", 10), ("origin_center", 10), ("origin_mart", 10))}


def make_map(map_id, extras):
    tiles, rooms = build()
    room, ground, anims = rooms[map_id]
    m = MapData(room.w, room.h, 0)
    m.ground = [g + 1 for g in ground]
    for (x, y) in room.solid:
        m.block(x, y)
    door_xs, door_y = DOORS[map_id]
    mx = MAT[map_id]
    m.block(mx, room.h - 1, 0)
    m.obj("warps", "exit", mx, room.h - 1, kind="door", targetMap="origin_town", targetX=door_xs[0], targetY=door_y + 1,
          facing="down", transition="iris", enterDir="down")
    extras(m)
    data = m.build()
    rows = (len(tiles) + COLS - 1) // COLS
    data["tilesets"] = [
        {"firstgid": 1, "name": "interior", "image": "tilesets/interior.png",
         "imagewidth": COLS * T, "imageheight": rows * T, "tilewidth": T, "tileheight": T,
         "columns": COLS, "tilecount": len(tiles), "margin": 0, "spacing": 0,
         "tiles": [{"id": a, "animation": [{"tileid": f, "duration": ANIM_MS} for f in fs]} for a, fs in anims.items()]},
        {"firstgid": COL_FIRST, "name": "collision", "tilewidth": T, "tileheight": T,
         "columns": 0, "tilecount": 5, "margin": 0, "spacing": 0},
    ]
    for layer in data["layers"]:
        if layer["name"] == "collision":
            layer["data"] = [v - base.COL_FIRST + COL_FIRST if v else 0 for v in layer["data"]]
    return data


def center():
    def extras(m):
        nurse = [say("Welcome to the Pokemon Origins Care Centre! Shall I look after your team?"),
                 {"op": "heal"},
                 say("All done! Your Pokemon are fighting fit. We hope to see you again!")]
        m.npc("nurse", 7, 2, "nurse", "down", *nurse)
        m.sign("counter_nurse", 7, 3, ops=nurse)
        m.sign("pc", 13, 1, text="It's the storage PC. (Box storage opens in a later update.)")
        m.sign("books", 1, 1, text="Books about caring for Pokemon. One is called 'Rest Is A Move Too'.")
        m.npc("visitor", 1, 4, "gentleman", "right", say("The nurse here never forgets a Pokemon's name."))
        m.npc("trainer", 12, 4, "cooltrainer_f", "left",
              say("Healing is free for every Pokemon Origins trainer. Use it before you take on the Gym!"))
    return make_map("origin_center", extras)


def mart():
    def extras(m):
        shop = [say("Welcome to the Mart! Potions, Poke Balls and everything a new trainer needs."),
                {"op": "shop", "shop": "origin_mart"}]
        m.npc("clerk", 3, 3, "clerk", "down", *shop)
        for x in (2, 3):
            m.sign(f"counter_{x}", x, 5, ops=shop)
        m.sign("register", 4, 3, ops=shop)
        m.sign("chiller", 10, 2, text="Cold drinks in the chiller. (They go on sale with the shop update.)")
        m.npc("shopper", 6, 2, "youngster", "up", say("Which drink gives a Pokemon the most energy? ...I'll take them all."))
        m.npc("browser", 11, 6, "twin", "up", say("These shelves go up to the ceiling! I can't reach the top."))
    return make_map("origin_mart", extras)


def home():
    def extras(m):
        m.sign("tv", 8, 1, text="A quiz show is on. 'Which Pokemon Origins town has a pond?' ...Easy!")
        m.sign("stairs", 10, 2, text="Your room is upstairs. (It opens in a later update.)")
        m.sign("sink", 1, 1, text="The dishes are done. Mom's handiwork.")
        m.sign("cooker", 6, 1, text="Something smells delicious. Dinner later!")
    return make_map("origin_home", extras)


MAPS = {"origin_center": center, "origin_mart": mart, "origin_home": home}
