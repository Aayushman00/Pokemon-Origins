"""v2 environment art (stage 2 slice): oak trees, tall grass, flower
clusters and the house. Drawn procedurally where a formula reads better
than a grid, always ending in hard pixels from a small fixed palette.

Light comes from the top-left. Shadows lean cool (blue-green), highlights
warm (yellow-green). No pure black; outlines are the darkest local tone.
"""
from math import hypot

from PIL import Image

from .tiles import C, ROOFS, T, Tile, grass, hexrgb, mown_block, rng

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


def house_v2(roof_ramp="orange"):
    """4x4 tiles, same footprint and door column as v1 (door in column 1)."""
    t = Tile(64, 64)
    t.paste(mown_block(64, 64))
    wall_v2(t, 3, 30, 58, 32)
    roof_v2(t, 1, 3, 62, 29, ROOFS[roof_ramp])
    chimney(t, 46, 2, 9)
    window3(t, 6, 38)
    window3(t, 41, 38)
    door_v2(t, 20, 45)
    # step: stone slab wider than the door, lit top edge
    t.rect(17, 60, 33, 62, C["outline"])
    t.rect(18, 60, 32, 61, C["stone"])
    t.rect(18, 60, 32, 60, "#c8c8d8")
    return t


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
