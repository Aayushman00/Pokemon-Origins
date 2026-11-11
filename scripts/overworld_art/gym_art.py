"""Puzzle-room art: each gym's floor and walls, and the pieces its mechanic moves.

Tiles are named gym_<theme>_<kind>. Pieces that change during play (gates,
screens, panels, tide, stones, the twin) are drawn over the map at runtime from
the map's puzzle_<kind> properties; everything else is painted into the map.
"""
from .tiles import Tile, rng

GLYPHS = {"A": ("010", "101", "111", "101", "101"), "B": ("110", "101", "110", "101", "110"),
          "C": ("011", "100", "100", "100", "011"), "D": ("110", "101", "101", "101", "110"),
          "E": ("111", "100", "110", "100", "111")}


def glyph(t, ch, x, y, col):
    for j, row in enumerate(GLYPHS[ch]):
        for i, on in enumerate(row):
            if on == "1":
                t.set(x + i, y + j, col)


def speck(t, seed, n, cols):
    r = rng(seed)
    for _ in range(n):
        t.set(r(16), r(16), cols[r(len(cols))])


def over(base, draw):
    """A copy of tile `base` with `draw` applied."""
    t = Tile()
    t.paste(base)
    draw(t)
    return t


def ring(t, x0, y0, x1, y1, col):
    t.rect(x0, y0, x1, y0, col)
    t.rect(x0, y1, x1, y1, col)
    t.rect(x0, y0, x0, y1, col)
    t.rect(x1, y0, x1, y1, col)


def disc(t, cx, cy, r, col):
    for y in range(-r, r + 1):
        for x in range(-r, r + 1):
            if x * x + y * y <= r * r + r // 2:
                t.set(cx + x, cy + y, col)


def cap(top, edge, seed):
    """Wall seen from above, and the same with a lit rim on either side."""
    def make(left, right):
        t = Tile(fill=top)
        speck(t, seed, 7, [edge])
        if left:
            t.rect(0, 0, 0, 15, edge)
        if right:
            t.rect(15, 0, 15, 15, edge)
        return t
    return {"cap": make(0, 0), "cap_l": make(1, 0), "cap_r": make(0, 1), "cap_lr": make(1, 1)}


# ------------------------------------------------------------------ bakery
def bakery():
    tile = ["#f8eacc", "#f0dcb4", "#e2c898"]

    def floor(flip):
        t = Tile(fill=tile[0])
        for (x, y) in ((0, 0), (8, 8)) if not flip else ((8, 0), (0, 8)):
            t.rect(x, y, x + 7, y + 7, tile[1])
        t.rect(0, 15, 15, 15, tile[2])
        t.rect(15, 0, 15, 15, tile[2])
        return t

    def face():
        t = Tile(fill="#c9754e")
        for y in range(0, 14, 4):
            t.rect(0, y + 3, 15, y + 3, "#a65a42")
            for x in range((y // 4 % 2) * 4, 16, 8):
                t.rect(x, y, x, y + 2, "#a65a42")
        t.rect(0, 0, 15, 0, "#e09a6c")
        t.rect(0, 14, 15, 15, "#7c4038")
        return t

    def belt(frame):
        t = Tile(fill="#5c5a6c")
        t.rect(0, 0, 15, 1, "#a8a6b4")
        t.rect(0, 14, 15, 15, "#a8a6b4")
        t.rect(0, 2, 15, 2, "#3e3c4c")
        t.rect(0, 13, 15, 13, "#3e3c4c")
        for start in (frame * 4, frame * 4 + 8):
            for i in range(4):
                t.rect((start + i) % 16, 4 + i, (start + i + 1) % 16, 4 + i, "#f4c858")
                t.rect((start + i) % 16, 11 - i, (start + i + 1) % 16, 11 - i, "#f4c858")
        return t

    def cake(t):
        t.rect(5, 13, 10, 14, "#b08858")
        t.rect(7, 11, 8, 12, "#b08858")
        t.rect(3, 6, 12, 10, "#fbf2dc")
        t.rect(3, 8, 12, 8, "#f07ca8")
        t.rect(2, 10, 13, 11, "#e8d4a8")
        t.rect(5, 3, 10, 5, "#fbf2dc")
        t.rect(5, 4, 10, 4, "#f07ca8")
        t.set(7, 1, "#e84a3c")
        t.set(8, 2, "#e84a3c")
        t.set(7, 2, "#e84a3c")

    def oven(t):
        t.rect(2, 2, 13, 15, "#8c5a44")
        t.rect(1, 1, 14, 2, "#b47a58")
        t.rect(4, 6, 11, 13, "#3c2a30")
        t.rect(5, 10, 10, 13, "#f09038")
        t.rect(6, 11, 9, 13, "#f8d048")

    out = {"floor0": floor(0), "floor1": floor(1), "face": face(), **cap("#6c4638", "#8a5e48", 11)}
    out["rug"] = Tile(fill="#c8505a")
    out["goal"] = over(Tile(), cake)
    out["deco"] = over(Tile(), oven)
    frames = [belt(f).img for f in (0, 1)]
    for ch, turn in ((">", 0), ("^", 90), ("<", 180), ("v", 270)):
        for f, img in enumerate(frames):
            out[f"belt{BELT[ch]}{f}"] = img.rotate(turn)
    return out


BELT = {">": "_e", "<": "_w", "^": "_n", "v": "_s"}


# -------------------------------------------------------------------- dojo
def dojo():
    def floor(flip):
        t = Tile(fill="#dcd08c")
        for y in range(1, 16, 2):
            t.rect(0, y, 15, y, "#d0c47e")
        if flip:
            t.rect(0, 0, 15, 0, "#6c8a58")
        else:
            t.rect(0, 0, 0, 15, "#6c8a58")
        return t

    def face():
        t = Tile(fill="#f4eede")
        t.rect(0, 0, 15, 1, "#6c4a38")
        t.rect(0, 13, 15, 15, "#6c4a38")
        t.rect(0, 0, 1, 15, "#6c4a38")
        t.rect(8, 0, 8, 15, "#a87c58")
        t.rect(0, 7, 15, 7, "#a87c58")
        return t

    def screen(ch, closed):
        def draw(t):
            if closed:
                t.rect(1, 0, 14, 15, "#fbf6e8")
                ring(t, 1, 0, 14, 15, "#5a3a38")
                t.rect(2, 7, 13, 7, "#c8a878")
                t.rect(7, 1, 7, 6, "#c8a878")
                t.rect(5, 4, 10, 11, "#c84048")
                glyph(t, ch, 6, 5, "#ffffff")
            else:
                t.rect(0, 0, 1, 15, "#5a3a38")
                t.rect(14, 0, 15, 15, "#5a3a38")
                glyph(t, ch, 6, 5, "#b8a868")
        return draw

    def plate(ch):
        def draw(t):
            t.rect(2, 2, 13, 13, "#8c8aa0")
            ring(t, 2, 2, 13, 13, "#5a5870")
            t.rect(3, 3, 12, 3, "#b4b2c4")
            glyph(t, ch.upper(), 6, 5, "#fbf6e8")
        return draw

    def gong(t):
        t.rect(2, 2, 13, 3, "#5a3a38")
        t.rect(2, 2, 3, 15, "#5a3a38")
        t.rect(12, 2, 13, 15, "#5a3a38")
        disc(t, 8, 9, 4, "#e0a838")
        disc(t, 8, 9, 2, "#f4d470")

    def bonsai(t):
        t.rect(4, 12, 11, 15, "#7c6a80")
        t.rect(7, 8, 8, 12, "#6c4a38")
        disc(t, 8, 6, 4, "#4e9450")
        disc(t, 6, 5, 2, "#7cb85c")

    base = floor(0)
    out = {"floor0": base, "floor1": floor(1), "face": face(), **cap("#4a3438", "#6c4a48", 12)}
    out["rug"] = Tile(fill="#3e5a8c")
    out["goal"] = over(Tile(), gong)
    out["deco"] = over(Tile(), bonsai)
    for ch in "ABCD":
        out[f"door_{ch}"] = over(Tile(), screen(ch, True))
        out[f"open_{ch}"] = over(Tile(), screen(ch, False))
    for ch in "abcde":
        out[f"plate_{ch}"] = over(base, plate(ch))
    return out


# ------------------------------------------------------------------ harbor
def harbor():
    deep = ["#4e92c8", "#74bce2", "#a4dcea"]

    def floor(flip):
        t = Tile(fill="#c8a478")
        for y in (3, 7, 11, 15):
            t.rect(0, y, 15, y, "#9a7858")
        for y, x in ((0, 5 if flip else 11), (4, 13 if flip else 3), (8, 2 if flip else 9), (12, 9 if flip else 14)):
            t.rect(x, y, x, y + 2, "#9a7858")
        return t

    def water(frame):
        t = Tile(fill=deep[0])
        for x, y in ((2, 3), (9, 6), (4, 11), (12, 13)):
            x = (x + frame * 3) % 16
            t.rect(x, y, min(x + 3, 15), y, deep[1])
        t.set((6 + frame * 5) % 16, 9, deep[2])
        return t

    def face():
        t = Tile(fill="#4a6c8c")
        for y in (3, 7, 11):
            t.rect(0, y, 15, y, "#3a5474")
        t.rect(0, 0, 15, 0, "#7c9cb4")
        t.rect(0, 14, 15, 15, "#2e4460")
        t.set(4, 5, "#c4d4dc")
        t.set(12, 9, "#c4d4dc")
        return t

    def sand(t):
        t.rect(0, 0, 15, 15, "#ecd9a8")
        speck(t, 41, 16, ["#d4bc88", "#f6e8c4"])
        t.rect(0, 15, 15, 15, "#cbb07c")

    def under(t):
        for y in range(1, 16, 3):
            for x in range(y % 2, 16, 3):
                t.set(x, y, "#a8bc98")

    def boat(afloat):
        def draw(t):
            top = 3 if afloat else 6
            t.rect(3, top, 12, top + 7, "#b85a46")
            t.rect(4, top + 1, 11, top + 5, "#ecd9a8")
            t.rect(2, top + 1, 2, top + 5, "#8c4044")
            t.rect(13, top + 1, 13, top + 5, "#8c4044")
            t.rect(3, top + 7, 12, top + 7, "#8c4044")
            if afloat:
                t.rect(4, top + 3, 11, top + 3, "#d2bc90")
        return draw

    def valve(t):
        t.rect(7, 9, 8, 14, "#7c7a8c")
        disc(t, 8, 7, 5, "#d84848")
        disc(t, 8, 7, 3, "#c8a478")
        t.rect(7, 2, 8, 12, "#a02c34")
        t.rect(3, 6, 12, 7, "#a02c34")
        t.rect(7, 6, 8, 7, "#f4c858")

    def wheel(t):
        disc(t, 8, 8, 6, "#7e5038")
        disc(t, 8, 8, 4, "#c8a478")
        for dx, dy in ((0, 7), (0, -7), (7, 0), (-7, 0), (5, 5), (-5, 5), (5, -5), (-5, -5)):
            t.set(8 + dx, 8 + dy, "#5a3a38")
        t.rect(7, 2, 8, 13, "#7e5038")
        t.rect(2, 7, 13, 8, "#7e5038")
        disc(t, 8, 8, 1, "#f4c858")

    def anchor(t):
        t.rect(7, 2, 8, 13, "#5e7694")
        t.rect(5, 4, 10, 4, "#5e7694")
        disc(t, 8, 2, 1, "#a8bcd0")
        t.rect(3, 12, 12, 13, "#5e7694")
        t.rect(2, 10, 3, 12, "#5e7694")
        t.rect(12, 10, 13, 12, "#5e7694")

    w0, w1 = water(0), water(1)
    out = {"floor0": floor(0), "floor1": floor(1), "face": face(), **cap("#2e4460", "#46688c", 13)}
    out["rug"] = Tile(fill="#3a7ca0")
    out["water0"], out["water1"] = w0, w1
    out["sand"] = over(w0, sand)
    out["under"] = over(w0, under)
    out["boat"] = over(w0, boat(True))
    out["boat_low"] = over(w0, boat(False))
    out["valve"] = over(floor(0), valve)
    out["goal"] = over(Tile(), wheel)
    out["deco"] = over(Tile(), anchor)
    return out


# --------------------------------------------------------------- generator
def generator():
    def floor(flip):
        t = Tile(fill="#a4acbc")
        ring(t, 0, 0, 15, 15, "#868ea0")
        t.rect(1, 1, 14, 1, "#c0c8d4")
        for x, y in ((2, 3), (13, 3), (2, 13), (13, 13)):
            t.set(x, y, "#6c7488")
        if flip:
            t.rect(6, 7, 9, 8, "#949cae")
        return t

    def face():
        t = Tile(fill="#4c5468")
        t.rect(0, 0, 15, 1, "#7c869c")
        t.rect(3, 3, 12, 9, "#343a4c")
        t.rect(4, 4, 6, 4, "#f4c848")
        t.rect(4, 6, 8, 6, "#68dce0")
        for x in range(0, 16, 4):
            t.rect(x, 12, x + 1, 13, "#f4c848")
            t.rect(x + 2, 12, x + 3, 13, "#343a4c")
        t.rect(0, 14, 15, 15, "#2c3040")
        return t

    def panel(on):
        t = Tile(fill="#2e3a58" if not on else "#3cc8e8")
        ring(t, 0, 0, 15, 15, "#1e2640")
        ring(t, 2, 2, 13, 13, "#46587c" if not on else "#d0f8ff")
        if on:
            t.rect(4, 4, 11, 11, "#a0f0fc")
            t.rect(6, 6, 9, 9, "#ffffff")
        else:
            t.rect(5, 7, 10, 8, "#46587c")
        return t

    def gate(t):
        t.rect(0, 0, 2, 15, "#5e6880")
        t.rect(13, 0, 15, 15, "#5e6880")
        for y, x in ((1, 5), (4, 8), (7, 6), (10, 9), (13, 7)):
            t.rect(3, y, x, y, "#68dce0")
            t.rect(x, y, x, y + 3, "#d0f8ff")
            t.rect(x, y + 3, 12, y + 3, "#68dce0")

    def core(t):
        t.rect(4, 12, 11, 15, "#5e6880")
        t.rect(5, 3, 10, 12, "#3cc8e8")
        t.rect(7, 2, 8, 12, "#ffffff")
        ring(t, 4, 2, 11, 12, "#343a4c")

    def coil(t):
        t.rect(5, 2, 10, 15, "#7c869c")
        for y in range(3, 14, 3):
            t.rect(4, y, 11, y, "#c8804c")
        disc(t, 8, 2, 2, "#68dce0")

    out = {"floor0": floor(0), "floor1": floor(1), "face": face(), **cap("#2c3040", "#4c5468", 14)}
    out["rug"] = Tile(fill="#e0b838")
    out["panel_off"], out["panel_on"] = panel(False), panel(True)
    out["gate"] = over(Tile(), gate)
    out["goal"] = over(Tile(), core)
    out["deco"] = over(Tile(), coil)
    return out


# -------------------------------------------------------------------- spire
def spire():
    def floor(flip):
        t = Tile(fill="#e8ecf4")
        t.rect(0, 15, 15, 15, "#c8d0e0")
        t.rect(15, 0, 15, 15, "#c8d0e0")
        speck(t, 51 + flip, 6, ["#d8dee8"])
        return t

    def face():
        t = Tile(fill="#b4c0d8")
        for x in (2, 7, 12):
            t.rect(x, 0, x + 2, 15, "#d4dcec")
            t.rect(x + 2, 0, x + 2, 15, "#90a0c0")
        t.rect(0, 0, 15, 1, "#f4f6fa")
        t.rect(0, 14, 15, 15, "#7c8cb0")
        return t

    def sky():
        t = Tile(fill="#6cb0ec")
        t.rect(0, 0, 15, 1, "#3a64a4")
        t.rect(0, 2, 15, 2, "#4c84c8")
        t.rect(2, 9, 7, 10, "#ffffff")
        t.rect(10, 12, 13, 13, "#d4ecfc")
        return t

    def cloud(t):
        disc(t, 5, 9, 4, "#ffffff")
        disc(t, 10, 9, 4, "#ffffff")
        disc(t, 8, 6, 4, "#ffffff")
        t.rect(2, 13, 13, 13, "#b8c8e4")

    def feather(t):
        t.rect(6, 12, 9, 15, "#b4c0d8")
        for i in range(9):
            t.rect(6 + i // 3, 11 - i, 9 + i // 3, 11 - i, "#f4c858" if i % 3 else "#e08838")
        t.set(11, 12, "#7c8cb0")

    def banner(t):
        t.rect(7, 0, 8, 15, "#7c8cb0")
        t.rect(2, 2, 7, 9, "#4c84c8")
        t.rect(3, 10, 5, 10, "#4c84c8")
        t.rect(3, 4, 5, 6, "#f4f6fa")

    out = {"floor0": floor(0), "floor1": floor(1), "face": face(), **cap("#7c8cb0", "#a4b4d0", 15)}
    out["rug"] = Tile(fill="#4c84c8")
    out["drop"] = sky()
    out["cloud"] = over(floor(0), cloud)
    out["goal"] = over(Tile(), feather)
    out["deco"] = over(Tile(), banner)
    return out


# ---------------------------------------------------------------------- dome
def dome():
    def floor(flip):
        t = Tile(fill="#27284e")
        speck(t, 61 + flip, 5, ["#40427a"])
        speck(t, 71 + flip, 2, ["#c8ccf4"])
        t.rect(0, 15, 15, 15, "#1e1e40")
        return t

    def face():
        t = Tile(fill="#3a3478")
        t.rect(0, 0, 15, 1, "#6c64b4")
        t.rect(0, 14, 15, 15, "#201c50")
        for a, b in (((3, 4), (7, 8)), ((7, 8), (12, 5))):
            for i in range(5):
                t.set(a[0] + (b[0] - a[0]) * i // 4, a[1] + (b[1] - a[1]) * i // 4, "#6c64b4")
        for x, y in ((3, 4), (7, 8), (12, 5)):
            t.set(x, y, "#f4e8a0")
        return t

    def pad(col, lo):
        def draw(t):
            for y, (x0, x1) in enumerate(((7, 8), (7, 8), (6, 9), (1, 14), (3, 12), (4, 11), (4, 11), (3, 12), (3, 12), (2, 5), (10, 13)), 2):
                t.rect(x0, y, x1, y, col)
            t.rect(6, 7, 9, 8, lo)
        return draw

    def twin(t):
        col, lo, hi = "#a890f0", "#7c64cc", "#d8ccff"
        t.rect(5, 1, 10, 6, col)
        t.rect(6, 0, 9, 0, hi)
        t.rect(6, 3, 6, 4, "#27284e")
        t.rect(9, 3, 9, 4, "#27284e")
        t.rect(5, 7, 10, 12, lo)
        t.rect(6, 7, 9, 11, col)
        t.rect(6, 13, 7, 15, lo)
        t.rect(8, 13, 9, 15, lo)

    def scope(t):
        t.rect(7, 8, 8, 15, "#7c7ab0")
        t.rect(4, 15, 11, 15, "#7c7ab0")
        for i in range(8):
            t.rect(3 + i, 8 - i // 2, 5 + i, 9 - i // 2, "#c8b070")
        t.set(12, 3, "#f4e8a0")

    out = {"floor0": floor(0), "floor1": floor(1), "face": face(), **cap("#191838", "#30306c", 16)}
    out["rug"] = Tile(fill="#5c4ca0")
    out["star"] = over(floor(0), pad("#f4d870", "#fff4c0"))
    out["star_twin"] = over(floor(0), pad("#a890f0", "#e0d8ff"))
    out["twin"] = over(Tile(), twin)
    out["deco"] = over(Tile(), scope)
    return out


# --------------------------------------------------------------------- forge
def forge():
    def floor(flip):
        t = Tile(fill="#5a5258")
        for (x0, y0, x1, y1) in (((0, 0, 7, 7), (8, 8, 15, 15)) if flip else ((8, 0, 15, 7), (0, 8, 7, 15))):
            t.rect(x0, y0, x1, y1, "#645c60")
        t.rect(0, 15, 15, 15, "#403a42")
        t.rect(15, 0, 15, 15, "#403a42")
        return t

    def face():
        t = Tile(fill="#3a3238")
        t.rect(0, 0, 15, 1, "#6c5c58")
        for x in (2, 8, 13):
            t.set(x, 4, "#8c7c70")
            t.set(x, 10, "#8c7c70")
        t.rect(5, 6, 10, 8, "#f07828")
        t.rect(6, 7, 9, 7, "#f8d048")
        t.rect(0, 14, 15, 15, "#241e28")
        return t

    def lava(frame):
        t = Tile(fill="#e84c24")
        for x, y, n in ((1, 2, 5), (9, 5, 4), (3, 9, 6), (10, 12, 4)):
            x = (x + frame * 4) % 16
            t.rect(x, y, min(x + n, 15), y + 1, "#f8a038")
            t.rect(x + 1, y, min(x + n - 1, 15), y, "#fce070")
        for x, y in ((6, 13), (13, 1)):
            t.set(x, (y + frame * 2) % 16, "#a82c20")
        return t

    def stone(up):
        def draw(t):
            if up:
                t.rect(2, 3, 13, 12, "#a8a0a0")
                t.rect(3, 2, 12, 2, "#d0c8c4")
                t.rect(2, 12, 13, 14, "#6c6068")
                ring(t, 2, 3, 13, 12, "#544c54")
            else:
                t.rect(3, 6, 12, 12, "#7c3430")
                t.rect(4, 7, 11, 11, "#a84c30")
        return draw

    def heat(t):
        t.rect(1, 1, 14, 14, "#7c2c28")
        ring(t, 1, 1, 14, 14, "#403a42")
        for y in (4, 7, 10):
            t.rect(3, y, 12, y, "#f89038")

    def anvil(t):
        t.rect(2, 4, 13, 7, "#8c8a9c")
        t.rect(1, 4, 3, 5, "#8c8a9c")
        t.rect(3, 3, 13, 3, "#c4c2d0")
        t.rect(6, 8, 9, 11, "#64627e")
        t.rect(4, 12, 11, 14, "#4c4a60")

    def brazier(t):
        t.rect(7, 9, 8, 15, "#6c5c58")
        t.rect(4, 7, 11, 9, "#8c7c70")
        disc(t, 8, 5, 3, "#f07828")
        disc(t, 8, 5, 1, "#f8d048")

    l0, l1 = lava(0), lava(1)
    out = {"floor0": floor(0), "floor1": floor(1), "face": face(), **cap("#241e28", "#403a42", 17)}
    out["rug"] = Tile(fill="#a82c20")
    out["lava0"], out["lava1"] = l0, l1
    out["stone_up"] = over(l0, stone(True))
    out["stone_down"] = over(l0, stone(False))
    out["heat"] = over(floor(0), heat)
    out["goal"] = over(Tile(), anvil)
    out["deco"] = over(Tile(), brazier)
    return out


# ------------------------------------------------------------------ grove (Mossgate)
def grove():
    """Inside the hollow trunk: pale flagstones so the green Leader and the pods
    read against the floor, living-wood walls, tilled soil for the seeds."""
    def floor(flip):
        t = Tile(fill="#ddd2ac")
        t.rect(0, 15, 15, 15, "#b8ab84")
        t.rect(15, 0, 15, 15, "#b8ab84")
        x = 4 if flip else 11
        t.rect(x, 0, x, 7, "#b8ab84")
        t.rect(0, 7, 15, 7, "#b8ab84")
        t.rect(15 - x, 8, 15 - x, 15, "#b8ab84")
        speck(t, 31 + flip, 4, ["#9cbc6c"])  # moss in the joints
        return t

    def face():
        t = Tile(fill="#6c4a38")
        for x in (1, 6, 11):
            t.rect(x, 0, x + 1, 15, "#8a6446")
        t.rect(0, 0, 15, 2, "#4e8a50")
        for x in (2, 7, 13):  # moss hanging over the lip
            t.rect(x, 3, x, 4, "#4e8a50")
        t.rect(0, 14, 15, 15, "#40303a")
        return t

    def soil(t):
        t.rect(2, 3, 13, 12, "#7e5c42")
        ring(t, 2, 3, 13, 12, "#604634")
        for y in (6, 9):
            t.rect(4, y, 11, y, "#604634")

    def pod(t):
        disc(t, 8, 9, 5, "#40303a")
        disc(t, 8, 9, 4, "#a8703c")
        disc(t, 7, 8, 2, "#d8a060")
        t.rect(6, 3, 10, 4, "#4e8a50")
        t.rect(8, 1, 8, 3, "#40303a")

    def sprout(t):
        t.rect(7, 6, 8, 12, "#3f8458")
        disc(t, 5, 6, 2, "#6ea858")
        disc(t, 11, 5, 2, "#6ea858")
        t.rect(5, 12, 10, 13, "#a8703c")

    def vines(t):  # a woven wall of stems: it has to read as "shut" at a glance
        t.rect(0, 1, 15, 14, "#2c6450")
        for x in (1, 6, 11):
            t.rect(x, 0, x + 2, 15, "#3f8458")
            t.rect(x, 0, x, 15, "#5ea060")
        for y in (4, 10):
            t.rect(0, y, 15, y + 1, "#3f8458")
        for x, y in ((4, 2), (9, 7), (4, 12), (14, 4), (13, 12), (8, 1)):
            disc(t, x, y, 1, "#7cb85c")
        t.rect(0, 15, 15, 15, "#40303a")

    def leaf_ring(t):
        ring(t, 3, 3, 12, 12, "#c8843c")
        disc(t, 8, 8, 2, "#4e8a50")

    base = floor(0)
    out = {"floor0": base, "floor1": floor(1), "face": face(), **cap("#2f5a3a", "#4a7a48", 23)}
    out["rug"] = Tile(fill="#c8843c")  # honey runner: the Leader's green stands out on it
    out["soil"] = over(base, soil)
    out["pod"] = over(Tile(), pod)
    out["sprout"] = over(Tile(), sprout)
    out["gate"] = over(base, vines)
    out["goal"] = over(Tile(), leaf_ring)
    return out


THEMES = {"bakery": bakery, "dojo": dojo, "harbor": harbor, "generator": generator, "spire": spire, "dome": dome, "forge": forge,
          "grove": grove}
ANIMATED = [("bakery", f"belt{d}", 180) for d in BELT.values()] + [("harbor", "water", 500), ("forge", "lava", 420)]


def rug_edges(rug):
    """A carpet runner: gold-trimmed left and right edges for the rug's sides."""
    def edge(side):
        t = Tile(fill=rug)
        x = 0 if side == "l" else 14
        t.rect(x, 0, x + 1, 15, "#f4d870")
        return t
    return {"rug_l": edge("l"), "rug_r": edge("r")}


def door_tiles():
    """The way out, set into any wall: a dark arch with a lit step."""
    t = Tile(fill="#26223a")
    t.rect(0, 0, 1, 15, "#544c54")
    t.rect(14, 0, 15, 15, "#544c54")
    t.rect(2, 13, 13, 15, "#d85a48")
    t.rect(2, 13, 13, 13, "#f09078")
    return {"exit": t}


def plaque(t):
    t.rect(4, 3, 11, 10, "#f4ecdc")
    ring(t, 3, 2, 12, 11, "#7e5038")
    for y in (5, 7):
        t.rect(5, y, 10, y, "#aea298")


def gym_tiles():
    """[(name, Tile)] for every theme, in a fixed order."""
    out = []
    for theme, make in THEMES.items():
        parts = make()
        parts.update(rug_edges("#%02x%02x%02x" % parts["rug"].img.getpixel((0, 0))[:3]))
        parts.update(door_tiles())
        parts["plaque"] = over(parts["face"], plaque)
        out += [(f"gym_{theme}_{k}", v) for k, v in parts.items()]
    return out
