"""Turn layered text-grid pixel art into shaded 16x32 RGBA frames.

Grid alphabet (one char = one pixel):
  .  transparent (layer below shows through)
  _  force transparent (erases lower layers)
  k  outline colour          e  eye (outline colour)      w  pure white
  lowercase material letter  auto-shaded from its ramp
  UPPERCASE material letter  forced to that ramp's shadow tone
  j / q                      forced highlight of hair / hat (gloss marks)

Materials (mapped to palette ramps per character):
  s skin  h hair  c hat  x hat/hair accent  t top  u inner shirt/collar
  a sleeve  f forearm  b bottom (hips/skirt)  l lower leg  n shoes
  p pack/prop  g glasses/extra  m mouth

Pipeline: stack layers -> auto outline (4-neighbour) -> shade -> despeckle
-> palette.
Light comes from the top-left:
  * a pixel whose right or lower neighbour is another material -> shadow
  * the right quarter of any run 6+ px wide -> shadow (gives volume)
  * the top edge of a run, left half -> highlight
  * hair and hats also get a gloss band one row below their top edge,
    across the left/centre of the run (the "richer hair shading")
"""
from PIL import Image

from .palette import OUTLINE, RAMPS, WHITE

W, H = 16, 32
MATERIALS = set("shcxtuafblnpgm")


def grid(top, text):
    """A layer: (top_row, [rows]). Rows are stripped; each must be 16 wide."""
    rows = [r.strip() for r in text.strip("\n").splitlines() if r.strip()]
    for r in rows:
        if len(r) != W:
            raise ValueError(f"row {r!r} is {len(r)} wide, expected {W}")
    return (top, rows)


def mirror(layer):
    top, rows = layer
    return (top, [r[::-1] for r in rows])


def swap(layer, table):
    """Replace characters in a layer, e.g. {'u': 't'} for a back view."""
    top, rows = layer
    return (top, ["".join(table.get(c, c) for c in r) for r in rows])


def stack(*layers):
    canvas = [["."] * W for _ in range(H)]
    for layer in layers:
        if layer is None:
            continue
        top, rows = layer
        for dy, row in enumerate(rows):
            y = top + dy
            if not 0 <= y < H:
                continue
            for x, ch in enumerate(row):
                if ch == ".":
                    continue
                canvas[y][x] = "." if ch == "_" else ch
    return canvas


def outline(canvas):
    out = [row[:] for row in canvas]
    for y in range(H):
        for x in range(W):
            if canvas[y][x] != ".":
                continue
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < W and 0 <= ny < H and canvas[ny][nx] not in ".k":
                    out[y][x] = "k"
                    break
    return out


def blink(canvas):
    """Close the eyes: the upper pixel of each 2-tall eye becomes skin."""
    out = [row[:] for row in canvas]
    for y in range(H - 1):
        for x in range(W):
            if canvas[y][x] == "e" and canvas[y + 1][x] == "e":
                out[y][x] = "s"
    return out


GLOSS = {"j": "h", "q": "c"}
GLOSSY = {"h", "c"}


def _mat(ch):
    if ch in "ke.w_":
        return None
    if ch in GLOSS:
        return GLOSS[ch]
    low = ch.lower()
    return low if low in MATERIALS else None


def shade(canvas):
    """Return a grid of (material, tone) / literal colour keys."""
    res = [[None] * W for _ in range(H)]

    def m_at(x, y):
        if 0 <= x < W and 0 <= y < H:
            return _mat(canvas[y][x])
        return None

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
            if ch in GLOSS:
                res[y][x] = (GLOSS[ch], "hi")
                continue
            m = ch.lower()
            if ch.isupper():
                res[y][x] = (m, "shadow")
                continue
            if m_at(x + 1, y) != m or m_at(x, y + 1) != m:
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
            if width >= 6 and rel > 0.75:
                res[y][x] = (m, "shadow")
                continue
            if m_at(x, y - 1) != m and rel <= 0.5:
                res[y][x] = (m, "hi")
                continue
            if (m in GLOSSY and width >= 6 and m_at(x, y - 1) == m and m_at(x, y - 2) != m
                    and 0.15 <= rel <= 0.6):
                res[y][x] = (m, "hi")
                continue
            res[y][x] = (m, "base")
    return res


def despeckle(res):
    """No orphan pixels: a tone pixel with no same-tone 8-neighbour takes the
    most common tone of its same-material neighbours (cleaner clusters)."""
    out = [r[:] for r in res]
    for y in range(H):
        for x in range(W):
            key = res[y][x]
            if not isinstance(key, tuple):
                continue
            near = [res[y + dy][x + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1)
                    if (dx or dy) and 0 <= x + dx < W and 0 <= y + dy < H]
            if key in near:
                continue
            same = [k for k in near if isinstance(k, tuple) and k[0] == key[0]]
            if same:
                # sorted(): ties must not depend on Python's per-process hash seed
                out[y][x] = max(sorted(set(same)), key=same.count)
    return out


def resolve(shaded, mats):
    """Map shaded keys to hex colours using a character's material map."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = img.load()
    for y in range(H):
        for x in range(W):
            key = shaded[y][x]
            if key is None:
                continue
            if key == "outline":
                col = OUTLINE
            elif key == "white":
                col = WHITE
            else:
                m, tone = key
                ramp = ramp_for(mats, m)
                col = {"hi": ramp[0], "base": ramp[-2] if len(ramp) > 1 else ramp[0], "shadow": ramp[-1]}[tone]
            px[x, y] = hex_rgba(col)
    return img


def ramp_for(mats, m):
    spec = mats.get(m)
    if spec is None:
        raise KeyError(f"material {m!r} has no ramp in this character")
    if spec.startswith("#"):
        return [spec]
    name, _, n = spec.partition(":")
    ramp = RAMPS[name]
    if n:  # "red:2" keeps only base + shadow to save palette slots
        ramp = ramp[-int(n):]
    return ramp


def hex_rgba(h):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


def render(layers, mats, *, closed_eyes=False):
    canvas = stack(*layers)
    if closed_eyes:
        canvas = blink(canvas)
    return resolve(despeckle(shade(outline(canvas))), mats)
