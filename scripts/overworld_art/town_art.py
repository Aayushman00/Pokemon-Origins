"""Art for the towns and routes past Mossgate: biome ground, solid terrain masses,
small props, and buildings cut to the size each layout asks for.

Tile names: t_<biome>_<part>, m_<mass>_<shape>, o_<prop>, lava_<mask>_<frame>,
bld_<town>_<n>_<col>_<row>. Biomes are original palettes under docs/design/ART_BIBLE.md.
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw

from .buildings import HEART, STAR
from .gym_art import disc, ring, speck
from functools import lru_cache

from .slice_art import T, _outline, edge_colour, leaf_mass, rgb
from .tiles import Tile, rng
from .world_palette import LINE, WORLD, outline_for, outline_for

LAYOUTS = {t["id"]: t for t in json.loads((Path(__file__).parent / "town_layouts.json").read_text(encoding="utf8"))}
BUILT_TOWNS = ("hearthfield", "ironbrook", "saltmere", "dynamo", "gale", "starfall", "emberhold", "zenith")

BIOMES = {  # ground ramp, road ramp, plaza ramp
    "hills": (["#d6c88e", "#cabc80", "#b8aa74"], ["#c8b080", "#b49c70", "#9c8660"], ["#c4bcb0", "#aea698", "#968e84"]),
    "sand": (["#f4e6bc", "#ecdcac", "#dcc898"], ["#e0c898", "#ceb484", "#b49c70"], ["#d8d0c0", "#c4bcac", "#aca498"]),
    "concrete": (["#c8ccd2", "#bcc2c8", "#acb2ba"], ["#8c929c", "#7c828c", "#6c727c"], ["#a4acb8", "#949ca8", "#7c8494"]),
    "cliff": (["#e4e8ec", "#d8dee6", "#c8d0dc"], ["#c4ccd8", "#b0bac8", "#98a4b8"], ["#f0f2f6", "#dce2ea", "#c0cad8"]),
    "slate": (["#7f8eae", "#7584a4", "#687898"], ["#a8a4b4", "#9490a4", "#7c788c"], ["#8c84b4", "#7c74a4", "#686090"]),
    "basalt": (["#6e666a", "#645c62", "#544c54"], ["#8c7468", "#7c6458", "#685248"], ["#7c7474", "#6c6466", "#5a5258"]),
    "marble": (["#f2eef2", "#e8e2ec", "#d8d2e0"], ["#e8dcc0", "#d8c8a4", "#c0ae88"], ["#fff8e4", "#f4e8c4", "#dcc898"]),
}
MASSES = {  # top ramp (hi, base, lo), face ramp
    "rock": (["#b8aca0", "#a09488", "#847870"], ["#8c8078", "#6e625c", "#544a48"]),
    "field": (["#ecc868", "#dcb048", "#b88c38"], ["#c8a040", "#a07c34", "#7c5e2c"]),
    "plant": (["#7c8494", "#6c7484", "#5a6272"], ["#d8b048", "#5a6272", "#3c4252"]),
    "mountain": (["#8c9cc0", "#7484ac", "#5c6c94"], ["#64749c", "#4c5a80", "#384468"]),
    "basalt": (["#4c4448", "#3e363c", "#302a30"], ["#403a42", "#302a32", "#241e28"]),
}


def ground(biome, n):
    ramp = BIOMES[biome][0]
    t = Tile(fill=ramp[1])
    speck(t, 900 + n * 31 + len(biome), 7 + n, [ramp[0], ramp[0], ramp[2]])
    return t


def road(biome):
    ramp = BIOMES[biome][1]
    t = Tile(fill=ramp[1])
    speck(t, 700 + len(biome), 12, [ramp[0], ramp[2]])
    return t


def plaza(biome):
    ramp = BIOMES[biome][2]
    t = Tile(fill=ramp[0])
    for x0, y0, x1, y1 in ((0, 0, 7, 7), (8, 8, 15, 15)):
        t.rect(x0, y0, x1, y1, ramp[1])
    t.rect(0, 15, 15, 15, ramp[2])
    t.rect(15, 0, 15, 15, ramp[2])
    t.rect(7, 0, 7, 15, ramp[2])
    t.rect(0, 7, 15, 7, ramp[2])
    return t


def stairs(biome, ew):
    ramp = BIOMES[biome][2]
    t = Tile(fill=ramp[0])
    for k in range(0, 16, 4):
        if ew:
            t.rect(k + 2, 0, k + 3, 15, ramp[2])
            t.rect(k + 1, 0, k + 1, 15, ramp[1])
        else:
            t.rect(0, k + 2, 15, k + 3, ramp[2])
            t.rect(0, k + 1, 15, k + 1, ramp[1])
    return t


CRAGGY = ("rock", "mountain", "basalt")  # natural cliffs; field and plant keep their own faces


def _sides(t, name, e, w, y0=0, y1=15):
    """Plateau sides seen edge-on: the west catches the light, the east is in shade."""
    top, face = MASSES[name]
    if w:
        t.rect(0, y0, 0, y1, outline_for(face))
        t.rect(1, y0, 1, y1, face[0])
        t.rect(2, y0, 2, y1, top[0])
    if e:
        t.rect(13, y0, 14, y1, face[2])
        t.rect(15, y0, 15, y1, outline_for(face))


# Half-buried stones on a plateau top, (cx, cy, r) in a 32px block that wraps.
RUBBLE = [(5, 5, 3.5), (20, 3, 2.5), (27, 12, 3), (12, 15, 4), (3, 24, 2.5), (21, 24, 3.5), (30, 30, 2), (13, 29, 2)]


@lru_cache(None)
def _rubble(name):
    """32x32 stone-strewn ground that tiles: stones share the ground's mid
    tone, so only their lit tops and shaded feet show, as if half buried."""
    top, face = MASSES[name]
    img = Image.new("RGBA", (32, 32), (*rgb(top[1]), 255))
    ramp = [top[0], top[1], top[2], face[1], face[2]]
    leaf_mass(img, RUBBLE, [ramp] * len(RUBBLE), wrap=True, bumps=.35, caps=False)
    return img


def mass_top(name, n, e, w, phase=(0, 0)):
    """Plateau surface. Open sides show a rim: a hard edge with a lit lip
    inside it on the north (back) side, side strips east and west. Natural
    cliffs carry rubble that runs across a 2x2 block of tiles (`phase`)."""
    top, face = MASSES[name]
    t = Tile(fill=top[1])
    if name in CRAGGY:
        t.paste(_rubble(name).crop((phase[0] * T, phase[1] * T, phase[0] * T + T, phase[1] * T + T)))
    speck(t, 300 + len(name) + 7 * (phase[0] + 2 * phase[1]), 10, [top[0], top[2]])
    if name == "field":
        for x in range(1, 16, 3):
            t.rect(x, 2 + x % 5, x, 8 + x % 5, top[0])
            t.set(x, 1 + x % 5, top[2])
    if name == "plant":
        ring(t, 1, 1, 14, 14, top[2])
    _sides(t, name, e, w)
    if n:
        t.rect(0, 0, 15, 0, outline_for(face))
        t.rect(3 if w else 0, 1, 12 if e else 15, 1, top[0])
    return t


def mass_face(name, e, w, variant=0):
    """The south face, one tile tall: the plateau's lit lip (rows 0-2), shade
    under it, two courses of rock blocks, a dark base line. The ground below
    gets mass_shadow. Joints between courses sit on fixed rows so strata run
    on across tiles; `variant` reseeds where the blocks crack."""
    top, face = MASSES[name]
    t = Tile(fill=face[1])
    r = rng(500 + len(name) + 97 * variant)
    if name in CRAGGY:
        t.rect(0, 0, 15, 1, top[1])
        t.rect(0, 2, 15, 2, top[0])
        t.rect(0, 3, 15, 3, face[2])
        for y0, y1 in ((4, 8), (10, 12)):  # two courses of rock
            x = -r(4)
            while x < 16:
                x1 = x + 3 + r(5)
                bottom = y1 - r(2)  # each block ends at its own height: no ruled joint
                t.rect(max(0, x), bottom + 1, min(15, x1), bottom + 1, face[2])
                t.rect(max(0, x + 1), y0, min(15, x + 2), y0, face[0])  # lit top-left of the block
                if x1 < 16:
                    t.rect(x1, y0, x1, bottom, face[2])  # crack to the next block
                x = x1
        t.rect(0, 14, 15, 14, face[2])
    else:
        for x in range(0, 16, 3):
            h = 4 + r(7)
            t.rect(x, 0, x, h, face[0])
            t.rect(x + 1, h, x + 1, 15, face[2])
        if name == "plant":
            t = Tile(fill=face[1])
            for x in range(0, 16, 8):
                t.rect(x, 0, x + 3, 2, face[0])
                t.rect(x + 4, 0, x + 7, 2, face[2])
            t.rect(0, 6, 15, 7, face[2])
        t.rect(0, 14, 15, 14, face[2])
    _sides(t, name, e, w)
    t.rect(0, 15, 15, 15, outline_for(face))
    return t


def lava(frame, mask):
    """mask: N=1 E=2 S=4 W=8 marks sides with shore. Molten centre, cooled crust at the shore."""
    t = Tile(fill="#e84c24")
    for x, y, n in ((1, 2, 5), (9, 5, 4), (3, 9, 6), (10, 12, 4)):
        x = (x + frame * 4) % 16
        t.rect(x, y, min(x + n, 15), y + 1, "#f8a038")
        t.rect(x + 1, y, min(x + n - 1, 15), y, "#fce070")
    for bit, box in ((1, (0, 0, 15, 2)), (2, (13, 0, 15, 15)), (4, (0, 13, 15, 15)), (8, (0, 0, 2, 15))):
        if mask & bit:
            t.rect(*box, "#302a30")
    for bit, box in ((1, (0, 3, 15, 3)), (2, (12, 0, 12, 15)), (4, (0, 12, 15, 12)), (8, (3, 0, 3, 15))):
        if mask & bit:
            t.rect(*box, "#a82c20")
    return t


def sky(n):
    t = Tile(fill="#8cc4f0")
    speck(t, 41 + n, 3, ["#b0d8f6"])
    if n:
        t.rect(3, 7, 9, 8, "#ffffff")
        t.rect(5, 6, 8, 6, "#ffffff")
    return t


def drop(biome):
    ramp = BIOMES[biome][0]
    t = Tile(fill="#8cc4f0")
    t.rect(0, 0, 15, 5, "#7c8cb0")
    t.rect(0, 0, 15, 1, ramp[2])
    for x in range(0, 16, 4):
        t.rect(x, 6, x + 1, 8 + x % 3, "#7c8cb0")
    return t


def plank(vertical):
    wood = WORLD["wood"]
    t = Tile(fill=wood[1])
    for k in range(3, 16, 4):
        if vertical:
            t.rect(0, k, 15, k, wood[2])
        else:
            t.rect(k, 0, k, 15, wood[2])
    return t


# Props that stand on the ground: ringed by an outline, raised clear of the tile
# foot and given a contact shadow. Sky props are ringed but cast nothing on the
# sky. Rails and wire join tile to tile and stay as drawn.
STANDING = ("scarecrow", "statue", "post", "net", "buoy", "container", "boulder", "brazier", "shrub", "palm", "pylon",
            "crag", "spire")
SKY = ("column", "float")


def ring_outline(img):
    """A 1px outline outside the shape, in each neighbour's material outline.
    Unlike _outline it keeps the fill, so 1-2px posts and wires survive."""
    src, out = img.load(), img.copy()
    dst = out.load()
    for y in range(T):
        for x in range(T):
            if src[x, y][3]:
                continue
            near = [src[x + dx, y + dy] for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1))
                    if 0 <= x + dx < T and 0 <= y + dy < T and src[x + dx, y + dy][3] == 255]
            if near:
                dst[x, y] = (*rgb(edge_colour("#%02x%02x%02x" % near[0][:3], {(1, 0), (0, 1)})), 255)
    return out


def prop(draw, stand=True, shadow=True):
    t = Tile()
    draw(t)
    if stand:
        from .nature import _cast
        lift = max(0, t.img.getbbox()[3] - (T - 3)) if shadow else 0  # outline row + two shadow rows
        img = Image.new("RGBA", (T, T))
        img.alpha_composite(t.img.crop((0, lift, T, T)))
        img = ring_outline(img)
        if shadow:
            _cast(img)
        t.img, t.px = img, img.load()
    return t


def p_scarecrow(t):
    t.rect(7, 4, 8, 15, "#84603f")
    t.rect(2, 6, 13, 7, "#84603f")
    disc(t, 8, 3, 2, "#ecd9a8")
    t.rect(4, 0, 11, 1, "#a87044")
    t.rect(5, 7, 10, 11, "#b85a46")


def p_statue(t):
    t.rect(3, 12, 12, 15, "#88869c")
    t.rect(5, 4, 10, 12, "#aeacb8")
    disc(t, 8, 3, 3, "#d4d2d4")


def p_post(t):
    t.rect(6, 2, 9, 15, "#a87044")
    t.rect(6, 2, 7, 15, "#d09a60")
    t.rect(4, 6, 11, 7, "#ecd9a8")
    t.rect(4, 10, 11, 11, "#ecd9a8")


def p_net(t):
    t.rect(1, 2, 2, 15, "#84603f")
    t.rect(13, 2, 14, 15, "#84603f")
    t.rect(1, 2, 14, 3, "#a87044")
    for k in range(3, 13, 3):
        t.rect(k, 4, k, 13, "#d2c2aa")
    for k in range(5, 14, 3):
        t.rect(3, k, 12, k, "#d2c2aa")


def p_buoy(t):
    disc(t, 8, 9, 4, "#e84a3c")
    t.rect(4, 8, 12, 9, "#fbf2dc")
    t.rect(7, 2, 8, 6, "#88869c")


def p_container(t):
    t.rect(0, 2, 15, 15, "#4c78b0")
    t.rect(0, 2, 15, 3, "#74a0d4")
    for x in range(2, 15, 3):
        t.rect(x, 4, x, 14, "#3a5c8c")
    t.rect(0, 15, 15, 15, "#2e4460")


def p_steel_rail(t):
    t.rect(5, 0, 10, 15, "#5e6880")
    t.rect(6, 0, 7, 15, "#a4acb8")
    for y in (3, 11):
        t.rect(5, y, 10, y + 1, "#f4c848")


def p_rail(t):
    t.rect(7, 0, 8, 15, "#7c8cb0")
    t.rect(6, 0, 6, 15, "#d4dcec")
    for y in (2, 9):
        t.rect(3, y, 12, y + 1, "#a4b4d0")


def p_boulder(t):
    disc(t, 8, 9, 6, "#c8d0dc")
    disc(t, 7, 8, 4, "#e4e8ec")
    t.rect(3, 14, 12, 14, "#98a4b8")


def p_brazier(t):
    t.rect(7, 9, 8, 15, "#6c5c58")
    t.rect(4, 7, 11, 9, "#8c7c70")
    disc(t, 8, 5, 3, "#f07828")
    disc(t, 8, 5, 1, "#f8d048")


def p_shrub(t):
    from .nature import bush_body
    t.paste(bush_body())


def p_palm(t):
    """Ringed trunk leaning right as it rises, fronds drooping from the crown."""
    leaf, bark = WORLD["leaf"], WORLD["bark"]
    for y in range(7, 15):
        x = 6 + (14 - y) // 4
        t.rect(x, y, x + 2, y, bark[2] if y % 3 == 0 else bark[1])
        t.set(x, y, bark[0])
    d, cx, cy = ImageDraw.Draw(t.img), 9, 5
    for dx, dy in ((-7, 3), (6, 4), (-5, -2), (5, -3), (-1, -5)):
        tip = (cx + dx, cy + dy)
        mid = (cx + dx * .6, cy + dy * .6 - 1)
        d.line([(cx, cy + 1), mid, (tip[0], tip[1] + 1)], fill=rgb(leaf[3]), width=2)
        d.line([(cx, cy), mid, tip], fill=rgb(leaf[1]), width=2)
    disc(t, cx, cy, 1, leaf[0])


def p_pylon(t):
    """Lattice mast: two splayed legs, cross braces, an arm with glass insulators."""
    steel = EXTRA_RAMPS["steel"]
    d = ImageDraw.Draw(t.img)
    for y0, y1 in ((5, 9), (9, 14)):
        x0, x1 = 6 - (y0 - 2) // 4, 9 + (y0 - 2) // 4
        d.line([(x0, y0), (x1 + 1, y1)], fill=rgb(steel[2]))
        d.line([(x1, y0), (x0 - 1, y1)], fill=rgb(steel[2]))
    d.line([(6, 2), (3, 14)], fill=rgb(steel[1]), width=2)
    d.line([(9, 2), (12, 14)], fill=rgb(steel[2]), width=2)
    t.rect(2, 4, 13, 5, steel[1])
    t.rect(2, 4, 13, 4, steel[0])
    for x in (2, 13):
        t.rect(x, 6, x, 7, "#68dce0")


def outcrop(t, name, stones, ramp=None):
    """Stones (cx, cy, r) in a mass's own tones (or `ramp`), lit top-left, back to front."""
    top, face = MASSES[name]
    img = Image.new("RGBA", (T, T))
    ramp = ramp or [top[0], top[1], top[2], face[1], face[2]]
    leaf_mass(img, stones, [ramp] * len(stones), bumps=.35, caps=False)
    t.paste(img)


def p_crag(t):
    """A tall stone leaning on two low ones."""
    outcrop(t, "mountain", [(8, 6, 3.5), (5, 10, 3.5), (11, 10, 3)])


def p_spire(t):
    """A cooled basalt stack standing out of the lava."""
    outcrop(t, "basalt", [(8, 3, 2.5), (7, 7, 3.5), (9, 11, 4)], ["#8c7c78", "#6c5c58", "#4c4448", "#3e363c", "#241e28"])
    for x, y in ((12, 12), (12, 13), (11, 14), (10, 14)):  # lava light on the shaded foot
        if t.img.getpixel((x, y))[3]:
            t.set(x, y, "#c8643c")


def p_column(t):
    t.rect(5, 3, 10, 12, "#f2eef2")
    t.rect(9, 3, 10, 12, "#c8c0d0")
    t.rect(4, 2, 11, 2, "#f4d870")
    t.rect(4, 13, 11, 13, "#d8d2e0")


def p_float(t):
    disc(t, 8, 7, 5, "#c8d0dc")
    t.rect(4, 11, 11, 12, "#7c8cb0")
    t.rect(6, 13, 9, 13, "#7c8cb0")


def p_wheatstack(t):
    for i in range(6):
        t.rect(5 - i // 2, 3 + i * 2, 10 + i // 2, 4 + i * 2, "#f4d870" if i % 2 else "#dcb048")


def p_emblem(t):
    t.rect(0, 0, 15, 15, "#f0f2f6")
    ring(t, 0, 0, 15, 15, "#98a4b8")
    for i in range(6):
        t.rect(7 - i, 4 + i, 8 + i, 4 + i, "#4c84c8")


def p_stone(t):
    disc(t, 8, 8, 5, "#aeacb8")
    disc(t, 7, 7, 3, "#d4d2d4")


def p_wire(t):
    t.rect(0, 5, 15, 5, "#3c4252")
    t.rect(0, 9, 15, 9, "#3c4252")


def two_tall(colors, glow):
    """A lamp on a post: (top, base). Lit colours differ per town."""
    def top(t):
        t.rect(5, 6, 10, 13, colors[0])
        ring(t, 4, 5, 11, 14, LINE)
        t.rect(6, 8, 9, 11, glow)
        t.rect(6, 3, 9, 4, colors[1])

    def stem(t):
        t.rect(7, 0, 8, 12, colors[1])
        t.rect(5, 13, 10, 15, colors[0])
    return prop(top, False), prop(stem, False)


def p_pylon_top(t):
    t.rect(7, 4, 8, 15, "#7c8494")
    t.rect(2, 6, 13, 7, "#a4acb8")
    t.set(2, 5, "#68dce0")
    t.set(13, 5, "#68dce0")


def p_pylon_base(t):
    t.rect(6, 0, 9, 13, "#7c8494")
    t.rect(4, 13, 11, 15, "#5e6880")
    t.rect(5, 3, 10, 4, "#f4c848")


PROPS = {"scarecrow": p_scarecrow, "statue": p_statue, "post": p_post, "net": p_net, "buoy": p_buoy,
         "container": p_container, "steel_rail": p_steel_rail, "rail": p_rail, "boulder": p_boulder, "brazier": p_brazier,
         "shrub": p_shrub, "palm": p_palm, "pylon": p_pylon, "crag": p_crag, "spire": p_spire, "column": p_column,
         "float": p_float, "wheatstack": p_wheatstack, "emblem": p_emblem, "stone": p_stone, "wire": p_wire,
         "pylon_top": p_pylon_top, "pylon_base": p_pylon_base}


# ---------------------------------------------------------------- buildings
GLYPHS = {
    "heart": HEART, "star": STAR,
    "loaf": ["..xxx..", ".xxxxx.", "xxxxxxx", "xxxxxxx", "......."],
    "fist": [".xxxx..", "xxxxxx.", "xxxxxx.", ".xxxxx.", "..xxx.."],
    "wave": ["...xx..", "..x..x.", ".x.....", "xxxxxxx", "......."],
    "bolt": ["...xx..", "..xx...", ".xxxxx.", "...xx..", "..xx..."],
    "wing": ["x......", "xx.....", "xxxx...", ".xxxxx.", "...xxxx"],
    "eye": ["..xxx..", ".x...x.", "x..x..x", ".x...x.", "..xxx.."],
    "flame": ["...x...", "..xx...", ".xxxx..", ".xxxxx.", "..xxx.."],
    "crown": ["x..x..x", "xx.x.xx", "xxxxxxx", "xxxxxxx", "......."],
    "book": ["xxx.xxx", "x.x.x.x", "xxx.xxx", "xxx.xxx", "......."],
}
GYM_LOOK = {  # roof ramp, wall ramp, glyph
    "hearthfield": ("roof_clay", "wall", "loaf"), "ironbrook": ("roof_slate", "wall", "fist"),
    "saltmere": ("roof_sky", "wall", "wave"), "dynamo": ("steel", "steel_wall", "bolt"),
    "gale": ("pale", "pale_wall", "wing"), "starfall": ("night", "night_wall", "eye"),
    "emberhold": ("forge", "forge_wall", "flame"), "zenith": ("gold", "marble", "crown"),
}
EXTRA_RAMPS = {
    "steel": ["#c4ccd8", "#8c94a8", "#6c7488", "#4c5468", "#343a4c"], "steel_wall": ["#c8ccd2", "#a4acb8", "#7c8494", "#5a6272"],
    "pale": ["#ffffff", "#dce2ee", "#b4c0d8", "#7c8cb0", "#5c6c94"], "pale_wall": ["#f8fafc", "#e4e8f0", "#c0cad8", "#98a4b8"],
    "night": ["#a890f0", "#6c58c0", "#4c3c98", "#342878", "#201c50"], "night_wall": ["#8c84b4", "#6c64a4", "#504888", "#3a3478"],
    "forge": ["#6c5c58", "#4c4448", "#3e363c", "#302a30", "#241e28"], "forge_wall": ["#7c6c64", "#5a5258", "#403a42", "#302a30"],
    "gold": ["#fff4c0", "#f4d870", "#dcb048", "#b88c38", "#7c5e2c"], "marble": ["#ffffff", "#f2eef2", "#d8d2e0", "#b0a8bc"],
}
ramp_of = lambda name: EXTRA_RAMPS.get(name) or WORLD[name]


def plate(d, cx, cy, glyph, colour):
    d.rectangle((cx - 6, cy - 4, cx + 6, cy + 4), fill=LINE)
    d.rectangle((cx - 5, cy - 3, cx + 5, cy + 3), fill=WORLD["wall"][0])
    for y, row in enumerate(GLYPHS[glyph]):
        for x, c in enumerate(row):
            if c == "x":
                d.point((cx - 3 + x, cy - 2 + y), fill=colour)


def shell(cols, rows, roof_name, wall_name, door, windows, glass=False, chimney=None, bottom_door=True):
    """A building `cols` x `rows` tiles, the two-plane roof of slice_art.building at any height."""
    roof, wall, stone, wood = ramp_of(roof_name), ramp_of(wall_name), WORLD["stone"], WORLD["wood"]
    W, H = cols * T, rows * T
    wt = H - {3: 26, 4: 30}.get(rows, 34)
    img = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(img)
    d.rectangle((5, wt, W - 6, H - 3), fill=wall[1])
    d.rectangle((5, wt, 8, H - 3), fill=wall[0])
    d.rectangle((W - 11, wt, W - 6, H - 3), fill=wall[2])
    for y in range(wt + 7, H - 8, 6):
        d.line((9, y, W - 12, y), fill=wall[2])
    d.rectangle((5, H - 8, W - 6, H - 3), fill=stone[2])
    d.line((5, H - 8, W - 6, H - 8), fill=stone[1])
    d.rectangle((5, wt + 2, W - 6, wt + 4), fill=wall[3])
    for y in range(5, wt):
        t = (y - 5) / max(wt - 5, 1)
        outer, inner = round(9 - 8 * t), round(15 - 6 * t)
        d.line((outer, y, inner - 1, y), fill=roof[0])
        d.line((W - inner, y, W - 1 - outer, y), fill=roof[3])
        band = (y - 5) // 6
        d.line((inner, y, W - 1 - inner, y), fill=roof[1] if band < 3 else roof[2])
        if (y - 5) % 6 == 5:
            d.line((inner, y, W - 1 - inner, y), fill=roof[3])
    d.rectangle((1, wt, W - 2, wt + 1), fill=roof[4])
    d.line((9, 4, W - 10, 4), fill=roof[0])
    if chimney is not None:
        x = chimney * T + 6
        d.rectangle((x, 0, x + 8, 13), fill=stone[1])
        d.rectangle((x, 0, x + 2, 13), fill=stone[0])
        d.rectangle((x - 1, 0, x + 9, 2), fill=stone[3])
    for col in windows:
        x, y = col * T + 3, H - 24
        d.rectangle((x - 1, y - 1, x + 10, y + 9), fill=LINE)
        d.rectangle((x, y, x + 9, y + 8), fill=WORLD["glass"][1])
        d.rectangle((x, y, x + 4, y + 3), fill=WORLD["glass"][0])
        d.line((x + 5, y, x + 5, y + 8), fill=WORLD["wall"][1])
    if door is not None and bottom_door:
        dx = door * T
        d.rectangle((dx + 2, H - 26, dx + 13, H - 3), fill=LINE)
        if glass:
            d.rectangle((dx + 3, H - 25, dx + 7, H - 3), fill=WORLD["glass"][1])
            d.rectangle((dx + 8, H - 25, dx + 12, H - 3), fill=WORLD["glass"][2])
        else:
            d.rectangle((dx + 3, H - 25, dx + 12, H - 3), fill=wood[1])
            d.rectangle((dx + 3, H - 25, dx + 4, H - 3), fill=wood[0])
            d.rectangle((dx + 11, H - 25, dx + 12, H - 3), fill=wood[2])
            d.rectangle((dx + 5, H - 22, dx + 10, H - 19), fill=WORLD["glass"][1])
        d.rectangle((dx, H - 2, dx + 15, H - 1), fill=stone[1])
    return img, d, wt


def awning(d, x0, x1, y, colour):
    for x in range(x0, x1 + 1):
        d.line((x, y, x, y + 4), fill=colour if (x - x0) // 3 % 2 == 0 else WORLD["wall"][0])
    d.line((x0, y + 5, x1, y + 5), fill=WORLD["wall"][3])


def service(kind, cols, rows, door):
    roof = "roof_rose" if kind == "C" else "roof_sky"
    win = [c for c in (1, cols - 2) if c != door]
    img, d, wt = shell(cols, rows, roof, "wall", door, win, glass=True)
    colour = ramp_of(roof)[2]
    awning(d, 7, cols * T - 8, wt + 6, colour)
    plate(d, door * T + 8, max(wt - 5, 7), "heart" if kind == "C" else "star", colour)
    return _outline(img)


def home(town_roof, cols, rows, door, seed):
    win = [c for c in range(1, cols - 1) if c != door][:2]
    img, _, _ = shell(cols, rows, town_roof, "wall", door, win, chimney=(cols - 2 if seed % 2 else 1))
    return _outline(img)


def tutor(cols, rows, door):
    img, d, wt = shell(cols, rows, "roof_moss", "wall", door, [c for c in range(1, cols - 1) if c != door][:1])
    plate(d, cols * T // 2 + 4, max(wt - 5, 7), "book", ramp_of("roof_moss")[3])
    return _outline(img)


def gym_building(town, cols, rows, door):
    roof, wall, glyph = GYM_LOOK[town]
    colour = ramp_of(roof)[3]
    win = [c for c in (1, 2, cols - 3, cols - 2) if c != door and c > 0]
    img, d, wt = shell(cols, rows, roof, wall, door, win, chimney=1 if town == "hearthfield" else None, bottom_door=town != "saltmere")
    W, H = cols * T, rows * T
    cx = W // 2
    if town == "hearthfield":
        awning(d, 5, W - 6, H - 16, "#e07828")
    if town == "ironbrook":
        for x in (1, W - 6):  # upswept eaves
            d.rectangle((x, wt - 3, x + 4, wt - 1), fill=ramp_of(roof)[3])
        d.rectangle((door * T - 12, wt + 8, door * T - 5, H - 8), fill="#c84048")
        d.rectangle((door * T + 21, wt + 8, door * T + 28, H - 8), fill="#c84048")
    if town == "saltmere":  # stilts in the water, and the deck door on the north side
        for x in range(10, W - 8, 18):
            d.rectangle((x, H - 6, x + 3, H - 1), fill=WORLD["wood"][2])
        dx = door * T
        d.rectangle((dx, 0, dx + 15, 15), fill=WORLD["wood"][2])
        d.rectangle((dx + 3, 2, dx + 12, 15), fill=LINE)
        d.rectangle((dx + 4, 3, dx + 11, 15), fill="#f7c850")
    if town == "dynamo":
        for x in range(8, W - 8, 14):
            d.rectangle((x, 8, x + 5, wt - 4), fill="#343a4c")
            d.rectangle((x + 1, 9, x + 4, 12), fill="#68dce0")
        for x in range(6, W - 6, 8):
            d.rectangle((x, H - 8, x + 3, H - 6), fill="#f4c848")
    if town == "gale":
        d.polygon([(cx - 18, wt), (cx, 0), (cx + 18, wt)], fill=ramp_of(roof)[1])
        d.polygon([(cx, 0), (cx + 18, wt), (cx, wt)], fill=ramp_of(roof)[3])
        d.line((cx, 0, cx, 3), fill="#4c84c8")
    if town == "starfall":
        d.rectangle((0, 0, W, wt - 1), fill=(0, 0, 0, 0))
        d.pieslice((3, 1, W - 4, wt * 2 + 8), 180, 360, fill=ramp_of(roof)[2])
        d.pieslice((3, 1, W // 2, wt * 2 + 8), 180, 270, fill=ramp_of(roof)[1])
        d.rectangle((cx - 3, 2, cx + 3, wt - 2), fill="#201c50")
        d.point((cx, 6), fill="#f4e8a0")
        d.point((cx - 1, 10), fill="#f4e8a0")
    if town == "emberhold":
        for x in range(0, W, 32):
            d.rectangle((x, 0, x + 15, 15), fill=ramp_of(roof)[1])
            d.rectangle((x + 2, 0, x + 13, 2), fill=ramp_of(roof)[0])
        for x in (door * T - 14, door * T + 24):
            d.rectangle((x, wt + 8, x + 6, H - 10), fill="#f07828")
            d.rectangle((x + 2, wt + 10, x + 4, H - 12), fill="#f8d048")
    if town == "zenith":
        for x in range(14, W - 12, 24):
            d.rectangle((x, wt + 2, x + 5, H - 8), fill="#ffffff")
            d.rectangle((x + 4, wt + 2, x + 5, H - 8), fill="#d8d2e0")
        d.polygon([(cx - 40, wt), (cx, 2), (cx + 40, wt)], fill="#f4d870")
        d.polygon([(cx - 30, wt - 1), (cx, 8), (cx + 30, wt - 1)], fill="#fff4c0")
    plate(d, door * T + 8, H - 34 if rows > 3 else wt + 2, glyph, colour)
    return _outline(img)


def windmill():
    img = Image.new("RGBA", (48, 48))
    d = ImageDraw.Draw(img)
    d.polygon([(14, 47), (18, 16), (30, 16), (34, 47)], fill=WORLD["wall"][1])
    d.polygon([(26, 16), (30, 16), (34, 47), (28, 47)], fill=WORLD["wall"][2])
    d.pieslice((16, 8, 32, 24), 180, 360, fill=WORLD["roof_clay"][2])
    d.rectangle((21, 36, 27, 47), fill=WORLD["wood"][2])
    for a, b in (((24, 15), (6, 3)), ((24, 15), (42, 3)), ((24, 15), (6, 27)), ((24, 15), (42, 27))):
        d.line((*a, *b), fill=WORLD["wood"][1], width=2)
        d.line((b[0], b[1], (a[0] + b[0]) // 2, (a[1] + b[1]) // 2 + 2), fill=WORLD["wall"][0], width=3)
    return _outline(img)


def great_dome(cols, rows):
    W, H = cols * T, rows * T
    img = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(img)
    d.rectangle((6, H - 26, W - 7, H - 3), fill="#504888")
    d.rectangle((6, H - 26, 12, H - 3), fill="#6c64a4")
    d.pieslice((2, 2, W - 3, 2 * (H - 26)), 180, 360, fill="#c8ccf4")
    d.pieslice((2, 2, W // 2, 2 * (H - 26)), 180, 270, fill="#e8ecff")
    d.polygon([(W // 2 - 9, H - 28), (W // 2 + 2, 3), (W // 2 + 12, H - 28)], fill="#201c50")
    d.line((W // 2 - 3, H - 34, W // 2 + 24, 8), fill="#a4acb8", width=3)
    return _outline(img)


def forge_pit(cols, rows):
    W, H = cols * T, rows * T
    img = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(img)
    d.rectangle((4, 8, W - 5, H - 3), fill="#403a42")
    d.rectangle((4, 8, W - 5, 11), fill="#6c5c58")
    d.rectangle((12, 18, W - 13, H - 12), fill="#e84c24")
    d.rectangle((18, 24, W - 19, H - 18), fill="#f8a038")
    d.rectangle((28, 30, W - 29, H - 24), fill="#fce070")
    for x in (10, W - 16):
        d.rectangle((x, 0, x + 6, 10), fill="#302a30")
    return _outline(img)


def regions(rows, chars=None):
    """Rectangular bounding boxes of connected same-label cells: [(label, x0, y0, x1, y1)]."""
    cells = {(x, y): c for y, r in enumerate(rows) for x, c in enumerate(r) if c != " " and (chars is None or c in chars)}
    out = []
    while cells:
        (x, y), label = next(iter(cells.items()))
        stack, group = [(x, y)], []
        while stack:
            p = stack.pop()
            if cells.get(p) != label:
                continue
            del cells[p]
            group.append(p)
            stack += [(p[0] + 1, p[1]), (p[0] - 1, p[1]), (p[0], p[1] + 1), (p[0], p[1] - 1)]
        xs, ys = [p[0] for p in group], [p[1] for p in group]
        out.append((label, min(xs), min(ys), max(xs), max(ys)))
    return sorted(out, key=lambda b: (b[2], b[1]))


def town_buildings(town):
    """[(name, x0, y0, image)] for every building in the layout."""
    t = LAYOUTS[town]
    doors = {(d["x"], d["y"]) for d in t["doors"]}
    roof = {"hearthfield": "roof_clay", "ironbrook": "roof_slate", "saltmere": "roof_sky", "dynamo": "roof_slate",
            "gale": "roof_slate", "starfall": "roof_rose", "emberhold": "roof_clay", "zenith": "roof_slate"}[town]
    out = []
    for n, (label, x0, y0, x1, y1) in enumerate(regions(t["bgrid"])):
        cols, rows = x1 - x0 + 1, y1 - y0 + 1
        door = next((x - x0 for x, y in doors if x0 <= x <= x1 and y0 <= y <= y1), cols // 2)
        if label in "CM":
            img = service(label, cols, rows, door)
        elif label == "G":
            img = gym_building(town, cols, rows, door)
        elif label == "V":
            img = tutor(cols, rows, door)
        else:
            img = home(roof, cols, rows, door, n)
        out.append((f"bld_{town}_{n}", x0, y0, img))
    if town == "hearthfield":
        out.append(("bld_hearthfield_mill", 24, 1, windmill()))
    if town == "starfall":
        out.append(("bld_starfall_dome", 11, 1, great_dome(8, 5)))
    if town == "emberhold":
        out.append(("bld_emberhold_forge", 2, 12, forge_pit(6, 5)))
    return out


def town_tiles():
    """[(name, Tile|Image)] in a fixed order."""
    out = []
    for biome in BIOMES:
        out += [(f"t_{biome}_ground{n}", ground(biome, n)) for n in range(4)]
        out += [(f"t_{biome}_road", road(biome)), (f"t_{biome}_plaza", plaza(biome)),
                (f"t_{biome}_stairs_ns", stairs(biome, False)), (f"t_{biome}_stairs_ew", stairs(biome, True)),
                (f"t_{biome}_drop", drop(biome))]
    for name in MASSES:
        for mask in range(8):
            out.append((f"m_{name}_t{mask}", mass_top(name, mask & 1, mask & 2, mask & 4)))
        for mask in range(4):
            out.append((f"m_{name}_f{mask}", mass_face(name, mask & 1, mask & 2)))
    for mask in range(16):
        for frame in (0, 1):
            out.append((f"lava_{mask}_{frame}", lava(frame, mask)))
    out += [("sky0", sky(0)), ("sky1", sky(1)), ("plank_h", plank(False)), ("plank_n", plank(True))]
    out += [(f"o_{k}", prop(v, k in STANDING + SKY, k in STANDING)) for k, v in PROPS.items()]
    for name, cols, glow in (("star", ("#504888", "#6c64a4"), "#f4e8a0"), ("lantern", ("#88869c", "#aeacb8"), "#fff4c0")):
        top, stem = two_tall(cols, glow)
        out += [(f"o_{name}_top", top), (f"o_{name}_base", stem)]
    for town in BUILT_TOWNS:
        for name, _, _, img in town_buildings(town):
            for r in range(img.height // T):
                for c in range(img.width // T):
                    out.append((f"{name}_{c}_{r}", img.crop((c * T, r * T, (c + 1) * T, (r + 1) * T))))
    return out
