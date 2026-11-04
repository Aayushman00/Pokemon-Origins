"""v3 polish: pixel-level refinement of a v1 character.

Identity lock. A polished character keeps every v1 pixel: the same letter
canvas (silhouette, height, head ratio, accessories) and the same material
ramps (outfit and hair colours). Polish may only change WHICH tone of the
same ramp a pixel uses, plus a tiny set of named accents from the master
palette (the eye's iris pixel). test_art.PolishTests enforces that the
alpha mask of every frame is identical to the unpolished v1 frame.

Two tools:
  * shade_v3: a calmer shading rule for the whole body. v1 shades a pixel
    whenever its right OR lower neighbour is another material, so 1-3 px
    parts (arms, legs, chin) went fully dark: the "muddy" look. v3 keeps
    the right-hand form shadow and hem shadow, and adds a left rim light.
  * per-direction tone maps for the head (hand-set ^ hi, - base, v shadow),
    applied on the pre-transform canvas and moved with the walk bob / run
    lean, so every pose gets the same face.
"""

TONE = {"^": "hi", "-": "base", "v": "shadow"}
# Materials whose v1 tones are kept as-is: trousers, lower legs, shoes and
# the 2 px sleeves / forearms (splitting a 2 px run into two tones leaves
# single orphan pixels).
# Their v1 value (dark navy) is part of the identity; lifting them reads as
# a recolour next to unpolished NPCs.
KEEP_V1 = set("blnaf")
# Only these materials take highlights from shade_v3 (cap, hat accent, hair,
# top). Arms, hands and skin get base/shadow; the face uses its tone map.
HI_OK = set("cxht")
EYE_IRIS = "#2a2e6c"  # navy ramp shadow (master palette): the eye's lit top pixel


def _mat(ch, materials):
    if ch in "ke.w_":
        return None
    low = ch.lower()
    return low if low in materials else None


def shade_v3(canvas, materials):
    """Tone keys for a letter canvas. Light from the top-left.

    shadow: right neighbour is another material (form shadow), or the pixel
            is the bottom row of a run at least 3 tall (hem / underside),
            or it sits in the right quarter of a run 6+ wide.
    hi:     top row of a run, left half; or the left edge of a run 4+ wide.
    base:   everything else. Uppercase letters stay forced shadow (v1 rule).
    """
    H, W = len(canvas), len(canvas[0])

    def m_at(x, y):
        return _mat(canvas[y][x], materials) if 0 <= x < W and 0 <= y < H else None

    res = [[None] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            ch = canvas[y][x]
            if ch == ".":
                continue
            if ch in "ke":
                res[y][x] = "outline"
                continue
            if ch == "w":
                res[y][x] = "white"
                continue
            m = _mat(ch, materials)
            if m is None:
                res[y][x] = "outline"
                continue
            if ch.isupper():
                res[y][x] = (m, "shadow")
                continue
            x0 = x
            while m_at(x0 - 1, y) == m:
                x0 -= 1
            x1 = x
            while m_at(x1 + 1, y) == m:
                x1 += 1
            width = x1 - x0 + 1
            rel = (x - x0) / max(1, width - 1)
            y0 = y
            while m_at(x, y0 - 1) == m:
                y0 -= 1
            height = 1
            while m_at(x, y0 + height) == m:
                height += 1
            bottom = m_at(x, y + 1) != m
            if m_at(x + 1, y) != m and width > 1:
                tone = "shadow"
            elif bottom and height >= 3:
                tone = "shadow"
            elif width >= 6 and rel > 0.75:
                tone = "shadow"
            elif m in HI_OK and m_at(x, y - 1) != m and rel <= 0.5:
                tone = "hi"
            elif m in HI_OK and width >= 4 and x == x0:
                tone = "hi"
            else:
                tone = "base"
            res[y][x] = (m, tone)
    return res


def tone_canvas(char, direction, H=32, W=16):
    """The head tone map for a direction as a full 32x16 char grid ('.' = keep)."""
    grid = [["."] * W for _ in range(H)]
    spec = char.get("polish", {}).get("tones", {}).get(direction)
    if not spec:
        return grid
    top, rows = spec
    for dy, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch != " ":
                grid[top + dy][x] = ch
    return grid


def apply(keys, v1_keys, canvas, tones):
    """Apply tone overrides and the eye iris accent. Never touches alpha.
    `keys` is shade_v3 output; `v1_keys` the v1 shader's, used for KEEP_V1."""
    H, W = len(keys), len(keys[0])
    out = [r[:] for r in keys]
    for y in range(H):
        for x in range(W):
            v1 = v1_keys[y][x]
            if isinstance(v1, tuple) and (v1[0] in KEEP_V1 or (v1[0] == "s" and tones[y][x] not in TONE)):
                out[y][x] = v1  # kept materials, and skin outside the face map (hands)
            key = out[y][x]
            t = tones[y][x]
            if isinstance(key, tuple) and t in TONE:
                out[y][x] = (key[0], TONE[t])
            # iris: the upper pixel of a 2-tall open eye
            if canvas[y][x] == "e" and y + 1 < H and canvas[y + 1][x] == "e":
                out[y][x] = EYE_IRIS
    return out


def rows(top, text):
    """A tone map: rows of 16 chars, '.' = keep the shader's tone."""
    lines = [r.strip("|") for r in text.strip("\n").splitlines() if r.strip()]
    lines = [r.strip().strip("|") for r in lines]
    for r in lines:
        if len(r) != 16:
            raise ValueError(f"tone row {r!r} is {len(r)} wide")
    return (top, lines)


# ---------------------------------------------------------------- player
# Rows mirror the v1 PLAYER_BOY head letters (shown on the right for
# reference). ^ hi  - base  v shadow  . keep
PLAYER = {
    "tones": {
        "down": rows(10, """
            ....^^^--v......
            ...^^^----vv....
            ..^--......-vv..
            ..^--......-vv..
            ..^-------vvvv..
            .vvvvvvvvvvvvvv.
            .-vvvvvvvvvvvvv.
            .-v^-.----.-vvv.
            .-v--.----.-vvv.
            ..^----------v..
            ...----..--vv...
            .....--vvvv.....
        """),
        "up": rows(10, """
            .....^^^--v.....
            ...^^^^----vv...
            ..^^-------vvv..
            ..^-------vvvv..
            ..----vvvv-vvv..
            .-v--vvvvvvvvvv.
            .--v--v--v--vvv.
            .^^v^^v^-v-vvvv.
            .-^-v--v^-v-vvv.
            ..--v--v--vvvv..
            ...vv.-vvv.vv...
            ......vvvv......
        """),
        "left": rows(10, """
            ......^^^--v....
            ....^^^-----vv..
            ...^...-----vv..
            ...^...-----vv..
            ...^------vvvvv.
            .-vvvvvvvv--vvv.
            ...vvvv-^^^--vv.
            ...-.---v-^--vv.
            ...-.---v---vv..
            ..-------v--vv..
            ...-.---v-vv....
            ....--vvvv......
        """),
    },
}
