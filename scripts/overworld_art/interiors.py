"""Interiors: the interior tileset and the Care Centre, Mart and home maps.

  frontend/public/maps/tilesets/interior.png   16x16 tiles, 8 columns
  frontend/public/maps/origin_center.json, origin_mart.json, origin_home.json

Rooms follow the FireRed layouts (refs: Pokemon Center D) in original art:
grid floors, two-row back walls (trim + wainscot), dark side walls, a red
exit mat on the bottom row that warps back to the building's door. Counter
staff are talked to ACROSS the counter: the counter cell in front of them
carries their script as a sign (FireRed does the same).

Gyms are intentionally absent: their interiors are decided per gym later.
"""
import json
from math import hypot

from scripts import gen_overworld_placeholders as base

from .tiles import T, Tile, hexrgb, rng

COLS = 8
OL = "#3a2426"
COL_FIRST = 1000

# ----------------------------------------------------------------- palette
P = {
    # care centre
    "c_floor": "#e6e6ee", "c_line": "#c4c6d6", "c_inset": "#f2f2f8", "c_inset_lo": "#d6d8e4",
    "c_wall": "#e2eaf6", "c_wall_lo": "#c4d0e6", "c_trim": "#5878b8", "c_trim_hi": "#8aa4dc",
    "c_panel": "#a8bce0", "c_panel_lo": "#8aa0cc", "side": "#46526e", "side_hi": "#6e7c9c",
    "red": "#e04838", "red_hi": "#f07058", "red_lo": "#a02c34",
    # mart
    "m_a": "#f2f6fc", "m_b": "#dce6f4", "m_line": "#c6d2e6", "m_wall": "#f4f0e2", "m_wall_lo": "#ddd4bc",
    "blue": "#4870c8", "blue_hi": "#6898e8", "blue_lo": "#2c4c98",
    # home
    "wood": "#d8a868", "wood_lo": "#c08850", "wood_line": "#9c6a3c", "wood_hi": "#ecc488",
    "paper": "#f6ead0", "paper_lo": "#e6d4b0", "paper_stripe": "#eedcb8",
    # shared
    "white": "#fffcf0", "white_lo": "#d8dcea", "grey": "#9aa0be", "grey_lo": "#6c6e8c",
    "glass": "#bfe6fa", "glass_lo": "#7cc0ec", "glint": "#ffffff",
    "yellow": "#f8d040", "yellow_hi": "#fff28c", "yellow_lo": "#c08c28",
    "green": "#58a840", "green_hi": "#9cd468", "green_lo": "#2f6a3c",
    "pot": "#c86848", "pot_lo": "#8a3e2a",
}


def solid(fill):
    return Tile(fill=P[fill] if fill in P else fill)


# =================================================================== floors
def floor_center(shadow=False):
    """FireRed-style grey grid: 8x8 squares, a raised inset in each."""
    t = solid("c_floor")
    for y in range(T):
        for x in range(T):
            u, v = x % 8, y % 8
            if u == 0 or v == 0:
                t.set(x, y, P["c_line"])
            elif 2 <= u <= 5 and 2 <= v <= 5:
                t.set(x, y, P["c_inset_lo"] if (u == 5 or v == 5) else P["c_inset"])
    if shadow:  # wall shadow falling on the first floor row
        t.rect(0, 0, 15, 2, P["c_inset_lo"])
        t.rect(0, 0, 15, 0, P["c_line"])
    return t


def floor_mart(shadow=False):
    t = Tile()
    for y in range(T):
        for x in range(T):
            col = P["m_a"] if ((x // 8) + (y // 8)) % 2 == 0 else P["m_b"]
            if x % 8 == 7 or y % 8 == 7:
                col = P["m_line"]
            t.set(x, y, col)
    if shadow:
        t.rect(0, 0, 15, 2, P["m_line"])
    return t


def floor_wood(shadow=False):
    t = solid("wood")
    for y in range(T):
        for x in range(T):
            row = y // 4
            if y % 4 == 3:
                t.set(x, y, P["wood_line"])
            elif (x + row * 6) % 16 == 0:
                t.set(x, y, P["wood_line"])     # staggered plank ends
            elif y % 4 == 0:
                t.set(x, y, P["wood_hi"])
            elif (x * 3 + y) % 11 == 0:
                t.set(x, y, P["wood_lo"])       # grain
    if shadow:
        t.rect(0, 0, 15, 1, P["wood_lo"])
    return t


# ==================================================================== walls
def wall_upper(base_c, lo_c, trim, trim_hi):
    t = solid(base_c)
    t.rect(0, 0, 15, 3, P[trim])
    t.rect(0, 1, 15, 1, P[trim_hi])
    t.rect(0, 4, 15, 4, P[lo_c])
    for x in range(0, 16, 8):
        t.set(x, 8, P[lo_c])
    return t


def wall_lower(base_c, panel, panel_lo, trim):
    t = solid(base_c)
    t.rect(0, 6, 15, 13, P[panel])
    t.rect(0, 6, 15, 6, P["white"])
    for x in range(0, 16, 8):
        t.rect(x + 1, 8, x + 6, 11, P[panel_lo])
        t.rect(x + 1, 8, x + 6, 8, P["white"])
    t.rect(0, 14, 15, 15, P[trim])
    return t


def side_wall():
    t = solid("side")
    t.rect(13, 0, 15, 15, P["side_hi"])
    t.rect(15, 0, 15, 15, OL)
    return t


def side_wall_r():
    t = side_wall()
    t.img = t.img.transpose(0)  # FLIP_LEFT_RIGHT
    t.px = t.img.load()
    return t


def bottom_edge():
    t = solid("side")
    t.rect(0, 0, 15, 2, P["side_hi"])
    t.rect(0, 0, 15, 0, OL)
    return t


def mat(floor_fn):
    t = floor_fn()
    t.rect(1, 2, 14, 15, OL)
    t.rect(2, 3, 13, 15, P["red"])
    t.rect(3, 4, 12, 15, P["red_hi"])
    for x in range(4, 12, 2):
        t.rect(x, 6, x, 15, P["red"])
    return t


# ================================================================ furniture
def window_tile(wall_fn):
    t = wall_fn()
    t.rect(2, 4, 13, 14, OL)
    t.rect(3, 5, 12, 13, P["glass"])
    t.rect(3, 10, 12, 13, P["glass_lo"])
    t.rect(7, 5, 8, 13, P["white"])
    t.rect(3, 9, 12, 9, P["white"])
    t.set(4, 6, P["glint"])
    t.set(5, 6, P["glint"])
    t.rect(1, 15, 14, 15, P["white_lo"])
    return t


def poster(wall_fn, colors):
    t = wall_fn()
    t.rect(3, 4, 12, 14, OL)
    t.rect(4, 5, 11, 13, colors[0])
    t.rect(5, 6, 10, 9, colors[1])
    t.rect(5, 11, 10, 11, colors[2])
    return t


def clock(wall_fn):
    t = wall_fn()
    for y in range(16):
        for x in range(16):
            d = hypot(x + 0.5 - 8, y + 0.5 - 9)
            if d < 5.5:
                t.set(x, y, OL if d > 4.6 else P["white"])
    t.rect(8, 6, 8, 9, OL)
    t.rect(8, 9, 10, 9, OL)
    return t


def counter(kind, top_c, top_hi, front, stripe, end=None, pot=False, register=False):
    """A counter seen from the front: lit top surface (rows 1-7), front panel
    with a stripe (rows 8-14). end='l'/'r' rounds that end."""
    t = kind()
    x0, x1 = (1 if end == "l" else 0), (14 if end == "r" else 15)
    t.rect(x0, 1, x1, 14, OL)
    t.rect(x0 + (1 if end == "l" else 0), 2, x1 - (1 if end == "r" else 0), 7, P[top_c])
    t.rect(x0 + (1 if end == "l" else 0), 2, x1 - (1 if end == "r" else 0), 2, P[top_hi])
    t.rect(x0 + (1 if end == "l" else 0), 8, x1 - (1 if end == "r" else 0), 13, P[front])
    t.rect(x0 + (1 if end == "l" else 0), 10, x1 - (1 if end == "r" else 0), 11, P[stripe])
    t.rect(0, 15, 15, 15, P["grey"])
    if pot:
        t.rect(5, 2, 10, 7, OL)
        t.rect(6, 3, 9, 6, P["pot"])
        t.rect(9, 3, 9, 6, P["pot_lo"])
        for x, y, c in ((5, 0, "#f07ca8"), (7, -1, P["yellow"]), (9, 0, "#ffffff"), (6, 1, P["green"]), (8, 1, P["green_hi"]), (10, 1, P["green"])):
            t.set(x, max(0, y), c)
    if register:
        t.rect(4, 0, 11, 7, OL)
        t.rect(5, 1, 10, 6, P["grey"])
        t.rect(6, 2, 9, 3, "#58a840")
        t.rect(5, 5, 10, 5, P["grey_lo"])
    return t


def machine(frame, side):
    """2-tile healing machine on the back wall: six light slots that chase."""
    t = wall_lower("c_wall", "c_panel", "c_panel_lo", "c_trim")
    t.rect(0, 1, 15, 15, OL)
    t.rect(1, 2, 15 if side == "l" else 14, 14, P["white"])
    t.rect(1, 12, 15 if side == "l" else 14, 14, P["white_lo"])
    lit = frame % 3
    for i in range(3):
        cx = 3 + i * 5 if side == "l" else 1 + i * 5
        for row, cy in enumerate((5, 9)):
            slot = i + (0 if side == "l" else 3)
            on = (slot + row) % 3 == lit
            t.rect(cx, cy - 1, cx + 2, cy + 1, OL)
            t.set(cx + 1, cy, P["yellow_hi"] if on else P["grey"])
            t.set(cx, cy, P["yellow"] if on else P["grey_lo"])
            t.set(cx + 2, cy, P["yellow"] if on else P["grey_lo"])
    if side == "r":
        t.rect(13, 3, 13, 11, P["red"])     # status lamp strip
        if frame == 1:
            t.rect(13, 3, 13, 11, P["red_hi"])
    return t


def pc_terminal(wall_fn):
    t = wall_fn()
    t.rect(2, 1, 13, 10, OL)
    t.rect(3, 2, 12, 9, P["grey"])
    t.rect(4, 3, 11, 8, "#2c4c98")
    t.rect(4, 3, 11, 3, "#6898e8")
    t.rect(5, 5, 7, 5, "#9cf0e0")
    t.rect(5, 7, 9, 7, "#9cf0e0")
    t.rect(1, 11, 14, 15, OL)
    t.rect(2, 12, 13, 14, P["wood"])
    t.rect(2, 12, 13, 12, P["wood_hi"])
    return t


def glass_table(part):
    """2x2 glass table: part is (cx, cy) of the 2x2 block."""
    big = Tile(32, 32)
    big.paste(floor_center(), 0, 0)
    big.paste(floor_center(), 16, 0)
    big.paste(floor_center(), 0, 16)
    big.paste(floor_center(), 16, 16)
    big.rect(3, 26, 28, 28, P["c_inset_lo"])     # shadow
    for lx in (4, 26):
        big.rect(lx, 18, lx + 1, 27, P["grey_lo"])
    big.rect(2, 3, 29, 22, OL)
    big.rect(3, 4, 28, 21, P["glass"])
    big.rect(3, 17, 28, 21, P["glass_lo"])
    for i in range(6):
        big.set(8 + i, 6 + i, P["glint"])
        big.set(12 + i, 6 + i, P["glint"])
    big.rect(3, 4, 28, 4, P["glint"])
    return big.img.crop((part[0] * 16, part[1] * 16, part[0] * 16 + 16, part[1] * 16 + 16))


def seat(floor_fn):
    t = floor_fn()
    t.rect(2, 3, 13, 14, OL)
    t.rect(3, 4, 12, 12, P["yellow"])
    t.rect(3, 4, 12, 5, P["yellow_hi"])
    t.rect(11, 6, 12, 12, P["yellow_lo"])
    t.rect(3, 13, 12, 13, P["yellow_lo"])
    t.rect(4, 15, 12, 15, P["c_inset_lo"])
    return t


def plant(floor_fn):
    t = floor_fn()
    t.rect(4, 15, 12, 15, P["c_inset_lo"])
    t.rect(4, 9, 11, 15, OL)
    t.rect(5, 10, 10, 14, P["pot"])
    t.rect(9, 10, 10, 14, P["pot_lo"])
    for y in range(0, 10):
        for x in range(1, 15):
            if hypot((x + 0.5 - 8) / 6.5, (y + 0.5 - 5) / 5) < 1:
                t.set(x, y, P["green_hi"] if x + y < 9 else P["green_lo"] if x - y > 6 else P["green"])
    return t


def glow(part):
    """3x3 heal-pad light: a lighter disc dithered at its rim (no alpha)."""
    big = Tile(48, 48)
    for gy in range(3):
        for gx in range(3):
            big.paste(floor_center(), gx * 16, gy * 16)
    lighter = {hexrgb(P["c_floor"])[:3]: "#f6f6fc", hexrgb(P["c_line"])[:3]: "#dcdeea",
               hexrgb(P["c_inset"])[:3]: "#ffffff", hexrgb(P["c_inset_lo"])[:3]: "#e8eaf4"}
    for y in range(48):
        for x in range(48):
            d = hypot(x + 0.5 - 24, (y + 0.5 - 24) * 1.15)
            rim = 19 <= d < 21.5 and (x + y) % 2 == 0
            if d < 19 or rim:
                c = big.px[x, y][:3]
                if c in lighter:
                    big.set(x, y, lighter[c])
    return big.img.crop((part[0] * 16, part[1] * 16, part[0] * 16 + 16, part[1] * 16 + 16))


# ------------------------------------------------------------------- mart
GOODS = ["#e84a3c", "#f8d040", "#40b8b0", "#f07ca8", "#4c78e0", "#58a840", "#ffffff", "#f07c2e"]


def shelf(end=None, seed=0):
    """Store shelf, front view: frame, two shelves of boxed goods, shadow."""
    t = floor_mart()
    x0, x1 = (1 if end == "l" else 0), (14 if end == "r" else 15)
    t.rect(x0, 0, x1, 14, OL)
    t.rect(x0 + (1 if end == "l" else 0), 1, x1 - (1 if end == "r" else 0), 13, P["grey"])
    r = rng(70 + seed)
    for sy in (2, 8):
        x = x0 + 1
        while x < x1 - 1:
            w = 2 + r(2)
            c = GOODS[r(len(GOODS))]
            t.rect(x, sy, min(x + w - 1, x1 - 1), sy + 4, c)
            t.rect(x, sy, min(x + w - 1, x1 - 1), sy, "#ffffff")
            x += w + 1
        t.rect(x0, sy + 5, x1, sy + 5, P["grey_lo"])
    t.rect(0, 15, 15, 15, P["m_line"])
    return t


def fridge(wall_fn):
    t = wall_fn()
    t.rect(1, 0, 14, 15, OL)
    t.rect(2, 1, 13, 14, P["white"])
    t.rect(3, 2, 12, 12, P["glass"])
    for i, c in enumerate(("#e84a3c", "#40b8b0", "#f8d040", "#4c78e0")):
        t.rect(4 + i * 2, 4, 4 + i * 2, 7, c)
        t.rect(4 + i * 2, 9, 4 + i * 2, 11, GOODS[(i + 3) % len(GOODS)])
    t.rect(3, 8, 12, 8, P["white_lo"])
    t.set(4, 3, P["glint"])
    t.rect(11, 6, 11, 9, P["grey_lo"])
    return t


def counter_v(part):
    """Mart side counter, top-down strip with a blue front facing right."""
    t = floor_mart()
    t.rect(1, 0 if part != "top" else 1, 14, 15 if part != "bot" else 14, OL)
    t.rect(2, 1 if part == "top" else 0, 10, 13 if part == "bot" else 15, P["m_b"])
    t.rect(2, 1 if part == "top" else 0, 3, 13 if part == "bot" else 15, P["white"])
    t.rect(11, 1 if part == "top" else 0, 13, 13 if part == "bot" else 15, P["blue"])
    t.rect(12, 1 if part == "top" else 0, 12, 13 if part == "bot" else 15, P["blue_hi"])
    if part == "top":
        t.rect(3, 2, 9, 8, OL)
        t.rect(4, 3, 8, 7, P["grey"])
        t.rect(5, 4, 7, 5, "#58a840")
    return t


# ------------------------------------------------------------------- home
def wall_home_upper():
    t = solid("paper")
    for x in range(1, 16, 4):
        t.rect(x, 3, x, 15, P["paper_stripe"])
    t.rect(0, 0, 15, 2, P["wood_lo"])
    t.rect(0, 0, 15, 0, P["wood_line"])
    return t


def wall_home_lower():
    t = solid("paper")
    for x in range(1, 16, 4):
        t.rect(x, 0, x, 5, P["paper_stripe"])
    t.rect(0, 6, 15, 15, P["wood"])
    t.rect(0, 6, 15, 6, P["wood_hi"])
    for x in range(0, 16, 8):
        t.rect(x, 7, x, 15, P["wood_line"])
    t.rect(0, 14, 15, 15, P["wood_line"])
    return t


def tv():
    t = wall_home_lower()
    t.rect(1, 1, 14, 11, OL)
    t.rect(2, 2, 13, 10, "#4e4a66")
    t.rect(3, 3, 12, 9, "#6898e8")
    t.rect(3, 3, 12, 4, "#c2ecff")
    t.rect(5, 6, 9, 7, "#f8d040")
    t.rect(1, 12, 14, 15, OL)
    t.rect(2, 13, 13, 14, P["wood_lo"])
    return t


def bookshelf(part):
    t = wall_home_upper() if part == "top" else wall_home_lower()
    t.rect(1, 0 if part == "bot" else 2, 14, 15, OL)
    t.rect(2, 1 if part == "bot" else 3, 13, 15, P["wood_lo"])
    r = rng(5 if part == "top" else 9)
    for sy in ((4, 10) if part == "top" else (1, 7)):
        x = 3
        while x < 13:
            w = 1 + r(2)
            t.rect(x, sy, min(x + w - 1, 12), sy + 4, GOODS[r(len(GOODS))])
            x += w
        t.rect(2, sy + 5, 13, sy + 5, P["wood_line"])
    return t


def kitchen(kind):
    t = wall_home_upper() if kind == "cab" else wall_home_lower()
    if kind == "cab":
        t.rect(0, 3, 15, 12, OL)
        t.rect(1, 4, 14, 11, P["white"])
        t.rect(7, 4, 8, 11, P["white_lo"])
        t.rect(5, 7, 5, 8, P["grey_lo"])
        t.rect(10, 7, 10, 8, P["grey_lo"])
        return t
    t.rect(0, 1, 15, 15, OL)
    t.rect(1, 2, 14, 14, P["white"])
    t.rect(1, 2, 14, 4, P["white_lo"])
    if kind == "sink":
        t.rect(4, 2, 11, 4, P["grey"])
        t.rect(7, 0, 8, 2, P["grey_lo"])
    else:  # stove
        for cx in (4, 11):
            t.rect(cx - 2, 2, cx + 1, 3, OL)
        t.rect(5, 8, 10, 12, OL)
        t.rect(6, 9, 9, 11, "#4e4a66")
    t.rect(1, 6, 14, 6, P["grey"])
    return t


def table_home(part):
    big = Tile(32, 32)
    for gy in range(2):
        for gx in range(2):
            big.paste(floor_wood(), gx * 16, gy * 16)
    big.rect(4, 27, 29, 29, P["wood_line"])
    big.rect(2, 4, 29, 24, OL)
    big.rect(3, 5, 28, 23, P["white"])
    big.rect(3, 19, 28, 23, P["white_lo"])
    big.rect(3, 5, 28, 6, "#e84a3c")
    big.rect(3, 23, 28, 23, "#e84a3c")
    big.rect(12, 9, 19, 14, OL)                   # fruit bowl
    big.rect(13, 10, 18, 13, "#f8d040")
    big.rect(14, 10, 15, 11, "#e84a3c")
    for lx in (4, 26):
        big.rect(lx, 24, lx + 1, 28, P["wood_line"])
    return big.img.crop((part[0] * 16, part[1] * 16, part[0] * 16 + 16, part[1] * 16 + 16))


def chair():
    t = floor_wood()
    t.rect(3, 2, 12, 14, OL)
    t.rect(4, 3, 11, 6, P["wood_hi"])
    t.rect(4, 7, 11, 11, P["wood"])
    t.rect(4, 12, 11, 13, P["wood_lo"])
    return t


def bed(part):
    t = floor_wood()
    t.rect(1, 0 if part == "bot" else 1, 14, 15 if part == "top" else 14, OL)
    if part == "top":
        t.rect(2, 2, 13, 15, P["wood_lo"])
        t.rect(3, 4, 12, 9, P["white"])
        t.rect(3, 8, 12, 9, P["white_lo"])
        t.rect(2, 11, 13, 15, "#6898e8")
        t.rect(2, 11, 13, 11, "#c2ecff")
    else:
        t.rect(2, 0, 13, 12, "#6898e8")
        t.rect(11, 0, 13, 12, "#3c62b0")
        t.rect(2, 4, 13, 4, "#c2ecff")
        t.rect(2, 13, 13, 13, P["wood_lo"])
    return t


def rug(part):
    big = Tile(48, 32)
    for gy in range(2):
        for gx in range(3):
            big.paste(floor_wood(), gx * 16, gy * 16)
    big.rect(1, 2, 46, 29, "#a82c44")
    big.rect(3, 4, 44, 27, "#e84a3c")
    big.rect(6, 7, 41, 24, "#f8d040")
    big.rect(8, 9, 39, 22, "#e84a3c")
    for i in range(0, 32, 4):
        big.set(10 + i, 15, "#f8d040")
        big.set(11 + i, 16, "#f8d040")
    return big.img.crop((part[0] * 16, part[1] * 16, part[0] * 16 + 16, part[1] * 16 + 16))


# ============================================================== tileset
def tiles():
    """[(name, image)] in id order."""
    out = []

    def add(name, t):
        out.append((name, t.img if isinstance(t, Tile) else t))

    add("void", Tile(fill="#000000"))
    c_up = lambda: wall_upper("c_wall", "c_wall_lo", "c_trim", "c_trim_hi")
    c_lo = lambda: wall_lower("c_wall", "c_panel", "c_panel_lo", "c_trim")
    m_up = lambda: wall_upper("m_wall", "m_wall_lo", "blue", "blue_hi")
    m_lo = lambda: wall_lower("m_wall", "m_b", "m_line", "blue")
    # care centre
    add("c_floor", floor_center())
    add("c_floor_sh", floor_center(shadow=True))
    add("c_wall_up", c_up())
    add("c_wall_lo", c_lo())
    add("c_window", window_tile(c_up))
    add("c_poster", poster(c_up, ("#ffffff", "#f07ca8", "#e04838")))
    add("side_l", side_wall())
    add("side_r", side_wall_r())
    add("bottom", bottom_edge())
    add("c_mat", mat(floor_center))
    for end in ("l", None, "r"):
        add(f"c_counter_{end or 'm'}", counter(floor_center, "red", "red_hi", "white", "red", end=end))
    add("c_counter_pot_l", counter(floor_center, "red", "red_hi", "white", "red", end="l", pot=True))
    add("c_counter_pot_r", counter(floor_center, "red", "red_hi", "white", "red", end="r", pot=True))
    for f in range(3):
        add(f"machine_l_{f}", machine(f, "l"))
        add(f"machine_r_{f}", machine(f, "r"))
    add("pc", pc_terminal(c_lo))
    for cy in range(2):
        for cx in range(2):
            add(f"gtable_{cx}_{cy}", glass_table((cx, cy)))
    add("seat", seat(floor_center))
    add("c_plant", plant(floor_center))
    for gy in range(3):
        for gx in range(3):
            add(f"glow_{gx}_{gy}", glow((gx, gy)))
    # mart
    add("m_floor", floor_mart())
    add("m_floor_sh", floor_mart(shadow=True))
    add("m_wall_up", m_up())
    add("m_wall_lo", m_lo())
    add("m_poster", poster(m_up, ("#ffffff", "#4870c8", "#f8d040")))
    add("m_window", window_tile(m_up))
    add("m_mat", mat(floor_mart))
    add("fridge", fridge(m_lo))
    for part in ("top", "mid", "bot"):
        add(f"m_counter_{part}", counter_v(part))
    for i, end in enumerate(("l", None, "r")):
        add(f"shelf_{end or 'm'}", shelf(end, i))
    add("shelf_m2", shelf(None, 9))
    add("m_plant", plant(floor_mart))
    # home
    add("h_floor", floor_wood())
    add("h_floor_sh", floor_wood(shadow=True))
    add("h_wall_up", wall_home_upper())
    add("h_wall_lo", wall_home_lower())
    add("h_window", window_tile(wall_home_upper))
    add("h_clock", clock(wall_home_upper))
    add("h_mat", mat(floor_wood))
    add("tv", tv())
    add("book_top", bookshelf("top"))
    add("book_bot", bookshelf("bot"))
    add("cab", kitchen("cab"))
    add("sink", kitchen("sink"))
    add("stove", kitchen("stove"))
    for cy in range(2):
        for cx in range(2):
            add(f"htable_{cx}_{cy}", table_home((cx, cy)))
    add("chair", chair())
    add("bed_top", bed("top"))
    add("bed_bot", bed("bot"))
    for cy in range(2):
        for cx in range(3):
            add(f"rug_{cx}_{cy}", rug((cx, cy)))
    add("h_plant", plant(floor_wood))
    return out


def tile_ids():
    return {name: i for i, (name, _) in enumerate(tiles())}


def tileset_image():
    from PIL import Image
    ts = tiles()
    rows = (len(ts) + COLS - 1) // COLS
    img = Image.new("RGBA", (COLS * T, rows * T), (0, 0, 0, 0))
    for i, (_, tile) in enumerate(ts):
        img.alpha_composite(tile, ((i % COLS) * T, (i // COLS) * T))
    return img, len(ts)


# ================================================================= maps
ID = tile_ids()
SOLID = base.SOLID


def script(*ops):
    return json.dumps(list(ops))


def say(text):
    return {"op": "say", "text": text}


class Room(base.MapBuilder):
    """A room: side walls, two-row back wall, bottom edge, exit mat(s)."""

    def __init__(self, w, h, floor, floor_sh, wall_up, wall_lo, mat_tile):
        super().__init__(w, h, ID["void"])
        for y in range(h):
            for x in range(w):
                if x in (0, w - 1):
                    self.put("objects", x, y, ID["side_l" if x == 0 else "side_r"], SOLID)
                elif y == 0:
                    self.put("objects", x, y, ID[wall_up], SOLID)
                elif y == 1:
                    self.put("objects", x, y, ID[wall_lo], SOLID)
                elif y == h - 1:
                    self.put("objects", x, y, ID["bottom"], SOLID)
                else:
                    self.put("ground", x, y, ID[floor_sh if y == 2 else floor])
        self.floor, self.mat_tile = floor, mat_tile

    def tile(self, x, y, name, layer="objects", solid=True):
        self.put(layer, x, y, ID[name], SOLID if solid else None)

    def exit(self, x, out_map, out_x, out_y):
        """Mat on the bottom row; stepping down onto it leaves the building."""
        y = self.h - 1
        self.put("objects", x, y, None)
        self.put("ground", x, y, ID[self.mat_tile])
        self.block(x, y, 0)
        self.obj("warps", f"exit_{x}", x, y, kind="door", targetMap=out_map, targetX=out_x, targetY=out_y,
                 facing="down", transition="iris", enterDir="down")

    def npc(self, name, x, y, sprite, facing, *ops):
        self.obj("npcs", name, x, y, point=True, sprite=sprite, facing=facing, script=script(*ops))
        self.block(x, y)

    def sign(self, name, x, y, text=None, ops=None):
        props = {"script": script(*ops)} if ops else {"text": text}
        self.obj("signs", name, x, y, **props)


def finish(m, anims=()):
    data = m.build()
    img_rows = (len(tiles()) + COLS - 1) // COLS
    tiles_meta = [{"id": ID[f[0]], "animation": [{"tileid": ID[n], "duration": ms} for n in f for ms in [ANIM_MS]]}
                  for f in anims]
    data["tilesets"] = [
        {"firstgid": 1, "name": "interior", "image": "tilesets/interior.png",
         "imagewidth": COLS * T, "imageheight": img_rows * T, "tilewidth": T, "tileheight": T,
         "columns": COLS, "tilecount": len(tiles()), "margin": 0, "spacing": 0, "tiles": tiles_meta},
        {"firstgid": COL_FIRST, "name": "collision", "tilewidth": T, "tileheight": T,
         "columns": 0, "tilecount": 5, "margin": 0, "spacing": 0},
    ]
    for layer in data["layers"]:
        if layer["name"] == "collision":
            layer["data"] = [v - base.COL_FIRST + COL_FIRST if v else 0 for v in layer["data"]]
    return data


ANIM_MS = 260
MACHINE = [("machine_l_0", "machine_l_1", "machine_l_2"), ("machine_r_0", "machine_r_1", "machine_r_2")]

# where each building's door is in Origin Town (door cells, x list, y)
DOORS = {"origin_home": ([4], 6), "origin_center": ([25, 26], 6), "origin_mart": ([26], 22)}


def center():
    W, H = 15, 10
    m = Room(W, H, "c_floor", "c_floor_sh", "c_wall_up", "c_wall_lo", "c_mat")
    m.tile(3, 0, "c_window")
    m.tile(11, 0, "c_window")
    m.tile(7, 0, "c_poster")
    m.tile(5, 1, "machine_l_0")
    m.tile(6, 1, "machine_r_0")
    m.tile(12, 1, "pc")
    m.sign("pc", 12, 1, text="It's the storage PC. (Box storage opens in a later update.)")
    # counter row 3 from x 3..11; staff area behind it (row 2) is off-limits
    for x in range(3, 12):
        name = "c_counter_pot_l" if x == 3 else "c_counter_pot_r" if x == 11 else "c_counter_m"
        m.tile(x, 3, name)
        if x != 7:
            m.block(x, 2)
    nurse = [say("Welcome to the Pokemon Origins Care Centre! Shall I look after your team?"),
             {"op": "heal"},
             say("All done! Your Pokemon are fighting fit. We hope to see you again!")]
    m.npc("nurse", 7, 2, "nurse", "down", *nurse)
    m.sign("counter_nurse", 7, 3, ops=nurse)
    # heal-pad light in front of the counter
    for gy in range(3):
        for gx in range(3):
            m.tile(6 + gx, 4 + gy, f"glow_{gx}_{gy}", layer="ground", solid=False)
    # lounge corners: glass tables + seats, plants
    for tx, sx in ((1, 3), (11, 10)):
        for cy in range(2):
            for cx in range(2):
                m.tile(tx + cx, 6 + cy, f"gtable_{cx}_{cy}")
        m.tile(sx, 6, "seat")
    m.tile(1, 2, "c_plant")
    m.tile(13, 2, "c_plant")
    m.npc("visitor", 12, 5, "old_woman", "left",
          say("I come here every morning. The nurse always remembers my Pokemon's names."))
    m.npc("trainer", 2, 4, "cooltrainer_f", "right",
          say("Healing here is free for every Pokemon Origins trainer. Use it before you take on the Gym!"))
    for i, x in enumerate((7, 8)):
        m.exit(x, "origin_town", DOORS["origin_center"][0][i], DOORS["origin_center"][1] + 1)
    return finish(m, MACHINE)


def mart():
    W, H = 11, 9
    m = Room(W, H, "m_floor", "m_floor_sh", "m_wall_up", "m_wall_lo", "m_mat")
    m.tile(3, 0, "m_poster")
    m.tile(7, 0, "m_window")
    m.tile(8, 1, "fridge")
    m.tile(9, 1, "fridge")
    m.sign("fridge", 8, 1, text="Cold drinks are stocked here. (They go on sale with the shop update.)")
    for y, part in ((3, "top"), (4, "mid"), (5, "bot")):
        m.tile(3, y, f"m_counter_{part}")
    for y in range(2, 7):
        if y != 4:
            m.block(1, y)
            m.block(2, y)
    shop = [say("Welcome to the Mart! Potions, Poke Balls and everything a new trainer needs."),
            {"op": "shop", "shop": "origin_mart"}]
    m.npc("clerk", 2, 4, "clerk", "right", *shop)
    m.sign("counter_clerk", 3, 4, ops=shop)
    for y in (3, 5):
        for x, name in ((5, "shelf_l"), (6, "shelf_m" if y == 3 else "shelf_m2"), (7, "shelf_m2" if y == 3 else "shelf_m"), (8, "shelf_r")):
            m.tile(x, y, name)
    m.tile(9, 7, "m_plant")
    m.tile(1, 7, "m_plant")
    m.npc("shopper", 7, 6, "camper", "up", say("Should I buy five Potions or six? Better make it six."))
    m.exit(5, "origin_town", DOORS["origin_mart"][0][0], DOORS["origin_mart"][1] + 1)
    return finish(m)


def home():
    W, H = 11, 9
    m = Room(W, H, "h_floor", "h_floor_sh", "h_wall_up", "h_wall_lo", "h_mat")
    m.tile(2, 0, "h_window")
    m.tile(6, 0, "h_clock")
    m.tile(2, 1, "tv")
    m.sign("tv", 2, 1, text="A quiz show is on. 'Which Pokemon Origins town has a pond?' ...Easy!")
    m.tile(4, 0, "book_top")
    m.tile(4, 1, "book_bot")
    m.sign("books", 4, 1, text="Pokemon field guides and a well-thumbed travel journal.")
    for x, (top, bot) in zip((7, 8, 9), (("cab", "sink"), ("cab", "stove"), ("cab", "sink"))):
        m.tile(x, 0, top)
        m.tile(x, 1, bot)
    for cy in range(2):
        for cx in range(2):
            m.tile(5 + cx, 4 + cy, f"htable_{cx}_{cy}")
    m.tile(4, 4, "chair")
    m.tile(7, 4, "chair")
    m.tile(9, 3, "bed_top")
    m.tile(9, 4, "bed_bot")
    for cy in range(2):
        for cx in range(3):
            m.tile(1 + cx, 5 + cy, f"rug_{cx}_{cy}", layer="ground", solid=False)
    m.tile(1, 2, "h_plant")
    m.exit(5, "origin_town", DOORS["origin_home"][0][0], DOORS["origin_home"][1] + 1)
    return finish(m)


MAPS = {"origin_center": center, "origin_mart": mart, "origin_home": home}
# where you appear inside: one row above the exit mat, facing up
ARRIVE = {"origin_home": [(5, 7)], "origin_center": [(7, 8), (8, 8)], "origin_mart": [(5, 7)]}
