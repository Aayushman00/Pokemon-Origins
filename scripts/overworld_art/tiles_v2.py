"""v2 environment art (stage 2 slice): oak trees, tall grass, flower
clusters and the house. Drawn procedurally where a formula reads better
than a grid, always ending in hard pixels from a small fixed palette.

Light comes from the top-left. Shadows lean cool (blue-green), highlights
warm (yellow-green). No pure black; outlines are the darkest local tone.
"""
from math import hypot

from PIL import Image

from .tiles import C, ROOFS, T, Tile, grass, hexrgb, mown_block, rng, text

LEAF = {  # canopy ramp: hi, light, base, mid, low, outline
    "oak": ["#c8f080", "#8cd058", "#5cb048", "#3e8c48", "#2c6844", "#1e4434"],
    "lime": ["#e0f490", "#a8d860", "#78bc48", "#50984a", "#386e46", "#244836"],
    # border forest: deeper so the playable town reads brighter than its edge
    "forest": ["#a8dc70", "#6cb450", "#46944a", "#327646", "#225a3e", "#163a30"],
    "forest2": ["#bce07a", "#80c058", "#58a04c", "#3c8048", "#2a603e", "#183e30"],
}
UNDERGROWTH = "#3e8846"
BARK = {"hi": "#c08454", "base": "#8c5634", "lo": "#5c3438", "line": "#3a2426"}
GROUND_SHADOW = "#4c9a48"   # opaque: trees stand on grass
TALL = {"hi": "#c4ec80", "light": "#90d460", "base": "#68b850", "mid": "#4c9c48", "low": "#3a8048", "floor": "#5aa848"}
FLOWER = {
    "red": ["#ffa490", "#f05040", "#b02c3c"],
    "yellow": ["#fff6a0", "#f8d040", "#c08c28"],
    "white": ["#fffcf0", "#e8ecf4", "#b4bccc"],
}
FLOWER_EYE = {"red": "#f8d040", "yellow": "#e07028", "white": "#f8d040"}
STEM = ["#58a840", "#3a7c44"]


# =================================================================== trees
OAK_CLUSTERS = {
    # (cx, cy, r) leaf clumps, drawn back to front (lower = nearer)
    "A": [(11, 6, 6), (21, 6, 6), (16, 10, 9), (7, 13, 6.5), (25, 13, 6.5), (16, 16, 8), (8, 18, 5), (24, 18, 5)],
    "B": [(16, 3, 5.5), (10, 8, 6), (22, 8, 6), (16, 11, 8), (6, 15, 5.5), (26, 15, 5.5), (12, 18, 6), (21, 18, 6)],
}


def oak(variant="A", leaf="oak"):
    """32x32 oak: clustered canopy (top half goes in the `above` layer),
    trunk with root flare, opaque ground-shadow ellipse."""
    pal = LEAF[leaf]
    hi, light, base, mid, low, line = pal
    t = Tile(32, 32)
    # ground shadow, offset right of the trunk (light from top-left)
    for y in range(24, 32):
        for x in range(32):
            if ((x - 17.5) / 12.5) ** 2 + ((y - 28) / 3.2) ** 2 < 1:
                t.set(x, y, GROUND_SHADOW)
    # trunk + roots
    for y in range(19, 30):
        flare = 1 if y >= 27 else 0
        for x in range(13 - flare, 19 + flare):
            col = BARK["hi"] if x <= 13 else BARK["lo"] if x >= 17 else BARK["base"]
            if (x == 15 and y % 4 == 1) or (x == 16 and y % 4 == 3):
                col = BARK["lo"]
            t.set(x, y, col)
        t.set(12 - flare, y, BARK["line"])
        t.set(19 + flare, y, BARK["line"])
    t.rect(11, 30, 20, 30, BARK["line"])
    t.set(12, 29, BARK["line"])
    t.set(19, 29, BARK["line"])
    # canopy: assign every pixel to the frontmost clump that covers it
    clusters = OAK_CLUSTERS[variant]
    owner = {}
    for i, (cx, cy, r) in enumerate(clusters):
        for y in range(32):
            for x in range(32):
                if hypot((x + 0.5 - cx) / r, (y + 0.5 - cy) / (r * 0.92)) < 1:
                    owner[(x, y)] = i
    for (x, y), i in owner.items():
        cx, cy, r = clusters[i]
        nx, ny = (x + 0.5 - cx) / r, (y + 0.5 - cy) / r
        lit = -(nx * 0.55 + ny * 0.83)
        below = owner.get((x, y + 1))
        if below is not None and below != i and below > i:
            col = low          # underside of a clump that sits behind a nearer one
        elif lit > 0.55:
            col = hi
        elif lit > 0.2:
            col = light
        elif lit > -0.25:
            col = base
        elif lit > -0.6:
            col = mid
        else:
            col = low
        t.set(x, y, col)
    # leaf texture: a sparse 2-pixel dither so clumps are not flat discs
    r = rng(7 if variant == "A" else 11)
    for (x, y), i in owner.items():
        if r(9) == 0 and (x - 1, y) in owner and t.px[x, y][:3] == hexrgb(base)[:3]:
            t.set(x, y, mid)
            t.set(x - 1, y, light if r(2) else mid)
    # outline (4-neighbour) around the whole canopy, in the deepest green
    for y in range(32):
        for x in range(32):
            if (x, y) in owner:
                continue
            if any((x + dx, y + dy) in owner for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                if y < 22 or not (12 <= x <= 19):
                    t.set(x, y, line)
    return t


# ============================================================== tall grass
BLADES = [  # (base dx, lean per 3 rows, height, width at the root)
    (-3, -1, 5, 1), (-1, -1, 7, 2), (1, 0, 8, 2), (3, 1, 6, 2), (5, 1, 4, 1),
]


def _tuft(t, cx, base_y, frame, sway_dir):
    """Separate leaning blades (not a cone): 2px roots taper to 1px tips;
    the left edge of each blade is lit, the right edge in shade, tips warm."""
    for bx, lean, h, wid in BLADES:
        for k in range(h):
            y = base_y - k
            x = cx + bx + (lean * k) // 3 + (sway_dir if frame and k >= h - 2 else 0)
            tip = k == h - 1
            col = TALL["hi"] if tip else TALL["light"] if k >= h - 3 else TALL["base"]
            t.set(x % T, y, col)
            if wid == 2 and k < h // 2:
                t.set((x + 1) % T, y, TALL["mid"])


def tall_grass_v2(frame):
    """Two staggered rows of blade tufts that wrap at the tile edge, so a
    field reads as one mass. No dark band: the floor is a mid green."""
    t = Tile(fill=TALL["mid"])
    r = rng(3)
    for _ in range(14):  # dark gaps between blades, never a full row
        t.set(r(16), r(16), TALL["low"])
    for cx in (3, 11):
        _tuft(t, cx, 7, frame, 1)
    for cx in (-1, 7, 15):
        _tuft(t, cx, 15, frame, -1 if cx == 7 else 1)
    return t


# ================================================================ flowers
FLOWER_LAYOUT = [  # (x, y, colour) heads per tile; irregular, clear of the corners
    [(4, 4, "red"), (8, 3, "yellow"), (6, 7, "white"), (11, 9, "red"), (3, 11, "yellow"), (12, 13, "white"), (7, 12, "red")],
    [(5, 3, "white"), (10, 5, "red"), (3, 8, "red"), (8, 9, "yellow"), (13, 10, "white"), (5, 13, "yellow"), (10, 13, "red")],
]


def flower_head(t, x, y, kind):
    hi, base, lo = FLOWER[kind]
    t.set(x, y + 2, STEM[1])
    t.set(x - 1, y + 2, STEM[0])
    t.set(x + 1, y + 1, STEM[1])
    t.set(x, y - 1, hi)
    t.set(x - 1, y, hi)
    t.set(x + 1, y, base)
    t.set(x, y + 1, lo)
    t.set(x, y, FLOWER_EYE[kind])


def flowers_v2(frame, layout=0, seed=140):
    """Mixed red/yellow/white heads straight on grass; frame 1 sways every
    other head 1px. The grass under them is the normal field grass, so a
    patch blends into the lawn instead of sitting on a brown sticker."""
    t = grass(seed, tufts=1, specks=8)
    for i, (x, y, kind) in enumerate(FLOWER_LAYOUT[layout]):
        flower_head(t, x + (frame if i % 2 else 0), y, kind)
    return t


# ================================================================== house
SHINGLE = 4


def roof_v2(t, x0, y0, w, h, ramp):
    """Overlapping rounded shingle tabs in staggered courses, ridge cap,
    light left face / shaded right face, fascia + eave line."""
    hi, light, mid, dark, eave = ramp
    tab = 6
    for y in range(y0, y0 + h):
        course = (y - y0) // SHINGLE
        row = (y - y0) % SHINGLE
        for x in range(x0, x0 + w):
            right = x >= x0 + w * 0.62
            face, shade = (mid, dark) if right else (light, mid)
            k = (x - x0 + (tab // 2 if course % 2 else 0)) % tab
            col = face
            if row == SHINGLE - 1 and k not in (0, tab - 1):
                col = shade                 # rounded lower lip of each tab
            elif row == SHINGLE - 2 and k in (0, tab - 1):
                col = shade                 # the gap between two tabs
            elif row == 0 and k in (1, 2) and not right:
                col = hi                    # lit top-left of a tab
            t.set(x, y, col)
    t.rect(x0, y0, x0 + w - 1, y0, C["outline"])
    t.rect(x0 + 1, y0 + 1, x0 + w - 2, y0 + 2, hi)           # ridge cap
    t.rect(x0 + int(w * 0.62), y0 + 1, x0 + w - 2, y0 + 2, light)
    t.rect(x0 + 1, y0 + 3, x0 + w - 2, y0 + 3, dark)         # ridge shadow line
    for y in range(y0, y0 + h):
        t.set(x0, y, C["outline"])
        t.set(x0 + w - 1, y, C["outline"])
        t.set(x0 + 1, y, hi)
        t.set(x0 + w - 2, y, dark)
    t.rect(x0, y0 + h - 2, x0 + w - 1, y0 + h - 2, dark)     # fascia
    t.rect(x0, y0 + h - 1, x0 + w - 1, y0 + h - 1, eave)


def chimney(t, x, y, h=10):
    t.rect(x - 1, y - 1, x + 6, y + h, C["outline"])
    for yy in range(y, y + h):
        for xx in range(x, x + 6):
            brick = (yy - y) % 3 == 2 or (xx - x + ((yy - y) // 3) * 2) % 4 == 3
            t.set(xx, yy, "#8a3e2a" if brick else ("#c86848" if xx < x + 4 else "#a04a34"))
    t.rect(x - 2, y - 2, x + 7, y - 1, C["outline"])
    t.rect(x - 1, y - 2, x + 6, y - 2, C["stone"])


def window3(t, x, y, w=13, h=11):
    """Three panes with a sky gradient, a diagonal glint and a white sill."""
    t.rect(x - 1, y - 1, x + w, y + h, C["outline"])
    t.rect(x, y, x + w - 1, y + h - 1, C["frame"])
    pane_w = (w - 4) // 3
    for p in range(3):
        px = x + 1 + p * (pane_w + 1)
        for yy in range(y + 1, y + h - 1):
            f = (yy - y - 1) / max(1, h - 3)
            col = C["win_top"] if f < 0.3 else C["win_mid"] if f < 0.72 else C["win_lo"]
            t.rect(px, yy, px + pane_w - 1, yy, col)
        t.set(px, y + 2, C["water_hi"])
        t.set(px + 1, y + 1, C["water_hi"])
    t.rect(x - 2, y + h, x + w + 1, y + h, C["outline"])
    t.rect(x - 1, y + h, x + w, y + h, C["white"])           # sill
    t.rect(x - 1, y + h + 1, x + w, y + h + 1, C["wall_lo"])  # sill shadow


def door_v2(t, x, y, w=10, h=15):
    """Door with white trim frame, two panels, a lit window and a stone step."""
    t.rect(x - 2, y - 2, x + w + 1, y + h - 1, C["outline"])
    t.rect(x - 1, y - 1, x + w, y + h - 1, C["white"])
    t.rect(x + w, y - 1, x + w, y + h - 1, C["white_lo"])
    t.rect(x, y, x + w - 1, y + h - 1, C["door"])
    t.rect(x + w - 3, y, x + w - 1, y + h - 1, C["door_lo"])
    t.rect(x + 2, y + 2, x + w - 3, y + 5, C["outline"])
    t.rect(x + 3, y + 3, x + w - 4, y + 4, C["win_mid"])
    t.set(x + 3, y + 3, C["win_top"])
    t.rect(x + 2, y + 8, x + w - 3, y + 8, C["door_lo"])
    t.rect(x + 2, y + 11, x + w - 3, y + 11, C["door_lo"])
    t.set(x + w - 3, y + 9, C["knob"])


def wall_v2(t, x0, y0, w, h):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            col = C["wall_line"] if (y - y0) % 4 == 3 else C["wall"]
            if x >= x0 + w - 6:
                col = C["wall_line"] if col == C["wall_line"] else C["wall_lo"]
            t.set(x, y, col)
    t.rect(x0, y0, x0 + w - 1, y0 + 2, C["wall_lo"])                 # eave shadow
    t.rect(x0, y0, x0 + w - 1, y0, C["wall_line"])
    # stone footing: irregular blocks with mortar
    for y in range(y0 + h - 5, y0 + h):
        for x in range(x0, x0 + w):
            k = (x - x0 + (3 if (y - y0) % 2 else 0)) % 6
            col = C["stone_lo"] if k == 0 or y == y0 + h - 1 else C["stone"]
            if k in (1, 2) and y == y0 + h - 5:
                col = "#c8c8d8"
            t.set(x, y, col)
    for y in range(y0, y0 + h):
        t.set(x0, y, C["outline"])
        t.set(x0 + w - 1, y, C["outline"])
        t.set(x0 + 1, y, C["wall_hi"])


def base_shadow(t, x0, x1, y):
    """Soft 2 px shadow on the lawn under a building's footing (FireRed skirt)."""
    t.rect(x0 + 1, y, x1, y, "#58a840")
    t.rect(x0 + 3, y + 1, x1 - 2, y + 1, "#68b848")


def vent(t, x, y):
    """Small roof vent for shops (instead of a house chimney)."""
    t.rect(x - 1, y - 1, x + 6, y + 4, C["outline"])
    t.rect(x, y, x + 5, y + 3, C["stone"])
    t.rect(x, y, x + 5, y, "#c8c8d8")
    t.rect(x + 4, y + 1, x + 5, y + 3, C["stone_lo"])
    t.rect(x + 1, y + 2, x + 3, y + 2, C["stone_lo"])


def house_v2(roof_ramp="orange", kind="house"):
    """4x4 tiles, same footprint and door column as v1 (door in column 1).
    kind: house (chimney), center (cross plate, vent), mart (MART plate, vent)."""
    t = Tile(64, 64)
    t.paste(mown_block(64, 64))
    wall_v2(t, 3, 30, 58, 32)
    roof_v2(t, 1, 3, 62, 29, ROOFS[roof_ramp])
    if kind == "house":
        chimney(t, 46, 2, 9)
        window3(t, 6, 38)
        window3(t, 41, 38)
    else:
        vent(t, 46, 6)
        window3(t, 5, 38, w=10)
        window3(t, 44, 38, w=13)
    door_v2(t, 20, 45)
    # door spans x 18-31 (frame); plates are centred on it, above the frame
    if kind == "center":  # white plate with a red cross
        t.rect(19, 32, 30, 42, C["outline"])
        t.rect(20, 33, 29, 41, C["white"])
        t.rect(20, 41, 29, 41, C["white_lo"])
        t.rect(23, 34, 26, 40, "#e04838")
        t.rect(21, 36, 28, 38, "#e04838")
        t.rect(26, 35, 26, 40, "#a02c34")
    elif kind == "mart":  # blue plate, white lettering with a drop shadow
        t.rect(16, 32, 33, 42, C["outline"])
        t.rect(17, 33, 32, 41, "#4870c8")
        t.rect(17, 41, 32, 41, "#2c4c98")
        text(t, 17, 34, "MART", C["white"], shadow="#1c2c60")
    # step: stone slab wider than the door, lit top edge
    t.rect(17, 60, 33, 62, C["outline"])
    t.rect(18, 60, 32, 61, C["stone"])
    t.rect(18, 60, 32, 60, "#c8c8d8")
    base_shadow(t, 3, 60, 62)
    return t


def pillar(t, x, y0, y1):
    """Fluted white pillar (6 px): capital, grooves, base."""
    t.rect(x - 1, y0, x + 6, y1, C["outline"])
    t.rect(x, y0 + 2, x + 5, y1 - 2, C["white"])
    for gx in (x + 1, x + 3):
        t.rect(gx, y0 + 3, gx, y1 - 3, C["white_lo"])
    t.rect(x + 5, y0 + 2, x + 5, y1 - 2, C["white_sh"])
    t.rect(x - 1, y0, x + 6, y0 + 1, C["white"])          # capital
    t.rect(x - 1, y0 + 1, x + 6, y0 + 1, C["white_lo"])
    t.rect(x - 1, y1 - 1, x + 6, y1, C["white_lo"])        # base
    t.rect(x - 1, y1, x + 6, y1, C["stone_lo"])


def doormat():
    t = Tile()
    t.paste(mown_block(T, T))
    t.rect(2, 1, 13, 7, C["outline"])
    t.rect(3, 2, 12, 6, "#c84838")
    t.rect(4, 3, 11, 5, "#e86848")
    for x in range(4, 12, 2):
        t.set(x, 4, "#c84838")
    t.rect(3, 7, 12, 7, C["shadow"])
    return t


# ============================================================ border forest
# One 2x2 tree that tiles seamlessly in both directions (FireRed-style
# forest wall). The same block fills the off-map border (`border` map
# property, chosen by tile parity), so the edge of the world reads as one
# forest. Canopy clumps wrap horizontally so neighbouring trees merge.
BORDER_CLUSTERS = {
    "A": [(16, 5, 9), (4, 7, 8.5), (28, 7, 8.5), (0, 15, 8), (32, 15, 8),
          (10, 13, 8.5), (22, 13, 8.5), (16, 19, 8.5)],
    "B": [(9, 5, 8.5), (23, 5, 8.5), (0, 11, 8.5), (32, 11, 8.5), (16, 11, 9),
          (7, 18, 8), (25, 18, 8), (16, 20, 7.5)],
}


def border_tree(variant="A", leaf="forest"):
    hi, light, base, mid, low, line = LEAF[leaf]
    t = Tile(32, 32, fill=UNDERGROWTH)
    r0 = rng(41)
    for _ in range(40):
        t.set(r0(32), r0(32), GROUND_SHADOW)
    for y in range(22, 32):
        for x in range(32):
            if ((x - 16.5) / 7) ** 2 + ((y - 29) / 2.4) ** 2 < 1:
                t.set(x, y, low)
    for y in range(22, 30):
        for x in range(14, 19):
            col = BARK["hi"] if x <= 14 else BARK["lo"] if x >= 17 else BARK["base"]
            if x == 16 and y % 3 == 1:
                col = BARK["lo"]
            t.set(x, y, col)
        t.set(13, y, BARK["line"])
        t.set(19, y, BARK["line"])
    t.rect(13, 30, 19, 30, BARK["line"])
    clusters = BORDER_CLUSTERS[variant]
    owner = {}
    for i, (cx, cy, r) in enumerate(clusters):
        for y in range(32):
            for x in range(32):
                for wx in (-32, 0, 32):
                    if hypot((x + wx + 0.5 - cx) / r, (y + 0.5 - cy) / (r * 0.92)) < 1:
                        owner[(x, y)] = (i, cx - wx)
    for (x, y), (i, cx) in owner.items():
        _, cy, r = clusters[i]
        nx, ny = (x + 0.5 - cx) / r, (y + 0.5 - cy) / r
        lit = -(nx * 0.55 + ny * 0.83)
        below = owner.get((x, y + 1))
        if below is not None and below[0] != i and below[0] > i:
            col = low
        elif lit > 0.55:
            col = hi
        elif lit > 0.2:
            col = light
        elif lit > -0.25:
            col = base
        elif lit > -0.6:
            col = mid
        else:
            col = low
        t.set(x, y, col)
    r = rng(23 if variant == "A" else 29)
    for (x, y) in owner:
        if r(9) == 0 and ((x - 1) % 32, y) in owner and t.px[x, y][:3] == hexrgb(base)[:3]:
            t.set(x, y, mid)
            t.set((x - 1) % 32, y, light if r(2) else mid)
    for y in range(32):
        for x in range(32):
            if (x, y) in owner:
                continue
            if any(((x + dx) % 32, y + dy) in owner for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= y + dy < 32):
                if not (13 <= x <= 19 and y >= 22):
                    t.set(x, y, line)
    return t


# ================================================================= paths
# Dirt path autotile (the 47-tile "blob" set). Bits: N=1 E=2 S=4 W=8 for
# orthogonal grass neighbours; NE=16 SE=32 SW=64 NW=128 for diagonal grass
# that only matters when both touching orthogonals are path (inner corner).
PATH_C = {"hi": "#f2e0b0", "base": "#dcc08a", "mid": "#c8aa74", "rim": "#a88a5c",
          "rim_lo": "#8c7050", "peb": "#a89c8c", "peb_hi": "#ece6d8"}
N, E, S, Wb, NE, SE, SW, NW = 1, 2, 4, 8, 16, 32, 64, 128


def blob_mask(grass_at):
    """grass_at(dx, dy) -> bool. Returns the canonical 8-bit blob mask."""
    m = 0
    for bit, (dx, dy) in ((N, (0, -1)), (E, (1, 0)), (S, (0, 1)), (Wb, (-1, 0))):
        if grass_at(dx, dy):
            m |= bit
    for bit, (dx, dy), a, b in ((NE, (1, -1), N, E), (SE, (1, 1), S, E), (SW, (-1, 1), S, Wb), (NW, (-1, -1), N, Wb)):
        if not (m & a) and not (m & b) and grass_at(dx, dy):
            m |= bit
    return m


def blob_masks():
    """All 47 canonical masks, in a stable order."""
    seen = []
    for raw in range(256):
        bits = {(0, -1): raw & 1, (1, 0): raw & 2, (0, 1): raw & 4, (-1, 0): raw & 8,
                (1, -1): raw & 16, (1, 1): raw & 32, (-1, 1): raw & 64, (-1, -1): raw & 128}
        m = blob_mask(lambda dx, dy: bool(bits[(dx, dy)]))
        if m not in seen:
            seen.append(m)
    return sorted(seen)


def _wobble(i, salt):
    """Edge jitter in px, periodic over 16 so neighbouring tiles join."""
    return (0, 1, 1, 0, -1, 0, 1, 0, 0, -1, 0, 1, 1, 0, -1, 0)[(i * 5 + salt) % 16]


def path_tile(mask, seed=0):
    t = grass(300 + mask % 7, tufts=0, specks=6)
    R = 4.5  # outer corner radius
    r = rng(900 + mask * 13 + seed)
    for y in range(T):
        for x in range(T):
            ds = []
            if mask & N:
                ds.append(y + 0.5 - _wobble(x, 3))
            if mask & S:
                ds.append(15.5 - y - _wobble(x, 7))
            if mask & Wb:
                ds.append(x + 0.5 - _wobble(y, 11))
            if mask & E:
                ds.append(15.5 - x - _wobble(y, 13))
            for bit, cx, cy in ((NE, 16, 0), (SE, 16, 16), (SW, 0, 16), (NW, 0, 0)):
                if mask & bit:  # inner corner: grass bite around the corner point
                    ds.append(hypot(x + 0.5 - cx, y + 0.5 - cy) - 2.5)
            for a, b, cx, cy in ((N, Wb, R, R), (N, E, 16 - R, R), (S, Wb, R, 16 - R), (S, E, 16 - R, 16 - R)):
                if mask & a and mask & b:
                    inx = (x + 0.5 < cx) if cx < 8 else (x + 0.5 > cx)
                    iny = (y + 0.5 < cy) if cy < 8 else (y + 0.5 > cy)
                    if inx and iny:  # rounded outer corner
                        ds.append(R - hypot(x + 0.5 - cx, y + 0.5 - cy))
            d = min(ds) if ds else 99
            if d < 1.0:
                continue                       # grass shows through
            if d < 2.0:
                col = PATH_C["rim_lo"] if (mask & (N | Wb)) and d == min(ds) else PATH_C["rim"]
            elif d < 3.0:
                col = PATH_C["mid"]
            else:
                col = PATH_C["base"]
                n = r(40)
                if n == 0:
                    col = PATH_C["mid"]
                elif n < 3 and d > 6:
                    col = PATH_C["hi"]        # worn, lighter centre (sparse)
            t.set(x, y, col)
    # at most one pebble, away from the edge
    for _ in range(r(2)):
        px, py = 3 + r(10), 3 + r(10)
        if all(t.px[px + dx, py + dy][:3] in (hexrgb(PATH_C["base"])[:3], hexrgb(PATH_C["hi"])[:3], hexrgb(PATH_C["mid"])[:3])
               for dx in (0, 1) for dy in (0, 1)):
            t.set(px, py, PATH_C["peb_hi"])
            t.set(px + 1, py, PATH_C["peb"])
            t.set(px, py + 1, PATH_C["peb"])
            t.set(px + 1, py + 1, PATH_C["rim_lo"])
    return t


# ================================================================== pond
# Water autotile on the same 47 blob masks (bits = which neighbours are
# land). Bands from the land inward: grass, dry sand, wet sand, foam,
# shallow water, deep water. 3 frames: ripples drift, foam laps, sparkles.
POND = {"sand_hi": "#f0e2a8", "sand": "#dcc68a", "wet": "#b49c6c", "foam": "#f4fcff",
        "shallow": "#98d4f4", "water": "#6cb0ec", "deep": "#4c8ad8", "ripple": "#c4ecff",
        "spark": "#ffffff"}


def pond_tile(mask, frame):
    t = grass(400 + mask % 5, tufts=0, specks=6)
    R = 5.5
    r = rng(1200 + mask * 7)
    sparks = [(r(16), r(16)) for _ in range(3)]
    for y in range(T):
        for x in range(T):
            ds = []
            if mask & N:
                ds.append(y + 0.5 - _wobble(x, 1) * 0.5)
            if mask & S:
                ds.append(15.5 - y - _wobble(x, 5) * 0.5)
            if mask & Wb:
                ds.append(x + 0.5 - _wobble(y, 9) * 0.5)
            if mask & E:
                ds.append(15.5 - x - _wobble(y, 15) * 0.5)
            for bit, cx, cy in ((NE, 16, 0), (SE, 16, 16), (SW, 0, 16), (NW, 0, 0)):
                if mask & bit:
                    # concave shore: a wide arc around the land corner, not a pinch
                    ds.append(hypot(x + 0.5 - cx, y + 0.5 - cy) - 1.0 - (5.5 - min(5.5, hypot(x + 0.5 - cx, y + 0.5 - cy))) * 0.6)
            for a, b, cx, cy in ((N, Wb, R, R), (N, E, 16 - R, R), (S, Wb, R, 16 - R), (S, E, 16 - R, 16 - R)):
                if mask & a and mask & b:
                    inx = (x + 0.5 < cx) if cx < 8 else (x + 0.5 > cx)
                    iny = (y + 0.5 < cy) if cy < 8 else (y + 0.5 > cy)
                    if inx and iny:
                        ds.append(R - hypot(x + 0.5 - cx, y + 0.5 - cy))
            d = min(ds) if ds else 99
            if d < 1.0:
                continue
            if d < 2.2:
                col = POND["sand_hi"] if d < 1.6 else POND["sand"]
            elif d < 3.0:
                col = POND["wet"]
            elif d < 3.8:
                # foam laps: present on alternating stretches, shifting per frame
                col = POND["foam"] if ((x + y + frame * 3) // 3) % 2 == 0 else POND["shallow"]
            elif d < 6.0:
                col = POND["shallow"]
            elif d < 9.0:
                col = POND["water"]
            else:
                col = POND["deep"]
            if d >= 4.5:
                # ripples: short light dashes drifting right, period 16 so tiles join
                if y % 6 == (x // 8) * 3 % 6 and ((x + frame * 2 + y * 5) % 16) < 3:
                    col = POND["ripple"]
            t.set(x, y, col)
    for i, (sx, sy) in enumerate(sparks):
        if (i + frame) % 3 == 0:
            for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
                if 0 <= sx + dx < 16 and 0 <= sy + dy < 16 and t.px[sx + dx, sy + dy][:3] in (
                        hexrgb(POND["water"])[:3], hexrgb(POND["deep"])[:3], hexrgb(POND["ripple"])[:3]):
                    t.set(sx + dx, sy + dy, POND["spark"] if (dx, dy) == (0, 0) else POND["ripple"])
    return t


def lily_pads():
    """Decor over open water: two pads (notched discs) and a pink flower."""
    t = Tile()
    pad, pad_hi, pad_lo = "#58b048", "#90d860", "#2f7a40"
    for cx, cy, rad in ((6, 6, 4.6), (12, 12, 3.4)):
        for y in range(16):
            for x in range(16):
                dx, dy = x + 0.5 - cx, y + 0.5 - cy
                if hypot(dx, dy) < rad and not (dx > 0 and abs(dy) < 0.8):  # the notch
                    col = pad_hi if dx + dy < -rad * 0.6 else pad_lo if dx + dy > rad * 0.7 else pad
                    t.set(x, y, col)
        t.set(int(cx) - 1, int(cy + rad), POND["deep"])  # tiny shadow on the water
    for x, y, c in ((4, 4, "#ffc4da"), (5, 3, "#ffc4da"), (5, 4, "#f8d040"), (6, 4, "#f07ca8"), (5, 5, "#f07ca8"), (4, 3, "#ffc4da")):
        t.set(x, y, c)
    return t


def reeds():
    """Decor on a shore cell: a clump of reeds with cat-tail heads."""
    t = Tile()
    stem, stem_hi, stem_lo, head = "#5aa048", "#9cd468", "#2f6a3c", "#8a5634"
    for x0, h, lean in ((3, 11, 0), (5, 13, 1), (7, 9, 0), (12, 10, -1), (14, 8, 0)):
        for k in range(h):
            x = x0 + (lean if k > h // 2 else 0)
            y = 15 - k
            t.set(x, y, stem_hi if k > h - 3 else stem if k > 2 else stem_lo)
        if h >= 10:
            t.rect(x0 + lean, 15 - h, x0 + lean, 15 - h + 2, head)
            t.set(x0 + lean, 15 - h, "#b07448")
    return t


# ======================================================== fences & ledges
SHADE = {"g1": "#58a840", "g2": "#68b848"}  # soft ground shadow tones on the lawn
WOOD = {"hi": "#e0a868", "base": "#b87c48", "lo": "#86522e", "line": "#4a2a22"}


def _ground():
    return grass(510, tufts=0, specks=5)


def picket_v2(end=None):
    """White picket run; end='l'/'r' adds a capped corner post. Shadow strip below."""
    t = _ground()
    t.rect(0, 13, 15, 13, SHADE["g1"])
    t.rect(0, 14, 15, 14, SHADE["g2"])
    for y in (6, 10):  # rails behind the boards (grass shows between boards)
        t.rect(0, y, 15, y, C["white_lo"])
        t.rect(0, y + 1, 15, y + 1, C["white_sh"])
    for x0 in range(0, 16, 4):  # 2 px board, 1 px shadow edge, 1 px gap
        t.rect(x0, 4, x0 + 1, 12, C["white"])
        t.set(x0, 3, C["white"])                  # pointed top (left-lit)
        t.rect(x0 + 2, 4, x0 + 2, 12, C["white_sh"])
        t.set(x0 + 1, 3, C["white_lo"])
        t.set(x0, 12, C["white_lo"])
        t.set(x0 + 1, 12, C["white_lo"])
    if end:
        x = 0 if end == "l" else 12
        t.rect(x, 1, x + 3, 13, C["outline"])
        t.rect(x + 1, 3, x + 2, 12, C["white"])
        t.rect(x + 2, 3, x + 2, 12, C["white_lo"])
        t.rect(x, 1, x + 3, 2, C["white_sh"])
        t.rect(x + 1, 1, x + 2, 1, C["white"])
    return t


def log_v2(end=None):
    """Two log rails between posts; end='l'/'r' stops the rails at a post."""
    t = _ground()
    t.rect(0, 13, 15, 13, SHADE["g1"])
    t.rect(0, 14, 15, 14, SHADE["g2"])
    x0, x1 = (4 if end == "l" else 0), (11 if end == "r" else 15)
    for y in (5, 9):
        t.rect(x0, y, x1, y + 2, WOOD["line"])
        t.rect(x0, y, x1, y, WOOD["hi"])
        t.rect(x0, y + 1, x1, y + 1, WOOD["base"])
    for px in ([2] if end != "r" else []) + ([12] if end != "l" else []) + ([13] if end == "r" else []):
        pass
    posts = {None: [6], "l": [2, 10], "r": [5, 12]}[end]
    for px in posts:
        t.rect(px - 1, 2, px + 2, 13, WOOD["line"])
        t.rect(px, 3, px + 1, 12, WOOD["base"])
        t.rect(px, 3, px, 12, WOOD["hi"])
        t.rect(px - 1, 2, px + 2, 2, WOOD["lo"])
        t.set(px, 2, WOOD["hi"])
    return t


def ledge_v2(end=None):
    """One-way ledge: lit grass lip, striated dirt face, dark base, soft
    shadow on the lower grass. end='l'/'r' rounds that end of the face."""
    t = _ground()
    face = ["#cfe890", "#9a7a50", "#86683f", "#6c5232", "#3e5a36"]
    for x in range(16):
        inset = 0
        if end == "l":
            inset = max(0, 3 - x)
        elif end == "r":
            inset = max(0, x - 12)
        top = 9 + inset
        if top > 13:
            continue
        t.set(x, top, face[0])                      # lit lip
        for y in range(top + 1, 13):
            col = face[1] if y == top + 1 else face[2] if (x + y) % 5 else face[3]
            t.set(x, y, col)
        t.set(x, 13, face[4])                       # dark base
        t.set(x, 14, SHADE["g1"])
        if x % 3 != 1:
            t.set(x, 15, SHADE["g2"])
    return t


# ================================================================= props
def _shadow(t, cx, cy, rx, ry):
    for y in range(16):
        for x in range(16):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 < 1:
                t.set(x, y, SHADE["g1"])


def rock_v2():
    t = _ground()
    _shadow(t, 9.5, 13, 6.5, 2.2)
    stone = ["#eef0f6", "#c4c8d8", "#9ea2b8", "#70748e", "#3e3c50"]
    for y in range(4, 14):
        for x in range(2, 14):
            nx, ny = (x + 0.5 - 7.5) / 6, (y + 0.5 - 9.5) / 4.6
            dist = nx * nx + ny * ny
            if dist < 1:
                lit = -(nx * 0.6 + ny * 0.8)
                col = stone[0] if lit > 0.55 else stone[1] if lit > 0.1 else stone[2] if lit > -0.45 else stone[3]
                if dist > 0.78:
                    col = stone[4]
                t.set(x, y, col)
    t.set(6, 8, stone[3])
    t.set(7, 9, stone[3])
    return t


def barrel():
    t = _ground()
    _shadow(t, 9, 14, 6, 1.8)
    for y in range(3, 15):
        bulge = 1 if 6 <= y <= 11 else 0
        for x in range(4 - bulge, 12 + bulge):
            col = WOOD["hi"] if x <= 5 else WOOD["lo"] if x >= 10 else WOOD["base"]
            if y in (5, 12):
                col = "#7c7e94"                        # iron hoops
            t.set(x, y, col)
        t.set(3 - bulge, y, WOOD["line"])
        t.set(12 + bulge, y, WOOD["line"])
    t.rect(4, 2, 11, 2, WOOD["line"])
    t.rect(4, 3, 11, 3, "#d8a870")
    t.rect(4, 15, 11, 15, WOOD["line"])
    return t


def crate():
    t = _ground()
    _shadow(t, 9, 14, 6.5, 1.8)
    t.rect(2, 3, 13, 14, WOOD["line"])
    t.rect(3, 4, 12, 13, WOOD["base"])
    t.rect(3, 4, 12, 4, WOOD["hi"])
    t.rect(3, 4, 3, 13, WOOD["hi"])
    t.rect(12, 5, 12, 13, WOOD["lo"])
    for i in range(8):  # diagonal brace
        t.set(4 + i, 12 - i, WOOD["lo"])
        t.set(5 + i, 12 - i, WOOD["hi"])
    return t


def bench(side):
    """2-tile park bench; side 'l' / 'r'."""
    t = _ground()
    t.rect(0, 13, 15, 13, SHADE["g1"])
    lo, hi = (1, 15) if side == "l" else (0, 14)
    t.rect(lo, 3, hi, 6, WOOD["line"])            # back rest
    t.rect(lo + (1 if side == "l" else 0), 4, hi - (1 if side == "r" else 0), 4, WOOD["hi"])
    t.rect(lo + (1 if side == "l" else 0), 5, hi - (1 if side == "r" else 0), 5, WOOD["base"])
    t.rect(lo, 8, hi, 10, WOOD["line"])           # seat
    t.rect(lo + (1 if side == "l" else 0), 8, hi - (1 if side == "r" else 0), 8, WOOD["hi"])
    t.rect(lo + (1 if side == "l" else 0), 9, hi - (1 if side == "r" else 0), 9, WOOD["base"])
    leg = 3 if side == "l" else 12
    t.rect(leg - 1, 6, leg, 12, "#3e3c50")
    t.rect(leg - 1, 6, leg - 1, 12, "#70748e")
    return t


def lamp():
    """16x32 lamp post: lantern head (top tile, drawn above actors), pole + foot."""
    t = Tile(16, 32)
    t.paste(_ground(), 0, 16)
    _sh = Tile(16, 16)
    t.rect(8, 28, 12, 28, SHADE["g1"])
    t.rect(6, 6, 9, 29, "#2e2a44")
    t.rect(7, 7, 7, 28, "#7a7694")
    t.rect(8, 7, 8, 28, "#4e4a66")
    t.rect(5, 27, 10, 29, "#2e2a44")
    t.rect(6, 27, 9, 27, "#7a7694")
    t.rect(3, 0, 12, 7, "#2e2a44")                # lantern
    t.rect(4, 1, 11, 6, "#fff2a2")
    t.rect(4, 1, 11, 1, "#ffffff")
    t.rect(9, 2, 11, 6, "#eabc54")
    t.rect(7, 1, 8, 6, "#2e2a44")
    t.rect(2, 0, 13, 0, "#4e4a66")
    return t


def veg_bed():
    """Tilled soil rows with leafy crops (a garden bed)."""
    t = Tile(fill="#8a5a38")
    for y in range(16):
        if y % 4 == 3:
            t.rect(0, y, 15, y, "#6a4228")
    for y0 in (1, 5, 9, 13):
        for x0 in (2, 7, 12):
            t.set(x0, y0, "#9cd468")
            t.set(x0 - 1, y0 + 1, "#58a840")
            t.set(x0 + 1, y0 + 1, "#3a7c44")
            t.set(x0, y0 + 1, "#78c050")
    t.rect(0, 0, 15, 0, "#a87850")
    return t


def laundry(side):
    """2-tile laundry line: posts at the outer ends, sagging line, clothes."""
    t = _ground()
    t.rect(0, 14, 15, 14, SHADE["g1"])
    post = 1 if side == "l" else 14
    t.rect(post - 1, 1, post + 1, 14, WOOD["line"])
    t.rect(post, 2, post, 13, WOOD["base"])
    for x in range(16):
        sag = 0 if (side == "l" and x < 3) or (side == "r" and x > 12) else 1 if (side == "l" and x < 8) or (side == "r" and x > 7) else 2
        if not (post - 1 <= x <= post + 1):
            t.set(x, 2 + sag, "#e8ecf4")
    clothes = [(5, "#e84a3c", "#a82c44", 5), (10, "#fffcf0", "#c8cce0", 4)] if side == "l" else [(3, "#4c78e0", "#3048a0", 6), (8, "#f8d040", "#c08c28", 4)]
    for x0, c, lo, h in clothes:
        top = 3 + (2 if 3 < x0 < 13 else 1)
        t.rect(x0 - 1, top, x0 + 2, top + h, C["outline"])
        t.rect(x0, top + 1, x0 + 1, top + h - 1, c)
        t.rect(x0 + 1, top + 1, x0 + 1, top + h - 1, lo)
    return t


# ======================================================== buildings v3
# Each building type gets its own silhouette and roof type (FireRed-style
# variety), not a recoloured house: Care Centre = wrap-around hip roof +
# glass vestibule; Mart = flat roof + sign band + striped awning; Gym =
# ribbed flat roof + pillared portico. Footprints and door columns match
# v2, so maps do not move. Emblems are original (no Poke Ball).
OL = C["outline"]
WHITE_WALL = ["#ffffff", "#eef0f6", "#d4d8e6", "#aab0c6"]  # hi, base, shade, deep
GLASS = ["#e8f8ff", "#98d0f8", "#5890d8", "#3a68b0"]


def text2x(t, x, y, s, col, shadow=None):
    """The 3x5 font drawn at 2x (6x10 glyphs, 8 px advance)."""
    for ch in s:
        for dy, rowg in enumerate(FONT_V3[ch]):
            for dx, c in enumerate(rowg):
                if c == "#":
                    for sx in (0, 1):
                        for sy in (0, 1):
                            if shadow:
                                t.set(x + dx * 2 + sx + 1, y + dy * 2 + sy + 1, shadow)
                            t.set(x + dx * 2 + sx, y + dy * 2 + sy, col)
        x += 8


FONT_V3 = {
    "M": ["#.#", "###", "###", "#.#", "#.#"], "A": [".#.", "#.#", "###", "#.#", "#.#"],
    "R": ["##.", "#.#", "##.", "#.#", "#.#"], "T": ["###", ".#.", ".#.", ".#.", ".#."],
    "G": ["###", "#..", "#.#", "#.#", "###"], "Y": ["#.#", "#.#", ".#.", ".#.", ".#."],
}


def boxed(t, x0, y0, x1, y1, fill):
    t.rect(x0, y0, x1, y1, OL)
    t.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, fill)


def glass_doors(t, x0, y0, x1, y1):
    """Sliding glass double door: grey frame, two panes, centre split, glints."""
    boxed(t, x0, y0, x1, y1, "#9aa0be")
    mid = (x0 + x1) // 2
    for a, b in ((x0 + 2, mid - 1), (mid + 1, x1 - 2)):
        for y in range(y0 + 2, y1):
            f = (y - y0) / max(1, y1 - y0)
            t.rect(a, y, b, y, GLASS[0] if f < 0.18 else GLASS[1] if f < 0.65 else GLASS[2])
        t.set(a + 1, y0 + 3, "#ffffff")
        t.set(a + 1, y0 + 4, GLASS[0])
        t.rect(b, y0 + 2, b, y1 - 1, GLASS[3])
    t.rect(mid, y0 + 1, mid, y1 - 1, OL)


def band_window(t, x, y, w, h=8):
    """FireRed-style blue band window: white frame, dark glass with a glint."""
    boxed(t, x - 1, y - 1, x + w, y + h, "#ffffff")
    t.rect(x + 1, y + 1, x + w - 2, y + h - 2, GLASS[2])
    t.rect(x + 1, y + 1, x + w - 2, y + 2, GLASS[1])
    t.set(x + 2, y + 1, GLASS[0])
    t.set(x + 3, y + 1, GLASS[0])
    t.rect(x + w // 2, y + 1, x + w // 2, y + h - 2, "#ffffff")
    t.rect(x - 1, y + h + 1, x + w, y + h + 1, WHITE_WALL[2])


def plain_wall(t, x0, y0, w, h, pal=WHITE_WALL, footing=True):
    """Smooth rendered wall: lit left edge, shaded right edge, footing."""
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            col = pal[1]
            if x >= x0 + w - 5:
                col = pal[2]
            t.set(x, y, col)
        t.set(x0, y, OL)
        t.set(x0 + w - 1, y, OL)
        t.set(x0 + 1, y, pal[0])
    t.rect(x0 + 1, y0, x0 + w - 2, y0 + 2, pal[2])          # eave shadow
    if footing:
        t.rect(x0, y0 + h - 4, x0 + w - 1, y0 + h - 2, "#b8bccc")
        t.rect(x0, y0 + h - 4, x0 + w - 1, y0 + h - 4, "#d8dce6")
        t.rect(x0, y0 + h - 1, x0 + w - 1, y0 + h - 1, OL)


# ------------------------------------------------------------ care centre
def emblem_heart(t, cx, cy):
    """Original Care Centre emblem: white badge, red ring, red heart with a
    white plus. (Deliberately not a Poke Ball.)"""
    for y in range(cy - 7, cy + 8):
        for x in range(cx - 7, cx + 8):
            d = hypot(x + 0.5 - cx - 0.5, y + 0.5 - cy - 0.5)
            if d < 7.2:
                t.set(x, y, OL)
            if d < 6.2:
                t.set(x, y, "#e04838")
            if d < 4.9:
                t.set(x, y, "#ffffff")
    heart = [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."]
    for dy, row in enumerate(heart):
        for dx, c in enumerate(row):
            if c == "#":
                t.set(cx - 3 + dx, cy - 3 + dy, "#e84a3c")
    for x, y in ((cx, cy - 2), (cx - 1, cy - 1), (cx, cy - 1), (cx + 1, cy - 1), (cx, cy)):
        t.set(x, y, "#ffffff")
    t.set(cx - 2, cy - 3, "#ffa088")


def center_v3():
    t = Tile(64, 64)
    t.paste(mown_block(64, 64))
    hi, light, base, dark, eave = ROOFS["red"]
    plain_wall(t, 3, 31, 58, 31)
    band_window(t, 7, 38, 10)
    band_window(t, 47, 38, 10)
    # wrap-around hip roof: flat top plateau, ribbed front slope, rounded corners
    for y in range(2, 32):
        inset = max(0, 7 - (y - 2))                 # hip: slopes widen to the eave
        x0, x1 = 1 + inset, 62 - inset
        corner = 0
        if y >= 26:                                  # rounded front corners
            corner = {26: 1, 27: 1, 28: 2, 29: 3, 30: 4, 31: 6}[y]
        x0, x1 = x0 + corner, x1 - corner
        for x in range(x0, x1 + 1):
            if y <= 9 and 9 <= x <= 54:
                col = light if (x + y) % 9 else hi    # plateau, faint grid
            else:
                right = x > 40
                col = (base if (x // 3) % 2 else dark) if right else (light if (x // 3) % 2 else base)
                if y >= 29:
                    col = dark if y == 29 else eave
            t.set(x, y, col)
        t.set(x0 - 1, y, OL)
        t.set(x1 + 1, y, OL)
    t.rect(8, 1, 55, 1, OL)
    t.rect(9, 9, 54, 9, base)                       # plateau rim
    t.rect(9, 2, 54, 2, hi)
    # glass vestibule, centred on the door column
    boxed(t, 17, 40, 44, 62, WHITE_WALL[1])
    t.rect(18, 41, 43, 43, "#ffffff")
    t.rect(18, 44, 43, 44, WHITE_WALL[2])
    t.rect(41, 45, 43, 61, WHITE_WALL[2])
    glass_doors(t, 21, 46, 40, 62)
    emblem_heart(t, 30, 31)
    t.rect(14, 62, 47, 63, C["stone"])
    t.rect(14, 62, 47, 62, "#d8dce6")
    base_shadow(t, 3, 60, 62)
    return t


# ------------------------------------------------------------------ mart
def mart_v3():
    t = Tile(64, 64)
    t.paste(mown_block(64, 64))
    hi, light, base, dark, eave = ROOFS["blue"]
    plain_wall(t, 3, 34, 58, 28, pal=["#ffffff", "#e8ecf6", "#c8d0e2", "#9aa4c2"])
    # flat roof seen from the front: parapet + panel grid
    boxed(t, 1, 3, 62, 22, light)
    for y in range(4, 22):
        for x in range(2, 62):
            col = light if x < 40 else base
            if (y - 4) % 6 == 5 or (x - 2) % 10 == 9:
                col = base if x < 40 else dark
            t.set(x, y, col)
    t.rect(2, 4, 61, 5, hi)                          # parapet lip
    t.rect(2, 21, 61, 21, dark)
    t.rect(46, 9, 53, 15, OL)                        # rooftop AC unit
    t.rect(47, 10, 52, 14, "#c8ccdc")
    t.rect(47, 10, 52, 10, "#ffffff")
    for x in (48, 50):
        t.rect(x, 12, x, 14, "#8e92ac")
    # sign band across the facade
    boxed(t, 1, 22, 62, 34, "#ffffff")
    t.rect(2, 23, 61, 23, "#e8ecf6")
    t.rect(2, 33, 61, 33, "#c8d0e2")
    text2x(t, 17, 24, "MART", base, shadow=eave)
    for x0 in (5, 50):                               # little bag icons
        t.rect(x0, 26, x0 + 7, 31, OL)
        t.rect(x0 + 1, 27, x0 + 6, 30, "#f8d040")
        t.rect(x0 + 2, 24, x0 + 2, 26, OL)
        t.rect(x0 + 5, 24, x0 + 5, 26, OL)
        t.rect(x0 + 2, 24, x0 + 5, 24, OL)
    # striped awning with a scalloped edge and its shadow on the wall
    for y in range(35, 41):
        for x in range(3, 61):
            stripe = ((x - 3) // 4) % 2
            col = (base if stripe else "#ffffff") if y < 39 else (dark if stripe else WHITE_WALL[2])
            if y == 40 and (x - 3) % 4 in (0, 3):
                continue
            t.set(x, y, col)
    t.rect(3, 34, 60, 34, OL)
    t.rect(3, 41, 60, 41, "#b8c0d4")
    # door in column 1, big display window with goods on shelves
    glass_doors(t, 17, 44, 30, 61)
    boxed(t, 34, 44, 58, 58, GLASS[1])
    for sy in (49, 54):
        t.rect(35, sy, 57, sy, "#ffffff")
        for i, c in enumerate(("#e84a3c", "#f8d040", "#40b8b0", "#f07ca8", "#4c78e0", "#e84a3c")):
            t.rect(36 + i * 4, sy - 3, 37 + i * 4, sy - 1, c)
    t.rect(35, 45, 36, 46, GLASS[0])
    t.rect(14, 62, 33, 63, C["stone"])
    t.rect(14, 62, 33, 62, "#d8dce6")
    base_shadow(t, 3, 60, 62)
    return t


# ------------------------------------------------------------------- gym
GYM_ROOF = ["#f6e4a4", "#e0c47a", "#c4a45a", "#9a7c40", "#5e4a2a"]


def emblem_star(t, cx, cy):
    """Original Gym emblem: red shield with a gold star."""
    shield = ["#########", "#########", "#########", "#########", ".#######.", "..#####..", "...###...", "....#...."]
    for dy, row in enumerate(shield):
        for dx, c in enumerate(row):
            if c == "#":
                t.set(cx - 4 + dx, cy - 4 + dy, "#e04838" if dx < 6 else "#a02c34")
    for dy, row in enumerate(shield):  # outline
        for dx, c in enumerate(row):
            if c == "#":
                for ox, oy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = dx + ox, dy + oy
                    if not (0 <= ny < len(shield) and 0 <= nx < 9 and shield[ny][nx] == "#"):
                        t.set(cx - 4 + nx, cy - 4 + ny, OL)
    for x, y in ((0, -3), (-1, -2), (0, -2), (1, -2), (-3, -1), (-2, -1), (-1, -1), (0, -1), (1, -1), (2, -1), (3, -1),
                 (-1, 0), (0, 0), (1, 0), (-2, 1), (-1, 1), (1, 1), (2, 1)):
        t.set(cx + x, cy + y, "#fff28c" if y < 0 else "#f2b832")


def gym_v3():
    t = Tile(96, 80)
    t.paste(mown_block(96, 80))
    hi, light, base, dark, eave = GYM_ROOF
    plain_wall(t, 3, 42, 90, 35, pal=["#fffaf0", "#f0e4c8", "#d0b890", "#a88c68"])
    for y in range(52, 58):                          # stripe band on the wall
        t.rect(4, y, 91, y, "#e8d2a8" if y % 2 else "#d8bc8c")
    # wide flat roof with vertical ribs, lit front lip, eave shadow
    boxed(t, 1, 3, 94, 42, base)
    for y in range(4, 42):
        for x in range(2, 94):
            k = (x - 2) % 4
            col = [light, light, base, dark][k] if x < 62 else [base, base, dark, dark][k]
            if y in (4, 5):
                col = hi
            if y >= 37:
                col = [hi, light, light, hi][k] if y < 40 else (dark if y == 40 else eave)
            t.set(x, y, col)
    # entrance portico: canopy with the emblem, fluted pillars, glass doors
    boxed(t, 30, 33, 65, 46, "#fffaf0")
    t.rect(31, 34, 64, 35, "#ffffff")
    t.rect(31, 44, 64, 45, "#d8c8a8")
    emblem_star(t, 48, 39)
    for px in (31, 59):
        pillar(t, px, 46, 76)
    glass_doors(t, 38, 50, 57, 77)
    for x0 in (7, 69):                               # window strips
        band_window(t, x0, 46, 18, 6)
    boxed(t, 8, 61, 27, 71, "#e04838")               # GYM plate
    t.rect(9, 62, 26, 62, "#f07058")
    t.rect(9, 70, 26, 70, "#a02c34")
    text(t, 12, 64, "GYM", "#ffffff", shadow=OL)
    t.rect(28, 77, 67, 79, C["stone"])
    t.rect(28, 77, 67, 77, "#d8dce6")
    base_shadow(t, 3, 92, 78)
    return t


def house_v3():
    """The approved v2 house plus flower boxes under its windows."""
    t = house_v2("orange")
    for x0 in (5, 40):
        t.rect(x0, 51, x0 + 15, 54, OL)
        t.rect(x0 + 1, 52, x0 + 14, 53, WOOD["base"])
        t.rect(x0 + 1, 52, x0 + 14, 52, WOOD["hi"])
        for i, c in enumerate(("#e84a3c", "#f8d040", "#ffffff", "#f07ca8", "#e84a3c", "#f8d040", "#ffffff")):
            fx = x0 + 1 + i * 2
            t.set(fx, 50, c)
            t.set(fx + 1, 51, "#58a840")
    return t
