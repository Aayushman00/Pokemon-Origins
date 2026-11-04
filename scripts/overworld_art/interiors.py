"""Interiors v2: Care Centre, Mart and home, painted as whole rooms.

  frontend/public/maps/tilesets/interior.png   unique 16x16 tiles, 8 columns
  frontend/public/maps/mossgate_center.json, origin_mart.json, and the Dawnbrook and Mossgate houses and lab

Each room is painted as ONE picture (so furniture spans tiles), then
sliced into 16x16 tiles and de-duplicated across all rooms. Animated parts
(the healing machine) are painted once per frame; any tile that differs
between frames becomes a Tiled animation. Collision, NPCs, signs and warps
are plain data on top, so the engine contract is unchanged.

Style (after the FireRed refs, original art): rooms with diagonally cut top
corners and narrow side-wall bands, a two-row back wall (top cap, trim,
face, wainscot, baseboard), bold patterned floors, 3/4-view furniture, a
red exit mat on the bottom edge.
Counter staff are talked to ACROSS the counter: the counter cell in front of
them carries their script as a sign. Gyms are decided per gym later.
"""
import json
from math import hypot
from pathlib import Path

from PIL import Image

from scripts import gen_overworld_placeholders as base

from .tiles import T, Tile, hexrgb

from .world_palette import LINE

COLS = 8
OL = LINE
COL_FIRST = 1000
ANIM_MS = 260
BLACK = "#000000"

# ============================================================== floor themes
# Every floor pixel remembers its pattern key, so light can
# recolour it later: normal / light (heal pad).
FLOORS = {
    "center": {
        "normal": {"base": "#f6eebe", "line": "#dcce94", "inset": "#fffad8", "lo": "#eadca4"},
        "light": {"base": "#fffbe4", "line": "#ece2b8", "inset": "#ffffff", "lo": "#f6efcc"},
    },
    "mart": {
        "normal": {"base": "#5c88dc", "line": "#4470c4", "inset": "#94bcf6", "lo": "#709ce6"},
    },
    "lab": {
        "normal": {"base": "#dde5e6", "line": "#b6c3ca", "inset": "#eaf0f0", "lo": "#ced9dc"},
    },
    "cottage": {
        "normal": {"base": "#b98f5c", "line": "#8a6638", "inset": "#a87f4e", "lo": "#c9a36e", "grid": "#7c7068"},
    },
    "home": {
        "normal": {"base": "#d6bc68", "line": "#a88c40", "inset": "#c6a856", "lo": "#e6d080", "grid": "#8c8ca0"},
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
    if theme == "lab":               # big quiet tiles, a faint checker
        if u == 0 or v == 0:
            return "line"
        return "inset" if ((x // 16) + (y // 16)) % 2 == 0 else "base"
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
        self.over = []  # pixel boxes (x0, y0, x1, y1) drawn over actors, not under them
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
        """Recolour floor pixels where inside(x, y) is true."""
        pal = FLOORS[self.theme][mode]
        for y in range(self.h * T):
            for x in range(self.w * T):
                k = self.key[y][x]
                if k is not None and inside(x, y):
                    self.t.set(x, y, pal[k])

    def block(self, *cells):
        self.solid.update(cells)


# =============================================================== room shell
WALLS = {
    "center": {"cap": "#fffaf0", "cap_lo": "#e8dcc0", "trim": "#e88848", "trim_hi": "#f8b070", "face": "#f8ecc4",
               "face_lo": "#ead8a8", "stripe": "#e8b878", "low": "#f0dca8", "base": "#c08c58"},
    "mart": {"cap": "#ffffff", "cap_lo": "#d8f0d0", "trim": "#68c060", "trim_hi": "#a0e090", "face": "#f2e48c",
             "face_lo": "#e0cc6c", "stripe": "#7ca0e0", "low": "#e8d478", "base": "#8c92ac"},
    "lab": {"cap": "#ffffff", "cap_lo": "#dcecea", "trim": "#4aa8a0", "trim_hi": "#8ad4c8", "face": "#e8f0ee",
            "face_lo": "#d4e0de", "stripe": "#5a8a94", "low": "#c8d8d8", "base": "#5a7884"},
    "cottage": {"cap": "#ffffff", "cap_lo": "#e4ecd8", "trim": "#8cb88c", "trim_hi": "#b8d8b0", "face": "#e6efd4",
                "face_lo": "#d2dfbc", "stripe": "#6f9a78", "low": "#b4cba0", "base": "#5a7a5c"},
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
# Drawing vocabulary: every prop is built from rounded, bevelled shapes
# (lit top-left edge, shaded bottom-right edge) plus small recognisable
# details, never a flat rectangle.

def rbox(r, x0, y0, x1, y1, fill, hi=None, lo=None, ol=OL):
    """Rounded box: corners left open, optional bevel (hi top/left, lo bottom/right)."""
    r.rect(x0 + 1, y0, x1 - 1, y0, ol)
    r.rect(x0 + 1, y1, x1 - 1, y1, ol)
    r.rect(x0, y0 + 1, x0, y1 - 1, ol)
    r.rect(x1, y0 + 1, x1, y1 - 1, ol)
    r.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, fill)
    if lo:
        r.rect(x0 + 1, y1 - 1, x1 - 1, y1 - 1, lo)
        r.rect(x1 - 1, y0 + 1, x1 - 1, y1 - 1, lo)
    if hi:
        r.rect(x0 + 1, y0 + 1, x1 - 2, y0 + 1, hi)
        r.rect(x0 + 1, y0 + 1, x0 + 1, y1 - 2, hi)


def vgrad(r, x0, y0, x1, y1, cols):
    n = y1 - y0 + 1
    for i, y in enumerate(range(y0, y1 + 1)):
        r.rect(x0, y, x1, y, cols[min(len(cols) - 1, i * len(cols) // n)])


def bottle(r, x, y, body, h=6, cap="#f4f4f8", label="#ffffff"):
    """2 px wide bottle: cap, neck, body with a label band and a glint."""
    r.set(x, y, cap)
    r.set(x + 1, y, OL)
    r.rect(x, y + 1, x + 1, y + h - 1, body)
    r.rect(x, y + h // 2, x + 1, y + h // 2, label)
    r.set(x, y + 2, "#ffffff")


def box_item(r, x, y, w, h, col):
    """Product box: lit top edge, darker side, a label stripe."""
    r.rect(x, y, x + w - 1, y + h - 1, col)
    r.rect(x, y, x + w - 1, y, "#ffffff")
    r.rect(x + w - 1, y + 1, x + w - 1, y + h - 1, OL)
    if h > 3:
        r.rect(x, y + h - 2, x + w - 2, y + h - 2, "#ffffff")


def book(r, x, y, h, col):
    r.rect(x, y, x, y + h - 1, col)
    r.set(x, y, "#ffffff")
    r.set(x, y + h - 2, OL)


LEAF = ["#c4ec80", "#9cd468", "#58a840", "#2f6a3c"]


def plant_palm(r, cx, by):
    """Potted palm: rounded white pot with rim and band, fronds with veins."""
    # pot
    rbox(r, cx - 6, by - 12, cx + 5, by - 1, "#eeeef4", hi="#ffffff", lo="#c4c8d8")
    r.rect(cx - 7, by - 13, cx + 6, by - 11, OL)
    r.rect(cx - 6, by - 12, cx + 5, by - 12, "#ffffff")
    r.rect(cx - 5, by - 7, cx + 4, by - 6, "#9aa0be")
    r.rect(cx - 4, by - 7, cx + 3, by - 7, "#c8ccdc")
    r.rect(cx - 5, by - 13, cx + 4, by - 13, "#6a4a32")                  # soil
    # fronds: arcs of leaf pixels with a dark midrib
    fronds = [(-1, -1, -9, -6), (1, -1, 9, -6), (-1, -1, -7, -12), (1, -1, 7, -12), (0, -1, -2, -16), (0, -1, 3, -15)]
    for _, _, ex, ey in fronds:
        steps = max(abs(ex), abs(ey))
        for s in range(1, steps + 1):
            x = cx + round(ex * s / steps)
            y = by - 13 + round(ey * s / steps)
            w = 2 if s < steps - 1 else 1
            for k in range(-w, w + 1):
                px, py = (x, y + k) if abs(ex) > abs(ey) else (x + k, y)
                r.set(px, py, LEAF[1] if k < 0 else LEAF[2])
            r.set(x, y, LEAF[3] if s > 1 else LEAF[2])
        r.set(cx + ex, by - 13 + ey, LEAF[0])
    r.rect(cx - 1, by - 14, cx, by - 13, "#8a5634")


def glass_pane(r, x0, y0, x1, y1, tint="#c4def4", goods=None, shelves=0):
    """Framed glass with shelves of bottles behind it and two glints."""
    rbox(r, x0, y0, x1, y1, tint, hi="#e8f6ff", lo="#9ab8d4")
    if shelves:
        step = (y1 - y0 - 2) // shelves
        for i in range(shelves):
            sy = y0 + 2 + i * step
            for gx in range(x0 + 2, x1 - 2, 3):
                bottle(r, gx, sy + 1, goods[(gx // 3 + i) % len(goods)], h=step - 2)
            r.rect(x0 + 1, sy + step - 1, x1 - 1, sy + step - 1, "#8ea8c4")
    for k in range(0, min(x1 - x0, y1 - y0) - 3):
        for off in (0, 3):
            x, y = x0 + 2 + k + off, y0 + 1 + k
            if x < x1 and y < y1 and (k + off) % 5 != 4:
                r.set(x, y, "#ffffff")


def seat(r, x0, y0):
    """Cushioned stool: rounded top with stitching, front band, little feet."""
    r.rect(x0 + 2, y0 + 13, x0 + 3, y0 + 15, "#6c6e8c")
    r.rect(x0 + 11, y0 + 13, x0 + 12, y0 + 15, "#6c6e8c")
    rbox(r, x0, y0, x0 + 14, y0 + 13, "#f8d040", hi="#fff6a8", lo="#c08c28")
    r.rect(x0 + 1, y0 + 9, x0 + 13, y0 + 12, "#e0a830")                  # front band
    r.rect(x0 + 1, y0 + 9, x0 + 13, y0 + 9, OL)
    for x in range(x0 + 3, x0 + 12, 2):                                   # stitching
        r.set(x, y0 + 5, "#e0a830")
    r.rect(x0 + 3, y0 + 2, x0 + 5, y0 + 2, "#ffffff")


def glass_table(r, x0, y0, w=30, h=24, item=None):
    """Glass coffee table: bevelled glass, metal frame, legs, something on top."""
    for lx in (x0 + 2, x0 + w - 4):
        r.rect(lx, y0 + h - 6, lx + 1, y0 + h + 1, "#6c6e8c")
        r.set(lx, y0 + h - 6, "#c8ccdc")
    rbox(r, x0, y0, x0 + w, y0 + h - 5, "#c4e6fa", hi="#ffffff", lo="#7cb0dc")
    r.rect(x0 + 1, y0 + h - 8, x0 + w - 1, y0 + h - 6, "#9cc8ec")         # glass thickness
    r.rect(x0 + 1, y0 + h - 8, x0 + w - 1, y0 + h - 8, "#e8f6ff")
    for k in range(9):
        r.set(x0 + 5 + k, y0 + 3 + k // 2, "#ffffff")
        r.set(x0 + 9 + k, y0 + 3 + k // 2, "#ffffff")
    if item == "magazine":
        r.box(x0 + w - 13, y0 + 5, x0 + w - 4, y0 + 13, "#f07ca8")
        r.rect(x0 + w - 12, y0 + 6, x0 + w - 5, y0 + 7, "#ffffff")
        for y in (y0 + 9, y0 + 11):
            r.rect(x0 + w - 11, y, x0 + w - 6, y, "#ffc4da")
    elif item == "cup":
        r.box(x0 + 5, y0 + 7, x0 + 10, y0 + 12, "#ffffff")
        r.rect(x0 + 6, y0 + 8, x0 + 9, y0 + 8, "#8a5634")
        r.set(x0 + 11, y0 + 9, OL)
        r.set(x0 + 11, y0 + 10, OL)


def framed_picture(r, x0, y0, x1, y1):
    """Little landscape: sky, sun, hills, frame with a lit corner."""
    rbox(r, x0, y0, x1, y1, "#c08048", hi="#e0a868", lo="#86522e")
    vgrad(r, x0 + 2, y0 + 2, x1 - 2, y1 - 2, ["#c2ecff", "#94c4ff"])
    r.rect(x1 - 6, y0 + 3, x1 - 5, y0 + 4, "#fff28c")
    for x in range(x0 + 2, x1 - 1):
        hy = y1 - 3 - round(2 * abs(((x - x0) % 10) - 5) / 5)
        r.rect(x, hy, x, y1 - 2, "#58a840")
        r.set(x, hy, "#9cd468")


def wall_clock(r, cx, cy):
    for y in range(cy - 6, cy + 7):
        for x in range(cx - 6, cx + 7):
            d = hypot(x - cx, y - cy)
            if d <= 6.2:
                r.set(x, y, OL if d > 5.2 else "#ffffff" if d < 4.6 else "#d8dcea")
    r.rect(cx, cy - 4, cx, cy, OL)
    r.rect(cx, cy, cx + 3, cy, OL)
    r.set(cx, cy, "#e04838")
    r.set(cx - 2, cy - 3, "#ffffff")


def bookcase(r, bx0, bx1):
    """Two shelves of mixed books against the back wall, wood grain frame."""
    rbox(r, bx0, 5, bx1, 2 * T + 3, "#9c6a3c", hi="#c89060", lo="#6a4428")
    for gy in range(8, 2 * T + 2, 5):
        r.set(bx0 + 1, gy, "#86582e")
    for i, sy in enumerate((9, 2 * T - 6)):
        r.rect(bx0 + 2, sy, bx1 - 2, sy + 9, "#4a2e22")                   # dark back
        x = bx0 + 3
        k = 0
        while x < bx1 - 3:
            h = 7 + (k * 7 + i * 3) % 3
            book(r, x, sy + 9 - h, h, ("#e84a3c", "#f8d040", "#4c78e0", "#58a840", "#f07ca8", "#ffffff")[(k + i * 2) % 6])
            if k % 5 == 3:  # a leaning book
                r.set(x + 1, sy + 3, "#40b8b0")
                r.rect(x + 1, sy + 4, x + 1, sy + 8, "#40b8b0")
                x += 1
            x += 2
            k += 1
        r.rect(bx0 + 1, sy + 10, bx1 - 1, sy + 10, "#c89060")             # shelf lip


# =============================================================== CARE CENTRE
def paint_center(frame):
    r = Room(15, 10, "center")
    shell(r)
    # --- bookshelf: wood grain frame, books of mixed height, a plant on top
    bx0, bx1 = T + 2, 3 * T - 3
    bookcase(r, bx0, bx1)
    r.rect(bx0 + 4, 3, bx0 + 8, 6, "#f8d040")                             # tiny pot on top
    r.set(bx0 + 5, 2, "#58a840")
    r.set(bx0 + 7, 1, "#9cd468")
    r.set(bx0 + 6, 2, "#58a840")
    # --- wall monitor with a heart-rate trace
    rbox(r, 6 * T + 4, 5, 9 * T - 5, 22, "#4e4a66", hi="#7a7694", lo="#2e2a44")
    vgrad(r, 6 * T + 6, 7, 9 * T - 7, 20, ["#1c2c60", "#22366e", "#2c4c98"])
    trace = [0, 0, 0, -1, 0, -5, 4, 0, 0, 0, -1, 0, 0, 0, -5, 4, 0, 0, 0, -1, 0, 0, -5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    for i, x in enumerate(range(6 * T + 7, 9 * T - 7)):
        r.set(x, 14 + trace[i % len(trace)], "#9cf0a0")
    for x in range(6 * T + 8, 6 * T + 16, 2):
        r.set(x, 9, "#6898e8")
    r.rect(7 * T + 14, 22, 8 * T + 1, 24, "#6c6e8c")                     # mount
    # --- PC terminal: tall unit, screen with text, slots, grille, LED
    px0, px1 = 13 * T - 2, 14 * T - 2
    rbox(r, px0, 3, px1, 2 * T + 7, "#e6e6ee", hi="#ffffff", lo="#a8aac0")
    rbox(r, px0 + 2, 5, px1 - 2, 16, "#2c3a6c")
    for y in (7, 9, 11, 13):
        r.rect(px0 + 4, y, px0 + 4 + (5 + y) % 9, y, "#9cf0e0")
    r.set(px0 + 4 + 6, 13, "#ffffff")
    for y in (19, 22):
        r.rect(px0 + 3, y, px1 - 3, y, OL)
        r.rect(px0 + 3, y + 1, px1 - 3, y + 1, "#ffffff")
    for y in range(26, 2 * T + 4, 2):
        for x in range(px0 + 3, px1 - 3, 2):
            r.set(x, y, "#a8aac0")
    r.set(px1 - 4, 19, "#58e868")
    # --- U-shaped counter
    c_hi, c_top, c_mid, c_edge, c_front, c_lo = "#ffc4b4", "#f4907c", "#e87864", "#d05c4c", "#c44c40", "#9c3434"
    L, R_, TOPY, FRONT = 3 * T, 12 * T - 1, 3 * T, 3 * T + 11
    for ax in (L, R_ - T + 1):
        rbox(r, ax, 2 * T - 6, ax + T - 1, FRONT, c_top, hi=c_hi, lo=c_mid)
        r.rect(ax + 3, 2 * T - 3, ax + 3, 2 * T + 6, "#ffd8cc")             # sheen streak
    rbox(r, L, TOPY, R_, FRONT, c_top, hi=c_hi, lo=c_mid)
    for x in range(L + 10, R_ - 6, 26):                                    # sheen streaks
        r.rect(x, TOPY + 2, x + 6, TOPY + 2, "#ffd8cc")
        r.rect(x + 1, TOPY + 3, x + 3, TOPY + 3, "#ffd8cc")
    r.rect(L + 1, FRONT - 2, R_ - 1, FRONT - 1, c_edge)                    # rounded lip
    r.box(L, FRONT, R_, FRONT + 5, c_front)
    for x in range(L + 4, R_ - 8, 18):                                     # recessed front panels
        r.rect(x, FRONT + 2, x + 13, FRONT + 3, c_lo)
        r.rect(x, FRONT + 1, x + 13, FRONT + 1, "#e06858")
    r.box(L + 2, FRONT + 5, R_ - 2, FRONT + 8, "#b8bccc")
    r.rect(L + 3, FRONT + 6, R_ - 3, FRONT + 6, "#e6e6ee")
    # sign-in sheet with lines and a pen, a desk bell
    rbox(r, 7 * T + 2, TOPY + 3, 8 * T - 3, TOPY + 9, "#ffffff", lo="#d8dcea")
    for y in (TOPY + 5, TOPY + 7):
        r.rect(7 * T + 4, y, 8 * T - 6, y, "#9aa0be")
    r.rect(8 * T - 6, TOPY + 3, 8 * T - 1, TOPY + 3, "#4c78e0")
    r.set(8 * T, TOPY + 2, "#4c78e0")
    for y, (a, b) in enumerate(((2, 3), (1, 4), (0, 5))):
        r.rect(9 * T + 6 + a, TOPY + 3 + y, 9 * T + 6 + b, TOPY + 3 + y, "#f8d040" if y else "#fff28c")
    r.rect(9 * T + 5, TOPY + 6, 9 * T + 12, TOPY + 6, "#c08c28")
    r.set(9 * T + 9, TOPY + 2, OL)
    # flower pots on the arms: shaped pot, leaves, five flower heads
    for px in (L + 8, R_ - 7):
        r.rect(px - 6, 2 * T - 2, px + 5, 2 * T - 1, OL)
        r.rect(px - 5, 2 * T - 1, px + 4, 2 * T - 1, "#fff28c")
        for y in range(2 * T, 2 * T + 8):
            inset = (y - 2 * T) // 4
            r.set(px - 5 + inset, y, OL)
            r.set(px + 4 - inset, y, OL)
            r.rect(px - 4 + inset, y, px + 3 - inset, y, "#f8d040")
            r.set(px + 2 - inset, y, "#c08c28")
            r.set(px - 3 + inset, y, "#fff28c")
        r.rect(px - 3, 2 * T + 8, px + 2, 2 * T + 8, OL)
        for dx, dy in ((-6, -4), (5, -4), (-4, -2), (4, -2)):
            r.rect(px + dx, 2 * T + dy, px + dx + 1, 2 * T + dy, LEAF[2])
            r.set(px + dx, 2 * T + dy - 1, LEAF[1])
        for (dx, dy, petal, eye) in ((-3, -7, "#ffffff", "#f8d040"), (2, -8, "#f07ca8", "#ffffff"),
                                     (-1, -4, "#f07ca8", "#ffffff"), (4, -5, "#ffffff", "#f8d040"),
                                     (-5, -5, "#ffffff", "#f07ca8")):
            fx, fy = px + dx, 2 * T + dy
            for ox, oy in ((0, -1), (-1, 0), (1, 0), (0, 1)):
                r.set(fx + ox, fy + oy, petal)
            r.set(fx, fy, eye)
    # --- healing machine
    mx0, mx1 = 4 * T + 1, 6 * T + 7
    rbox(r, mx0, 4, mx1, 2 * T + 13, "#f4f4f8", hi="#ffffff", lo="#c4c8d8")
    r.rect(mx1 - 4, 6, mx1 - 2, 2 * T + 11, "#dde0ea")                     # side panel
    for y in range(9, 22, 3):
        r.rect(mx1 - 4, y, mx1 - 2, y, "#a8aac0")                          # vents
    rbox(r, mx0 + 4, 7, mx1 - 7, 26, "#6c6e8c", hi="#9aa0be", lo="#4e4a66")  # screen bezel
    r.rect(mx0 + 6, 9, mx1 - 9, 24, "#1e4a34")
    lit = frame % 3
    for i in range(3):
        for j in range(2):
            on = (i + j) % 3 == lit
            x, y = mx0 + 8 + i * 6, 11 + j * 6
            r.box(x - 1, y - 1, x + 4, y + 4, "#2f6a3c")
            r.rect(x, y, x + 3, y + 3, "#9cf0a0" if on else "#3e8a50")
            r.set(x, y, "#ffffff" if on else "#58a840")
            if on:
                r.set(x + 1, y, "#e8ffe8")
    for x in range(mx0 + 7, mx1 - 9, 2):
        r.set(x, 23, "#2f6a3c")                                             # scanline
    # tray with six dimples + red cross plate + buttons
    r.box(mx0 + 3, 28, mx1 - 6, 2 * T - 2, "#c8ccdc")
    for i in range(3):
        r.rect(mx0 + 6 + i * 6, 2 * T - 5, mx0 + 8 + i * 6, 2 * T - 4, "#8e92ac")
    rbox(r, mx0 + 8, 2 * T, mx0 + 21, 2 * T + 11, "#ffffff", lo="#d8dcea")
    r.rect(mx0 + 13, 2 * T + 2, mx0 + 16, 2 * T + 9, "#e04838")
    r.rect(mx0 + 10, 2 * T + 4, mx0 + 19, 2 * T + 7, "#e04838")
    r.rect(mx0 + 13, 2 * T + 2, mx0 + 13, 2 * T + 5, "#f07058")
    r.rect(mx0 + 16, 2 * T + 6, mx0 + 16, 2 * T + 9, "#a02c34")
    r.set(mx0 + 25, 2 * T + 2, "#58e868")
    r.set(mx0 + 25, 2 * T + 5, "#f8d040")
    # --- desk phone: body, handset, keypad, LED, curly cord
    ph0 = 9 * T + 1
    rbox(r, ph0, 2 * T - 4, ph0 + 13, 2 * T + 9, "#eeeef4", hi="#ffffff", lo="#c4c8d8")
    rbox(r, ph0 + 1, 2 * T - 7, ph0 + 12, 2 * T - 2, "#4e4a66", hi="#7a7694")
    for y in range(2 * T + 1, 2 * T + 8, 2):
        for x in range(ph0 + 3, ph0 + 11, 3):
            r.set(x, y, "#9aa0be")
    r.set(ph0 + 11, 2 * T, "#e04838")
    for i, y in enumerate(range(2 * T + 10, 2 * T + 14)):
        r.set(ph0 + 12 + (i % 2), y, "#4e4a66")
    # --- wall clock + framed picture on the wall
    wall_clock(r, 11 * T + 4, 14)
    # --- heal pad: a lit dome, shaded top half, bright lower half
    cx, cy, rx, ry = 7.5 * T, 6.0 * T, 2.4 * T, 2.0 * T
    def pad(lower):
        def inside(x, y):
            d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2
            if d >= 1.0 or (d > 0.86 and (x + y) % 2):
                return False
            return (y >= cy) == lower
        return inside
    r.recolor(pad(True), "light")
    # --- lounge
    seat(r, 12 * T, 5 * T)
    glass_table(r, 12 * T - 2, 6 * T + 4, item="cup")
    seat(r, 2 * T + 1, 5 * T)
    glass_table(r, T + 3, 6 * T + 4, item="magazine")
    mat(r, 7)
    r.block(*[(x, 2) for x in range(1, 14) if x != 7], (13, 2))
    r.block(*[(x, 3) for x in range(3, 12)], (3, 2), (11, 2))
    r.block((12, 5), (12, 6), (13, 6), (12, 7), (13, 7), (2, 5), (1, 6), (2, 6), (1, 7), (2, 7))
    r.solid.discard((7, 2))
    return r


# ====================================================================== MART
GOODS = ["#e84a3c", "#f8d040", "#58a840", "#4c78e0", "#f07ca8", "#ffffff", "#f07c2e", "#40b8b0"]


def shelf_unit(r, x0, y0, h=3 * T, seed=0):
    """Tall shelving unit: header sign, three shelves of mixed products
    (boxes, bottles, cans), yellow price tags, side panel, kick plate."""
    rbox(r, x0, y0, x0 + T - 1, y0 + h - 1, "#eeeef4", hi="#ffffff", lo="#c4c8d8")
    r.rect(x0 + 1, y0 + 1, x0 + T - 2, y0 + 5, "#e04838" if seed % 2 else "#4870c8")   # header
    r.rect(x0 + 1, y0 + 1, x0 + T - 2, y0 + 1, "#ffa088" if seed % 2 else "#6898e8")
    for x in range(x0 + 3, x0 + T - 4, 2):
        r.set(x, y0 + 3, "#ffffff")
    r.rect(x0 + T - 4, y0 + 6, x0 + T - 2, y0 + h - 2, "#d4d8e4")         # side panel
    r.rect(x0 + T - 4, y0 + 6, x0 + T - 4, y0 + h - 2, "#a8aac0")
    for i, sy in enumerate(range(y0 + 7, y0 + h - 8, 12)):
        r.rect(x0 + 1, sy, x0 + T - 5, sy + 8, "#d8dee8")
        kind = (i + seed) % 3
        x = x0 + 2
        while x < x0 + T - 6:
            c = GOODS[(x + i * 3 + seed) % len(GOODS)]
            if kind == 0:
                box_item(r, x, sy + 2, 3, 6, c)
                x += 4
            elif kind == 1:
                bottle(r, x, sy + 1, c, h=7)
                x += 3
            else:
                r.rect(x, sy + 4, x + 2, sy + 7, c)
                r.rect(x, sy + 4, x + 2, sy + 4, "#e6e6ee")
                r.set(x, sy + 5, "#ffffff")
                x += 3
        r.rect(x0 + 1, sy + 9, x0 + T - 5, sy + 9, "#9aa0be")              # shelf lip
        for tx in range(x0 + 2, x0 + T - 6, 5):
            r.rect(tx, sy + 9, tx + 2, sy + 9, "#f8d040")                   # price tags
    r.rect(x0 + 1, y0 + h - 4, x0 + T - 2, y0 + h - 2, "#e04838")
    r.rect(x0 + 1, y0 + h - 4, x0 + T - 2, y0 + h - 4, "#f07058")


def potion(r, x, y, col):
    """Tiny spray-bottle product for display cases."""
    r.rect(x + 1, y, x + 2, y, "#9aa0be")
    r.set(x + 3, y, "#9aa0be")
    r.rect(x, y + 1, x + 3, y + 5, col)
    r.rect(x, y + 3, x + 3, y + 3, "#ffffff")
    r.set(x, y + 1, "#ffffff")


def glass_counter(r, x0, y0, x1, y1):
    """Glass display counter: metal frame, glass top showing products inside,
    glazed front with mullions, yellow plinth."""
    rbox(r, x0, y0, x1, y1 - 10, "#e6e2f4", hi="#ffffff", lo="#b8b4d0")
    for i, x in enumerate(range(x0 + 4, x1 - 6, 7)):
        potion(r, x, y0 + 4 + (i % 2) * 3, ("#8c62c8", "#40b8b0", "#e84a3c", "#f8d040")[i % 4])
    for k in range(min(x1 - x0, y1 - y0) - 14):
        r.set(x0 + 3 + k, y0 + 1 + k // 2, "#ffffff")
    r.box(x0, y1 - 10, x1, y1 - 3, "#a8c8f0")
    for x in range(x0 + 6, x1 - 2, 8):
        r.rect(x, y1 - 9, x, y1 - 4, "#e6e6ee")
        r.rect(x + 1, y1 - 9, x + 1, y1 - 4, "#8ea8c4")
    r.rect(x0 + 1, y1 - 9, x1 - 1, y1 - 9, "#d4e6fa")
    rbox(r, x0, y1 - 3, x1, y1 + 1, "#e8c858", hi="#fff0a0", lo="#b8902c")


def paint_mart(frame):
    r = Room(14, 10, "mart")
    shell(r)
    # poster: headline bar, spray bottle, price burst, text lines
    p0, p1 = 3 * T + 2, 4 * T + 12
    rbox(r, p0, 5, p1, 27, "#ffffff", lo="#d8dcea")
    r.rect(p0 + 2, 7, p1 - 2, 10, "#4870c8")
    for x in range(p0 + 4, p1 - 4, 3):
        r.set(x, 8, "#ffffff")
    potion(r, p0 + 4, 13, "#8c62c8")
    potion(r, p0 + 9, 13, "#40b8b0")
    for y in range(13, 21):
        for x in range(p1 - 10, p1 - 2):
            if abs(x - (p1 - 6)) + abs(y - 17) <= 4:
                r.set(x, y, "#f8d040" if abs(x - (p1 - 6)) + abs(y - 17) < 4 else "#e88848")
    r.rect(p0 + 3, 23, p1 - 3, 23, "#9aa0be")
    r.rect(p0 + 3, 25, p1 - 8, 25, "#9aa0be")
    # glass wall cabinets with bottles on shelves
    for i in range(3):
        x0 = 6 * T + 1 + i * T
        glass_pane(r, x0, 4, x0 + T - 2, 2 * T - 1, tint="#cfe6f6",
                   goods=["#f8d040", "#f2b832", "#e84a3c", "#58a840"], shelves=3)
    # chiller cases: header light, glass doors, bottles with caps, handles, grille
    for i in range(2):
        x0 = 10 * T + i * T
        rbox(r, x0, 2 * T - 11, x0 + T - 1, 3 * T - 1, "#eeeef4", hi="#ffffff", lo="#c4c8d8")
        r.rect(x0 + 2, 2 * T - 9, x0 + T - 3, 2 * T - 7, "#58e868")
        r.rect(x0 + 2, 2 * T - 9, x0 + T - 3, 2 * T - 9, "#c8ffd0")
        rbox(r, x0 + 1, 2 * T - 5, x0 + T - 2, 2 * T + 9, "#d4ecf8", hi="#ffffff", lo="#8ea8c4")
        for j, gy in enumerate((2 * T - 4, 2 * T + 2)):
            for gx in range(x0 + 2, x0 + T - 3, 3):
                bottle(r, gx, gy, GOODS[(gx // 3 + j + i) % 5], h=5)
            r.rect(x0 + 2, gy + 6, x0 + T - 3, gy + 6, "#8ea8c4")
        r.rect(x0 + T - 4, 2 * T - 2, x0 + T - 4, 2 * T + 5, "#9aa0be")      # handle
        r.set(x0 + 3, 2 * T - 3, "#ffffff")
        rbox(r, x0, 2 * T + 9, x0 + T - 1, 3 * T - 1, "#6898e8", hi="#94c4ff", lo="#3c62b0")
        for x in range(x0 + 2, x0 + T - 2, 2):
            r.rect(x, 2 * T + 12, x, 2 * T + 13, "#2c4c98")                 # grille
    plant_palm(r, 2 * T + 8, 3 * T - 2)
    # cardboard box: flaps, tape, label
    rbox(r, T + 1, 3 * T, 2 * T + 1, 4 * T - 2, "#e0b468", hi="#f8d890", lo="#b08440")
    r.rect(T + 2, 3 * T + 4, 2 * T, 3 * T + 4, "#b08440")
    r.rect(T + 8, 3 * T + 1, T + 9, 4 * T - 3, "#c8a050")
    r.rect(T + 8, 3 * T + 1, T + 8, 3 * T + 3, "#f8e8b0")
    r.box(T + 3, 3 * T + 7, T + 7, 3 * T + 11, "#ffffff")
    r.set(T + 4, 3 * T + 9, "#e04838")
    # register desk (vertical): bevelled top, cash register, receipt, drawer, side door
    rbox(r, 4 * T, 2 * T - 3, 5 * T - 1, 6 * T - 1, "#c8e0f8", hi="#eef6ff", lo="#94b4e0")
    r.rect(5 * T - 4, 2 * T + 1, 5 * T - 2, 6 * T - 6, "#a8c4ec")
    r.rect(4 * T + 2, 5 * T - 6, 5 * T - 6, 5 * T - 6, "#94b4e0")             # cabinet door seam
    r.rect(5 * T - 7, 5 * T - 2, 5 * T - 7, 5 * T + 2, "#6c6e8c")             # handle
    rbox(r, 4 * T + 1, 6 * T - 6, 5 * T - 2, 6 * T - 1, "#8e92ac", hi="#b8bccc")
    rbox(r, 4 * T + 1, 2 * T, 5 * T - 2, 3 * T + 6, "#e6e6ee", hi="#ffffff", lo="#a8aac0")
    r.rect(4 * T + 3, 2 * T + 2, 5 * T - 4, 2 * T + 6, "#2e3a2e")             # display
    for x in range(4 * T + 4, 5 * T - 5, 2):
        r.set(x, 2 * T + 4, "#58e868")
    for y in (2 * T + 9, 2 * T + 11, 2 * T + 13):
        for x in range(4 * T + 3, 5 * T - 4, 2):
            r.set(x, y, "#6c6e8c" if (x + y) % 4 else "#e04838")
    r.rect(4 * T + 2, 3 * T + 2, 5 * T - 3, 3 * T + 5, "#c8ccdc")             # drawer
    r.rect(4 * T + 6, 3 * T + 3, 4 * T + 9, 3 * T + 3, "#6c6e8c")
    r.rect(5 * T - 4, 2 * T - 6, 5 * T - 2, 2 * T, "#ffffff")                 # receipt paper
    r.set(5 * T - 3, 2 * T - 4, "#9aa0be")
    rbox(r, 4 * T + 3, 3 * T + 9, 5 * T - 4, 4 * T + 3, "#f6eebe", lo="#dccf9a")  # notepad
    for y in (3 * T + 11, 3 * T + 13):
        r.rect(4 * T + 5, y, 5 * T - 6, y, "#c4b47a")
    glass_counter(r, T + 1, 4 * T + 6, 4 * T - 1, 6 * T - 1)
    for i, col in enumerate((9, 10, 12)):
        shelf_unit(r, col * T, 5 * T, seed=i)
    glass_counter(r, 2 * T, 7 * T + 2, 4 * T + 6, 8 * T + 12)
    mat(r, 6)
    r.block((1, 2), (2, 2), (3, 2), (1, 3), (4, 2), (4, 3), (4, 4), (4, 5), (1, 4), (2, 4), (3, 4), (1, 5), (2, 5), (3, 5),
            (10, 2), (11, 2), (2, 7), (3, 7), (4, 7), (2, 8), (3, 8), (4, 8),
            (9, 5), (9, 6), (9, 7), (10, 5), (10, 6), (10, 7), (12, 5), (12, 6), (12, 7))
    return r


# ====================================================================== HOME
def paint_home(frame, theme="home", rug=("#68b858", "#4c9a44", "#58a840")):
    r = Room(13, 10, theme)
    shell(r)
    # --- sink unit: worktop lip, recessed basin, tap, cabinet doors with handles
    s0, s1 = T + 1, 3 * T - 1
    rbox(r, s0, 5, s1, 2 * T - 1, "#f4f4f8", hi="#ffffff", lo="#c4c8d8")
    r.rect(s0 + 1, 15, s1 - 1, 16, "#d8dcea")                                  # worktop lip
    rbox(r, s0 + 3, 8, s0 + 19, 14, "#9aa0be")                                 # basin
    r.rect(s0 + 4, 9, s0 + 18, 9, "#6c6e8c")
    r.rect(s0 + 5, 12, s0 + 17, 13, "#c8ccdc")
    r.set(s0 + 11, 12, "#4e4a66")                                              # drain
    r.rect(s0 + 10, 3, s0 + 12, 4, "#c8ccdc")                                  # tap
    r.rect(s0 + 11, 4, s0 + 11, 8, "#9aa0be")
    r.set(s0 + 10, 3, "#ffffff")
    rbox(r, s0 + 22, 9, s1 - 2, 14, "#e6e6ee", hi="#ffffff")                   # dish rack
    for x in range(s0 + 24, s1 - 3, 2):
        r.rect(x, 7, x, 10, "#ffffff")
    for d in range(2):                                                          # cabinet doors
        dx0 = s0 + 2 + d * 15
        rbox(r, dx0, 17, dx0 + 13, 2 * T - 2, "#6898e8", hi="#94c4ff", lo="#3c62b0")
        r.rect(dx0 + (11 if d == 0 else 2), 21, dx0 + (11 if d == 0 else 2), 25, "#ffffff")
    # --- glass cupboard: wood frame with grain, plates and cups inside, drawers
    rbox(r, 3 * T, 1, 4 * T, 2 * T - 1, "#d8a868", hi="#ecc488", lo="#a8784a")
    for y in range(3, 2 * T - 2, 4):
        r.set(3 * T + 1, y, "#c08850")
    rbox(r, 3 * T + 2, 3, 4 * T - 2, 17, "#d4ecf8", hi="#ffffff", lo="#8ea8c4")
    r.rect(3 * T + 3, 10, 4 * T - 3, 10, "#a8784a")
    for x in (3 * T + 4, 3 * T + 9):                                           # plates
        r.box(x - 1, 4, x + 3, 9, "#ffffff")
        r.rect(x, 6, x + 2, 7, "#d8dcea")
    for x in (3 * T + 4, 3 * T + 8, 3 * T + 12):                               # cups
        r.rect(x, 12, x + 1, 15, "#f07ca8")
        r.set(x + 2, 13, "#f07ca8")
    for k in range(6):
        r.set(3 * T + 5 + k, 4 + k, "#ffffff")
    for y in (20, 25):
        rbox(r, 3 * T + 2, y, 4 * T - 2, y + 4, "#c08850", hi="#ecc488")
        r.rect(3 * T + 7, y + 2, 3 * T + 9, y + 2, "#4a2a22")
    # --- pedal bin
    rbox(r, 4 * T + 3, 2 * T - 14, 5 * T - 4, 2 * T - 1, "#e6e6ee", hi="#ffffff", lo="#a8aac0")
    r.rect(4 * T + 3, 2 * T - 11, 5 * T - 4, 2 * T - 11, OL)
    r.rect(4 * T + 6, 2 * T - 15, 5 * T - 7, 2 * T - 15, "#9aa0be")
    r.rect(4 * T + 5, 2 * T, 4 * T + 8, 2 * T, "#9aa0be")
    # --- framed picture between bin and cooker
    framed_picture(r, 5 * T, 5, 6 * T - 2, 17)
    # --- cooker: burners, knobs, oven window with glare, handle
    c0, c1 = 6 * T + 1, 7 * T + 14
    rbox(r, c0, 3, c1, 2 * T - 1, "#e6e6ee", hi="#ffffff", lo="#a8aac0")
    rbox(r, c0 + 2, 5, c1 - 2, 13, "#4e4a66")
    for bx in (c0 + 6, c0 + 20):
        for y in range(6, 13):
            for x in range(bx - 4, bx + 5):
                d = hypot(x - bx, (y - 9) * 1.3)
                if 2.2 < d < 4.0:
                    r.set(x, y, "#2e2a44" if d > 3.2 else "#7a7694")
        r.set(bx, 9, "#e04838")
    for x in range(c0 + 4, c1 - 3, 5):                                         # knobs
        r.rect(x, 15, x + 1, 16, "#2e2a44")
        r.set(x, 15, "#9aa0be")
    rbox(r, c0 + 3, 18, c1 - 3, 2 * T - 3, "#2e2a44")                          # oven door
    r.rect(c0 + 5, 21, c1 - 5, 2 * T - 6, "#4e4a66")
    for k in range(4):
        r.set(c0 + 7 + k, 21 + k, "#9aa0be")
    r.rect(c0 + 5, 19, c1 - 5, 19, "#c8ccdc")                                  # handle
    # --- TV: rounded casing, screen with a scene and glare, grille, stand
    tv0, tv1 = 8 * T + 2, 9 * T + 13
    rbox(r, tv0, 6, tv1, 2 * T - 6, "#4e4a66", hi="#7a7694", lo="#2e2a44")
    rbox(r, tv0 + 2, 8, tv1 - 6, 2 * T - 9, "#94c4ff")
    vgrad(r, tv0 + 3, 9, tv1 - 7, 16, ["#c2ecff", "#94c4ff"])
    r.rect(tv0 + 3, 17, tv1 - 7, 2 * T - 10, "#58a840")
    r.rect(tv0 + 3, 17, tv1 - 7, 17, "#9cd468")
    r.rect(tv0 + 12, 13, tv0 + 15, 16, "#f8d040")                              # a little Pokemon-ish blob
    r.set(tv0 + 13, 14, OL)
    r.set(tv0 + 4, 9, "#ffffff")
    r.set(tv0 + 5, 9, "#ffffff")
    r.set(tv0 + 4, 10, "#ffffff")
    for y in range(9, 2 * T - 10, 2):                                          # speaker grille
        r.rect(tv1 - 4, y, tv1 - 2, y, "#2e2a44")
    r.set(tv1 - 3, 2 * T - 9, "#e04838")
    rbox(r, tv0 + 2, 2 * T - 6, tv1 - 2, 2 * T - 1, "#a8784a", hi="#d8a868")
    r.rect(tv0 + 15, 2 * T - 5, tv0 + 15, 2 * T - 2, "#86522e")
    r.set(tv0 + 12, 2 * T - 3, "#f8d040")
    r.set(tv0 + 18, 2 * T - 3, "#f8d040")
    # --- staircase (cols 10-11): rises away up the back wall to a dark landing.
    # Treads (lit nosing) over shaded risers, a red runner with brass rods,
    # a wooden stringer whose saw-tooth edge follows the steps, a handrail
    # with spindles and a newel post at the foot.
    X0, X1, YB, N, RISE, SHIFT = 9 * T + 8, 12 * T - 1, 3 * T - 1, 6, 7, 4
    r.rect(X0 + N * SHIFT - 1, 0, X1, YB - N * RISE, "#2e2a44")              # landing opening
    r.rect(X0 + N * SHIFT - 1, YB - N * RISE, X1, YB - N * RISE, "#6c6e8c")
    for i in range(N):
        y1 = YB - i * RISE
        y0 = y1 - RISE + 1
        x0 = X0 + i * SHIFT
        r.rect(x0, y0, X1, y1, "#c8a050")                                      # riser
        r.rect(x0, y0, X1, y0 + 2, "#f2d878")                                  # tread
        r.rect(x0, y0, X1, y0, "#fff6c0")                                      # nosing
        r.rect(x0, y1, X1, y1, "#8c6a30")
        rx0, rx1 = x0 + 5, X1 - 4                                              # runner
        r.rect(rx0, y0, rx1, y1 - 1, "#b83a34")
        r.rect(rx0, y0, rx1, y0 + 2, "#d85040")
        r.rect(rx0, y0, rx1, y0, "#f08870")
        r.rect(rx0, y1 - 1, rx1, y1 - 1, "#f8d040")                             # brass rod
        r.set(rx0, y1 - 1, "#fff28c")
        r.rect(x0 - 3, y0, x0 - 1, y1, "#a8784a")                              # stringer
        r.set(x0 - 3, y0, "#d8a868")
        r.rect(x0 - 4, y0, x0 - 4, y1, OL)
    r.rect(X0 - 4, YB, X0 + 1, YB, OL)
    for i in range(N):                                                         # spindles
        x = X0 - 6 + i * SHIFT
        foot = YB - i * RISE - 1
        r.rect(x, foot - 9, x, foot, "#d8a868")
        r.set(x + 1, foot - 8, "#86522e")
        r.rect(x + 1, foot - 7, x + 1, foot, "#a8784a")
    for i in range(N * SHIFT + 1):                                             # handrail
        x = X0 - 6 + i
        y = YB - 11 - round(i * RISE / SHIFT)
        r.rect(x, y - 1, x, y, "#c08048")
        r.set(x, y - 2, OL)
        r.set(x, y + 1, "#6a4428")
    rbox(r, X0 - 9, YB - 13, X0 - 5, YB, "#a8784a", hi="#d8a868", lo="#6a4428")  # newel post
    r.rect(X0 - 10, YB - 15, X0 - 4, YB - 13, "#c08048")
    r.rect(X0 - 9, YB - 16, X0 - 5, YB - 16, "#d8a868")
    r.set(X0 - 8, YB - 17, "#fff0a6")
    # --- big rug: border band with diamonds, flower dots, corner motifs
    rx0, ry0, rx1, ry1 = 3 * T, 3 * T, 11 * T - 1, 8 * T - 1
    rbox(r, rx0, ry0, rx1, ry1, rug[0], lo=rug[1])
    r.rect(rx0 + 3, ry0 + 3, rx1 - 3, ry1 - 3, "#f4f4f8")
    r.rect(rx0 + 5, ry0 + 5, rx1 - 5, ry1 - 5, rug[0])
    for x in range(rx0 + 6, rx1 - 4, 6):                                       # diamonds in the band
        for y in (ry0 + 4, ry1 - 4):
            r.set(x, y, rug[2])
    for y in range(ry0 + 7, ry1 - 4, 6):
        for x in (rx0 + 4, rx1 - 4):
            r.set(x, y, rug[2])
    for y in range(ry0 + 9, ry1 - 7, 8):
        for x in range(rx0 + 9, rx1 - 7, 8):
            if not (6 * T - 4 <= x <= 8 * T + 4 and 4 * T - 4 <= y <= 6 * T + 8):
                r.set(x, y, "#fff28c")
                for ox, oy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    r.set(x + ox, y + oy, "#f8d040")
    for (cx_, cy_) in ((rx0 + 8, ry0 + 8), (rx1 - 8, ry0 + 8), (rx0 + 8, ry1 - 8), (rx1 - 8, ry1 - 8)):
        for ox, oy in ((0, 0), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            r.set(cx_ + ox, cy_ + oy, "#ffffff")
    # --- table: hanging checked cloth with folds, plates, cups, vase
    tx0, ty0, tx1, ty1 = 6 * T, 4 * T + 2, 8 * T - 1, 6 * T + 4
    for y in range(ty1 - 2, ty1 + 6):
        for x in range(tx0 - 3, tx1 - 1):
            if (x + y) % 2 == 0 or y < ty1 + 4:
                r.set(x, y, rug[1])
    rbox(r, tx0, ty0, tx1, ty1 - 3, "#ffffff")
    for y in range(ty0 + 1, ty1 - 3):
        for x in range(tx0 + 1, tx1):
            on = ((x - tx0) // 4 + (y - ty0) // 4) % 2 == 0
            r.set(x, y, "#5c88dc" if on else "#ffffff")
    for x in range(tx0 + 3, tx1 - 2, 5):                                       # hanging folds
        r.rect(x, ty1 - 6, x, ty1 - 3, "#3c62b0")
    r.rect(tx0 + 1, ty1 - 3, tx1 - 1, ty1 - 3, "#3c62b0")
    for lx in (tx0 + 2, tx1 - 3):
        r.rect(lx, ty1 - 2, lx + 1, ty1 + 2, "#8a6a30")
    for (px_, py_) in ((tx0 + 4, ty0 + 4), (tx1 - 10, ty0 + 4), (tx0 + 4, ty1 - 14), (tx1 - 10, ty1 - 14)):
        r.box(px_, py_, px_ + 6, py_ + 5, "#ffffff")
        r.rect(px_ + 1, py_ + 1, px_ + 5, py_ + 1, "#d8dcea")
        r.rect(px_ + 2, py_ + 2, px_ + 4, py_ + 3, "#f8d040")                # food
    vx, vy = (tx0 + tx1) // 2, (ty0 + ty1) // 2 - 3
    rbox(r, vx - 2, vy, vx + 2, vy + 6, "#94c4ff", hi="#ffffff")
    r.set(vx, vy - 2, "#e84a3c")
    r.set(vx - 1, vy - 1, "#e84a3c")
    r.set(vx + 1, vy - 1, "#e84a3c")
    r.set(vx, vy - 1, "#f8d040")
    # --- chairs: wooden frame, slatted back, cushion with seam
    for (cx, cy, face) in ((5 * T + 1, 4 * T, "r"), (5 * T + 1, 5 * T + 2, "r"), (8 * T + 1, 4 * T, "l"), (8 * T + 1, 5 * T + 2, "l")):
        for y in range(cy + 11, cy + 16):
            for x in range(cx - 1, cx + 12):
                if (x + y) % 2 == 0 or y > cy + 12:
                    r.set(x, y, "#4c9a44")
        rbox(r, cx, cy + 3, cx + 12, cy + 12, "#d8a868", hi="#ecc488", lo="#a8784a")
        rbox(r, cx + 2, cy + 4, cx + 10, cy + 10, "#94c4ff", hi="#c2ecff", lo="#6898e8")
        r.rect(cx + 3, cy + 7, cx + 9, cy + 7, "#6898e8")
        back = cx if face == "r" else cx + 9
        rbox(r, back, cy - 3, back + 3, cy + 12, "#d8a868", hi="#ecc488", lo="#a8784a")
        for sy in (cy, cy + 4):
            r.set(back + 1, sy, "#86522e")
            r.set(back + 2, sy, "#86522e")
        for lx in (cx + 1, cx + 10):
            r.rect(lx, cy + 12, lx + 1, cy + 14, "#86522e")
    plant_palm(r, T + 8, 8 * T + 14)
    plant_palm(r, 11 * T + 8, 8 * T + 14)
    mat(r, 4)
    r.block((9, 2), (10, 2), (11, 2), (6, 4), (7, 4), (6, 5), (7, 5), (5, 4), (5, 5), (8, 4), (8, 5), (1, 8), (11, 8))
    return r


def paint_cottage(frame):
    """The neighbours' houses: the home's plan in sage and dark oak, a terracotta rug."""
    return paint_home(frame, "cottage", ("#b8604c", "#96483a", "#a85442"))


# ================================================================ THE LAB
def paint_lab(frame):
    r = Room(15, 10, "lab")
    shell(r)
    bookcase(r, T + 2, 3 * T - 3)
    bookcase(r, 3 * T + 1, 5 * T - 4)
    # --- field map: a wall screen of the Greenwood, contour rings and sightings
    rbox(r, 6 * T - 4, 4, 10 * T - 4, 25, "#3c4a58", hi="#66788a", lo="#26303c")
    vgrad(r, 6 * T - 2, 6, 10 * T - 6, 23, ["#14343c", "#184048", "#1c4c54"])
    for cx, cy, rad in ((6 * T + 16, 14, 7), (8 * T + 14, 15, 6)):
        for y in range(6, 24):
            for x in range(6 * T - 2, 10 * T - 5):
                if abs(hypot(x - cx, y - cy) - rad) < 0.6 or abs(hypot(x - cx, y - cy) - rad / 2) < 0.5:
                    r.set(x, y, "#3f8f88")
    for x, y in ((6 * T + 12, 11), (7 * T + 6, 17), (8 * T + 16, 12), (9 * T, 19)):
        r.set(x, y, "#f8d040")
    # --- instrument rack: dials, vents, one LED that blinks
    x0, x1 = 11 * T, 14 * T - 2
    rbox(r, x0, 3, x1, 2 * T + 7, "#d8e0e2", hi="#ffffff", lo="#9aa8b0")
    rbox(r, x0 + 3, 6, x0 + 20, 17, "#14343c")
    for i, x in enumerate(range(x0 + 5, x0 + 19)):
        r.set(x, 12 + (0, -2, -3, -1, 1, 2, 0)[i % 7], "#7cf0d8")
    for cx in (x0 + 27, x0 + 37):
        for y in range(7, 16):
            for x in range(cx - 4, cx + 5):
                if hypot(x - cx, y - 11) <= 4.2:
                    r.set(x, y, OL if hypot(x - cx, y - 11) > 3.2 else "#f4f6f6")
        r.rect(cx, 8, cx, 11, "#e04838")
    for y in range(22, 2 * T + 4, 2):
        r.rect(x0 + 4, y, x1 - 16, y, "#9aa8b0")
    r.rect(x1 - 9, 24, x1 - 7, 26, "#58e868" if frame % 2 == 0 else "#2a6a40")
    # --- work bench: pale top, teal drawers, the day's samples
    b0, b1, top = 3 * T - 2, 12 * T + 1, 3 * T - 3
    rbox(r, b0, top, b1, top + 13, "#f2f5f4", hi="#ffffff", lo="#b8c8c8")
    r.over.append((b0, top, b1, 3 * T - 1))  # the edge above row 3 is in front of anyone behind it
    rbox(r, b0, top + 13, b1, top + 22, "#4f8088", hi="#7ab0b4", lo="#2f5a64")
    for x in range(b0 + 8, b1 - 8, 24):
        r.rect(x, top + 16, x + 7, top + 16, "#d8e0e2")
    for x, col in ((4 * T, "#58c8b0"), (4 * T + 5, "#f07ca8"), (4 * T + 10, "#f8d040")):
        bottle(r, x, top + 3, col)
    r.box(9 * T + 2, top + 3, 10 * T + 2, top + 10, "#ffffff")               # open notebook
    r.rect(9 * T + 10, top + 4, 9 * T + 10, top + 9, "#b8c8c8")
    for y in (top + 5, top + 7):
        r.rect(9 * T + 4, y, 9 * T + 8, y, "#7a8a94")
        r.rect(9 * T + 12, y, 10 * T, y, "#7a8a94")
    # --- side tables and plants
    glass_table(r, T + 4, 5 * T + 2, item="magazine")
    glass_table(r, 11 * T + 10, 5 * T + 2, item="cup")
    plant_palm(r, T + 9, 9 * T - 2)
    plant_palm(r, 14 * T - 9, 9 * T - 2)
    r.block(*[(x, 3) for x in range(3, 12)])
    r.block(*[(x, y) for x in (1, 2, 3, 11, 12, 13) for y in (5, 6)], (1, 8), (13, 8))
    mat(r, 7)
    return r


# ==================================================== slice + dedupe + maps
# origin_mart is dev-only until Hearthfield exists: Mossgate has no Mart.
ROOMS = {"mossgate_center": (paint_center, 3), "origin_mart": (paint_mart, 1), "dawnbrook_home": (paint_home, 1),
         "dawnbrook_house": (paint_cottage, 1), "dawnbrook_lab": (paint_lab, 2),
         "mossgate_house_a": (paint_cottage, 1), "mossgate_house_b": (paint_cottage, 1)}


# The towns past Mossgate: one room per door in town_layouts.json, named <town>_center, _mart, _tutor, _house_a...
LAYOUTS = json.loads((Path(__file__).parent / "town_layouts.json").read_text(encoding="utf8"))
TOWN_ROOMS = {}  # map id -> (town, kind)
for _t in LAYOUTS:
    if _t["id"] in ("dawnbrook", "mossgate", "zenith"):
        continue
    _houses = 0
    for _d in _t["doors"]:
        if _d["label"] == "G":
            continue
        _kind = {"C": "center", "M": "mart", "V": "tutor"}.get(_d["label"], "house")
        _id = f"{_t['id']}_{_kind}" if _kind != "house" else f"{_t['id']}_house_{'abc'[_houses]}"
        _houses += _kind == "house"
        TOWN_ROOMS[_id] = (_t["id"], _kind, _d["x"], _d["y"])
        ROOMS[_id] = {"center": (paint_center, 3), "mart": (paint_mart, 1)}.get(_kind, (paint_cottage, 1))


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
        over = {}
        for x0, y0, x1, y1 in r0.over:
            for ty in range(y0 // T, y1 // T + 1):
                for tx in range(x0 // T, x1 // T + 1):
                    left, up = max(x0, tx * T), max(y0, ty * T)
                    right, down = min(x1, tx * T + T - 1) + 1, min(y1, ty * T + T - 1) + 1
                    piece = Image.new("RGBA", (T, T))
                    piece.paste(r0.t.img.crop((left, up, right, down)), (left - tx * T, up - ty * T))
                    over[tx, ty] = tile_id(piece)
        out[map_id] = (r0, ground, anims, over)
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


# where each building's door is in its town (door cells, x list, y)
DOORS = {"dawnbrook_home": ([7], 6), "dawnbrook_lab": ([22], 6), "dawnbrook_house": ([7], 16),
         "mossgate_center": ([6], 15), "mossgate_house_a": ([24], 6), "mossgate_house_b": ([24], 15),
         "origin_mart": ([7], 5)}
# exit mat column inside each room; you arrive one row above it, facing up
MAT = {"dawnbrook_home": 4, "dawnbrook_house": 4, "dawnbrook_lab": 7, "mossgate_center": 7,
       "mossgate_house_a": 4, "mossgate_house_b": 4, "origin_mart": 6}
for _id, (_town, _kind, _x, _y) in TOWN_ROOMS.items():
    DOORS[_id] = ([_x], _y)
    MAT[_id] = {"center": 7, "mart": 6}.get(_kind, 4)
ARRIVE = {k: [(MAT[k], 8)] * len(DOORS[k][0]) for k in DOORS}  # every room is 10 tall


def make_map(map_id, extras):
    tiles, rooms = build()
    room, ground, anims, over = rooms[map_id]
    m = MapData(room.w, room.h, 0)
    m.ground = [g + 1 for g in ground]
    for (x, y), tile in over.items():
        m.above[m.i(x, y)] = tile + 1
    for (x, y) in room.solid:
        m.block(x, y)
    door_xs, door_y = DOORS[map_id]
    mx = MAT[map_id]
    m.block(mx, room.h - 1, 0)
    town = "dawnbrook" if map_id == "origin_mart" else map_id.split("_")[0]  # the id starts with its town
    m.obj("warps", "exit", mx, room.h - 1, kind="door", targetMap=town, targetX=door_xs[0], targetY=door_y + 1,
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


def center(map_id="mossgate_center"):
    def extras(m):
        nurse = [say("Welcome to the Pokemon Origins Care Centre! Shall I look after your team?"),
                 {"op": "heal"},
                 say("All done! Your Pokemon are fighting fit. We hope to see you again!")]
        m.npc("nurse", 7, 2, "nurse", "down", *nurse)
        m.sign("counter_nurse", 7, 3, ops=nurse)
        m.sign("pc", 13, 2, text="It's the storage PC. (Box storage opens in a later update.)")
        m.sign("books", 1, 2, text="Books about caring for Pokemon. One is called 'Rest Is A Move Too'.")
        m.npc("visitor", 1, 4, "gentleman", "right", say("The nurse here never forgets a Pokemon's name."))
        m.npc("trainer", 13, 4, "cooltrainer_f", "left",
              say("Healing is free for every Pokemon Origins trainer. Use it before you take on the Gym!"))
    return make_map(map_id, extras)


def mart(map_id="origin_mart"):
    def extras(m):
        shop = [say("Welcome to the Mart! Potions, Poke Balls and everything a new trainer needs."),
                {"op": "shop", "shop": "origin_mart"}]
        m.npc("clerk", 3, 3, "clerk", "right", *shop)   # faces the register and its customer
        for x in (2, 3):
            m.sign(f"counter_{x}", x, 5, ops=shop)
        m.sign("register", 4, 3, ops=shop)
        m.sign("chiller", 10, 2, text="Cold drinks in the chiller. (They go on sale with the shop update.)")
        m.npc("shopper", 6, 2, "youngster", "up", say("Which drink gives a Pokemon the most energy? ...I'll take them all."))
        m.npc("browser", 11, 6, "twin", "up", say("These shelves go up to the ceiling! I can't reach the top."))
    return make_map(map_id, extras)


def home():
    def extras(m):
        m.sign("tv", 8, 1, text="A quiz show is on. 'Which Pokemon Origins town has a pond?' ...Easy!")
        m.sign("stairs", 10, 2, text="Your room is upstairs. (It opens in a later update.)")
        m.sign("sink", 1, 1, text="The dishes are done. Mom's handiwork.")
        m.sign("cooker", 6, 1, text="Something smells delicious. Dinner later!")
        m.npc("mom", 3, 5, "mom", "right", say("Off on an adventure? Don't forget to come home for dinner!"))
    return make_map("dawnbrook_home", extras)


def house(map_id, who, sprite, line, tv):
    def extras(m):
        m.sign("tv", 8, 1, text=tv)
        m.sign("stairs", 10, 2, text="That's the neighbours' upstairs. Better not.")
        m.npc(who, 3, 5, sprite, "right", say(line))
    return make_map(map_id, extras)


def lab():
    def extras(m):
        talk = [say("Ah, you made it! Every journey starts with a first partner."),
                say("(Choosing your partner here opens in a later update.)")]
        m.npc("professor", 7, 2, "professor", "down", *talk)
        m.sign("counter_professor", 7, 3, ops=talk)
        m.sign("books", 1, 1, text="Field notes on Pokemon of the Greenwood.")
        m.sign("field_map", 8, 1, text="A map of the Greenwood, dotted with this season's sightings.")
        m.sign("rack", 12, 1, text="The dials twitch whenever a wild Pokemon passes the lab.")
        m.npc("aide", 13, 4, "scientist", "left", say("The Professor studies how Pokemon and people first met."))
    return make_map("dawnbrook_lab", extras)


HOUSES = {  # who lives there, their sprite, what they say, what's on the television
    "hearthfield_house_a": ("baker", "picnicker", "Up before dawn, every day, for the smell of the first batch. Worth it.", "A cooking show. The bread has more charm than the host."),
    "hearthfield_house_b": ("miller", "old_man", "That mill turned on its own the night the grey coats came through. I don't like it.", "The harvest report: more wheat."),
    "ironbrook_house_a": ("smith", "hiker", "Tavish trained under nobody. Just walked up the hill one day and started.", "A quiet film. Nobody has spoken for ten minutes."),
    "saltmere_house_a": ("skipper", "sailor", "The tide comes in twice a day. Coral says three times, if you're brave.", "The shipping forecast, read very slowly."),
    "saltmere_house_b": ("grandmother", "old_woman", "My husband fished past the bar and saw lights under the water. Stayed ashore after that.", "A soap opera set on a lighthouse."),
    "dynamo_house_a": ("engineer", "scientist", "We have ninety-one percent. Nobody will tell me where the other nine goes.", "Static. Then, briefly, a man reading numbers."),
    "gale_house_a": ("weaver", "old_woman", "Everything in this house is tied down. Everything. Don't touch the spoons.", "The wind report: yes."),
    "starfall_house_a": ("watcher", "gentleman", "I've logged every clear night for fifty years. The Hollow people asked to buy the logs.", "A documentary about the moon."),
    "emberhold_house_a": ("founder", "biker", "My grandfather's anvil is in that forge. He says it hums. He's been gone twenty years.", "A sports match. Everyone is on fire."),
}
TUTOR_LINE = ("Pokemon forget, you know. Same as people. I help them remember. "
              "(The Move Learner opens with the party screen.)")


def town_map(map_id, town, kind):
    if kind == "center":
        return center(map_id)
    if kind == "mart":
        return mart(map_id)
    if kind == "tutor":
        return house(map_id, "tutor", "old_man", TUTOR_LINE, "A programme about remembering things.")
    who, sprite, line, tv = HOUSES[map_id]
    return house(map_id, who, sprite, line, tv)


MAPS = {
    **{k: (lambda k=k, v=v: town_map(k, v[0], v[1])) for k, v in TOWN_ROOMS.items()},
    "mossgate_center": center, "origin_mart": mart, "dawnbrook_home": home, "dawnbrook_lab": lab,
    "dawnbrook_house": lambda: house("dawnbrook_house", "neighbour", "old_man",
                                     "You're the kid from next door! The Professor's lab is just across the road.",
                                     "A nature show about the Greenwood is on."),
    "mossgate_house_a": lambda: house("mossgate_house_a", "ranger", "camper",
                                      "Moss only grows where it's left alone. So does the Gym Leader's patience.",
                                      "The weather report: damp, then damper."),
    "mossgate_house_b": lambda: house("mossgate_house_b", "fisher", "fisherman",
                                      "I built that boardwalk myself. The bridge too. Mind the loose plank.",
                                      "A fishing show. Nobody has caught anything yet."),
}
