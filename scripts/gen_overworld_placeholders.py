"""Base overworld tiles (ids 0-23) + the sample Tiled test maps.

Everything here is drawn from scratch (CC0). Output:
  frontend/public/maps/{test_town,test_route,test_house}.json   Tiled JSON

The tile grids below (build_tiles) are painted into
frontend/public/maps/tilesets/overworld.png by scripts/overworld_art, which
also appends the newer tiles and draws every actor sprite sheet.

Re-run is idempotent. Usage: python3 scripts/gen_overworld_placeholders.py
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MAPS = ROOT / "frontend" / "public" / "maps"
T = 16

# ---- art helpers ---------------------------------------------------------
# Every tile / frame is a hand-authored character grid. Each character is
# looked up in a palette; "." means "leave whatever is underneath" (the base
# grid for overlay tiles, transparent for stand-alone ones). Light comes from
# the top-left; objects carry a 1px outline in a dark shade of their own hue.

def rgb(h):
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)

def pal(**kw):
    return {k: rgb(v) for k, v in kw.items()}

# GBA-style material ramps: highlight / base / shade / outline
P_GRASS = pal(l="#b0e070", g="#78c850", d="#58a840", D="#387838")
P_TALL = pal(L="#a8e068", M="#68b848", K="#408838", D="#285828")
P_PATH = pal(T="#f8e8b0", t="#e0c888", u="#c0a068", U="#907048")
P_WATER = pal(X="#f8fcff", W="#b8e0f8", w="#78b8f0", v="#5090e0")
P_LEAF = pal(a="#88d058", b="#40a048", c="#287838", o="#184828")
P_TRUNK = pal(n="#c08048", m="#885030", N="#583018")
P_FLOWER = pal(r="#f04840", R="#a82830", y="#f8e048", Y="#c89828", e="#ffffff", E="#c8c8d8")
P_WALL = pal(L="#fff8e8", h="#f0e0c0", H="#d0b890", q="#987858")
P_STONE = pal(S="#c8c8d0", s="#9898a8", k="#606078")
P_WOOD = pal(n="#d09058", m="#a06838", N="#704828", Q="#482c1c")
P_ROOF = pal(R="#f08868", r="#d05040", p="#a03030", P="#681c28", F="#f8f0e0", f="#c8b8a0")
P_GLASS = pal(G="#e0f4ff", B="#88c0f0", b="#5890d8")
P_KNOB = pal(y="#f8d848", Y="#b88828")
P_FLOOR = pal(F="#f8e0b0", f="#e0c088", e="#c09860", E="#987040")
P_IWALL = pal(A="#f8f0f8", a="#e0d8f0", c="#c0b0d8", n="#d09058", m="#a06838", N="#704828", Q="#482c1c")
P_RUG = pal(M="#f07060", m="#d04040", K="#982830", Z="#f8d060", z="#c89838")
P_ROCK = pal(S="#e0e0e8", s="#a8a8b8", k="#787890", K="#484860")
P_MAIL = pal(r="#e85048", R="#b03030", P="#701c24", W="#f8f8f8")

def merge(*ps):
    out = {}
    for p in ps:
        out.update(p)
    return out

def check(grid, w=16, h=16):
    assert len(grid) == h, (len(grid), grid)
    for row in grid:
        assert len(row) == w, (len(row), row)
    return grid

def paint(img, ox, oy, grid, palette, w=16, h=16):
    check(grid, w, h)
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch == ".":
                continue
            img.putpixel((ox + x, oy + y), palette[ch])

def shifted(grid, dx):
    """Rotate every row right by dx (used for the 2nd water frame)."""
    return [row[-dx:] + row[:-dx] for row in grid]

# ---- tileset -------------------------------------------------------------
# local ids: 0 grass 1 path 2 tree 3 treetop 4 waterA 5 waterB 6 flowerA
# 7 flowerB 8 wall 9 roof 10 door 11 floor 12 ledge 13 sign 14 tallgrass
# 15 intwall 16 mat | new: 17 fence 18 bush 19 roof-left 20 roof-right
# 21 mailbox 22 rock 23 window
(GRASS, PATH, TREE, TOP, WA, WB, FA, FB, WALL, ROOF, DOOR, FLOOR, LEDGE, SIGN, TALL, IWALL, MAT,
 FENCE, BUSH, ROOF_L, ROOF_R, MAILBOX, ROCK, WINDOW) = range(24)

GRASS_G = [
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gglgggggggggggll",
    "gdgdggggggggggdg",
    "ggdgggggglgggggg",
    "gggggggggdgdgggg",
    "gggggggggggdgggg",
    "gggggggggggggggg",
    "gggglggggggggggg",
    "gggdgdgggggggggg",
    "ggggdggggggglggg",
    "ggggggggggggdgdg",
    "gglgggggggggggdg",
    "gdgdgggggggggggg",
    "ggdggggggggggggg",
    "gggggggggggggggg",
]

TALL_G = [
    "gggDgggggggDgggg",
    "gDgLDgDggDgLDgDg",
    "DLDLMDLDDLDLMDLD",
    "LMDMKDMKLMDMKDMK",
    "MKDKKDKKMKDKKDKK",
    "KKKKKKKKKKKKKKKK",
    "DKKKDKKDDKKKDKKD",
    "gDDLDDDDgDDLDDDD",
    "DgDLMDgLDgDLMDgL",
    "MDLMKDLDMDLMKDLD",
    "KDMKKDMMKDMKKDMM",
    "KDKKKDKKKDKKKDKK",
    "KKKKKKKKKKKKKKKK",
    "KKKDDKKKKKKDDKKK",
    "DDDggDDDDDDggDDD",
    "gggggggggggggggg",
]

PATH_G = [
    "tttttttttttttttt",
    "tttttttttttTuttt",
    "ttTutttttttuUttt",
    "ttuUtttttttttttt",
    "tttttttttttttttt",
    "tttttttuttttttut",
    "tttttttttttttttt",
    "tutttttttttttttt",
    "tttttttttTuttttt",
    "tttttttttuUUtttt",
    "tttttttttttttttt",
    "ttttTutttttttttt",
    "ttttuUttttttuttt",
    "tttttttttttttttt",
    "tttttttttttttTut",
    "ttuttttttttttuUt",
]

WATER_G = [
    "wwwwwwwwwwwwwwww",
    "wwWWWwwwwwwwwwww",
    "wWwwwvwwwwwwwwww",
    "wwwwwwwwwwwwwXww",
    "wwwwwwwwwwWWWwww",
    "wwwwwwwwwWwwwvww",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwwWWWwwwwwwww",
    "wwwwWwwwvwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wXwwwwwwwwwwwwww",
    "wwwwwwwwwwwwWWWw",
    "wwwwwwwwwwwWwwwv",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
]

TREE_G = [
    "gggoccccccccoggg",
    "ggocbaaabbbbcogg",
    "gobaaaaabbbbbcog",
    "gobaaaabbbbbccog",
    "obaaabbbcbbbbcco",
    "obbbbbbcabbbccco",
    "ocbbbbccbbbbccco",
    "obcabbbbbaabccco",
    "obbbbbbbbbbbccco",
    "goccbbbbbbbcccog",
    "ggoocccccccccogg",
    "ggggoooNNoooogdg",
    "ggggggNnmNdddggg",
    "ggggggNnmNddgggg",
    "gggggNnnmmNdgggg",
    "ggggddNNNNddgggg",
]

TOP_G = [
    "................",
    "................",
    "......oooo......",
    "....ooaabboo....",
    "...oaaaabbbbo...",
    "..oaaaabbbbbco..",
    "..obaabbbbbbco..",
    ".obbbbbbcbbbbco.",
    ".obbbbbccbbbcco.",
    ".ocbbbcabbbbcco.",
    ".obaabbbbaabcco.",
    ".obbbbbbbbbbcco.",
    "..ocbbbbbbbccco.",
    "..obbbbbbbbbcco.",
    "..obbbbbbbbbbco.",
    "..obbbbbbbbbbbo.",
]

FLOWER_A = [
    "................",
    "................",
    "...r............",
    "..ryr...........",
    "...R............",
    "..........e.....",
    ".........eye....",
    "..........E.....",
    "................",
    "................",
    "....e...........",
    "...eye.......r..",
    "....E.......ryr.",
    ".............R..",
    "................",
    "................",
]

FLOWER_B = [
    "................",
    "................",
    "..r.r...........",
    "...y............",
    "..R.R...........",
    ".........e.e....",
    "..........y.....",
    ".........E.E....",
    "................",
    "................",
    "...e.e..........",
    "....y...........",
    "...E.E......r.r.",
    ".............y..",
    "............R.R.",
    "................",
]

WALL_G = [
    "qqqqqqqqqqqqqqqq",
    "HHHHHHHHHHHHHHHH",
    "hhhhhhhhhhhhhhhh",
    "hhhhhhhhhhhhhhhh",
    "HHHHHHHHHHHHHHHH",
    "LLLLLLLLLLLLLLLL",
    "hhhhhhhhhhhhhhhh",
    "hhhhhhhhhhhhhhhh",
    "HHHHHHHHHHHHHHHH",
    "LLLLLLLLLLLLLLLL",
    "hhhhhhhhhhhhhhhh",
    "hhhhhhhhhhhhhhhh",
    "qqqqqqqqqqqqqqqq",
    "SSSSkSSSSSSSkSSS",
    "ssssksssssssksss",
    "kkkkkkkkkkkkkkkk",
]

DOOR_G = [
    "................",
    "..QQQQQQQQQQQQ..",
    "..QnnnnnnnnnnQ..",
    "..QnmmmmmmmmNQ..",
    "..QnmNNNNNNnNQ..",
    "..QnmNmmmmmnNQ..",
    "..QnmNmmmmmnNQ..",
    "..QnmnnnnnnnNQ..",
    "..QnmmmmmmmmNQ..",
    "..QnmmmmmmyYNQ..",
    "..QnmNNNNNNnNQ..",
    "..QnmNmmmmmnNQ..",
    "..QnmNmmmmmnNQ..",
    "..QnmnnnnnnnNQ..",
    "..QNNNNNNNNNNQ..",
    "kkQQQQQQQQQQQQkk",
]

WINDOW_G = [
    "................",
    "................",
    "................",
    "...qqqqqqqqqq...",
    "...qLLLLLLLLq...",
    "...qLGBLHGBHq...",
    "...qLBBLHBBHq...",
    "...qLLLLLLLHq...",
    "...qLGBLHGBHq...",
    "...qLBbLHBbHq...",
    "...qHHHHHHHHq...",
    "...qqqqqqqqqq...",
    "................",
    "................",
    "................",
    "................",
]

ROOF_G = [
    "RRRRRRRpRRRRRRRp",
    "rrrrrrrprrrrrrrp",
    "rrrrrrrprrrrrrrp",
    "PPPPPPPPPPPPPPPP",
    "RRRpRRRRRRRpRRRR",
    "rrrprrrrrrrprrrr",
    "rrrprrrrrrrprrrr",
    "PPPPPPPPPPPPPPPP",
    "RRRRRRRpRRRRRRRp",
    "rrrrrrrprrrrrrrp",
    "rrrrrrrprrrrrrrp",
    "PPPPPPPPPPPPPPPP",
    "RRRpRRRRRRRpRRRR",
    "rrrprrrrrrrprrrr",
    "rrrprrrrrrrprrrr",
    "PPPPPPPPPPPPPPPP",
]

ROOF_L_G = [
    "....PPPPPPPPPPPP",
    "...PFRRRRRRpRRRR",
    "..PFfrrrrrrprrrr",
    ".PFfPPPPPPPPPPPP",
    "PFfRRRRRRRRpRRRR",
    "PFfrrrrrrrrprrrr",
    "PFfrrrrrrrrprrrr",
    "PFfPPPPPPPPPPPPP",
    "PFfRRRRpRRRRRRRp",
    "PFfrrrrprrrrrrrp",
    "PFfrrrrprrrrrrrp",
    "PFfPPPPPPPPPPPPP",
    "PFfRRRRRRRRpRRRR",
    "PFfrrrrrrrrprrrr",
    "PFfprrrrrrrprrrr",
    "PPPPPPPPPPPPPPPP",
]

LEDGE_G = [
    "gggggggggggggggg",
    "gglggggggggggggg",
    "gdgdgggggggglggg",
    "ggdgggggggggdgdg",
    "gggggggggggggdgg",
    "gggggggggggggggg",
    "llllllllllllllll",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "dddddddddddddddd",
    "DDDDDDDDDDDDDDDD",
    "uuutuuuuuuutuuuu",
    "UUUUuUUUUUUUuUUU",
    "DDDDDDDDDDDDDDDD",
    "dddddddddddddddd",
    "gggggggggggggggg",
]

SIGN_G = [
    "................",
    "................",
    "..QQQQQQQQQQQQ..",
    "..QnnnnnnnnnnQ..",
    "..QnmmmmmmmmNQ..",
    "..QnmNNNNNmmNQ..",
    "..QnmmmmmmmmNQ..",
    "..QnmNNNNmmmNQ..",
    "..QnmmmmmmmmNQ..",
    "..QNNNNNNNNNNQ..",
    "..QQQQQQQQQQQQ..",
    "......QnNQdd....",
    "......QnNQdd....",
    "......QnNQd.....",
    "......QmNQd.....",
    ".....dQQQQd.....",
]

FLOOR_G = [
    "FFFFFFFFFFFFFFFF",
    "fffffEffffffffff",
    "fffffEffffffffff",
    "EEEEEEEEEEEEEEEE",
    "FFFFFFFFFFFFFFFF",
    "ffffffffffffEfff",
    "ffeeffffffffEfff",
    "EEEEEEEEEEEEEEEE",
    "FFFFFFFFFFFFFFFF",
    "ffEfffffffffffff",
    "ffEffffffffeefff",
    "EEEEEEEEEEEEEEEE",
    "FFFFFFFFFFFFFFFF",
    "fffffffffEffffff",
    "fffffffffEffffff",
    "EEEEEEEEEEEEEEEE",
]

IWALL_G = [
    "AAAaAAAaAAAaAAAa",
    "AAAaAAAaAAAaAAAa",
    "AcAaAcAaAcAaAcAa",
    "AAAaAAAaAAAaAAAa",
    "AAAaAAAaAAAaAAAa",
    "AAAaAAAaAAAaAAAa",
    "AAAaAcAaAAAaAcAa",
    "AAAaAAAaAAAaAAAa",
    "aaaaaaaaaaaaaaaa",
    "QQQQQQQQQQQQQQQQ",
    "nnnnnnnnnnnnnnnn",
    "mmmmmmmNmmmmmmmN",
    "mmmmmmmNmmmmmmmN",
    "mmmmmmmNmmmmmmmN",
    "NNNNNNNNNNNNNNNN",
    "QQQQQQQQQQQQQQQQ",
]

MAT_G = [
    "................",
    "................",
    "................",
    ".KKKKKKKKKKKKKK.",
    ".KZZZZZZZZZZZzK.",
    ".KZMMMMMMMMMmzK.",
    ".KZMmmmmmmmmmzK.",
    ".KZMmZZmmZZmmzK.",
    ".KZMmZZmmZZmmzK.",
    ".KZMmmmmmmmmmzK.",
    ".KZmmmmmmmmmmzK.",
    ".KzzzzzzzzzzzzK.",
    ".KKKKKKKKKKKKKK.",
    "..Z.Z.Z.Z.Z.Z...",
    "................",
    "................",
]

FENCE_G = [
    "................",
    "................",
    "......QQQQ......",
    ".....QnnnNQ.....",
    ".....QnmmNQ.....",
    "QQQQQQnmmNQQQQQQ",
    "nnnnnQnmmNQnnnnn",
    "mmmmmQnmmNQmmmmm",
    "QQQQQQnmmNQQQQQQ",
    "dddddQnmmNQddddd",
    "QQQQQQnmmNQQQQQQ",
    "nnnnnQnmmNQnnnnn",
    "mmmmmQnmmNQmmmmm",
    "QQQQQQnmmNQQQQQQ",
    "dddddQnmmNQddddd",
    "....ddQQQQdd....",
]

BUSH_G = [
    "................",
    "................",
    ".....oooooo.....",
    "...ooaaabbboo...",
    "..oaaaabbbbbbo..",
    ".oaaaabbbbbbbco.",
    ".oabbbbbbcbbbco.",
    "obbbbbbccbbbbcco",
    "obbaabbbbbaabcco",
    "obbbbbbbbbbbccco",
    "ocbbbccbbbbcccco",
    ".occbbbbbbcccco.",
    ".occcccccccccco.",
    "..oooooooooooo..",
    "..dddddddddddd..",
    "................",
]

ROCK_G = [
    "................",
    "................",
    "................",
    "................",
    "......KKKK......",
    "....KKSSSsKK....",
    "...KSSSSsssskK..",
    "..KSSSSsssssskK.",
    "..KSSsssssskkkK.",
    ".KSssssssskkkkK.",
    ".KsssssKsskkkkK.",
    ".KssssKsskkkkkK.",
    "..KkkkkkkkkkkK..",
    "...KKKKKKKKKKdd.",
    "....ddddddddd...",
    "................",
]

MAILBOX_G = [
    "................",
    "................",
    "....PPPPPPP.....",
    "...PrrrrrrRP.P..",
    "..PrrrrrrrrRPWP.",
    "..PrrrrrrrrRPWP.",
    "..PrWWWWWWrRPPP.",
    "..PrrrrrrrrRP...",
    "..PRRRRRRRRRP...",
    "..PPPPPPPPPPP...",
    "......QnNQdd....",
    "......QnNQdd....",
    "......QnNQd.....",
    "......QnNQd.....",
    "......QmNQd.....",
    ".....dQQQQd.....",
]

def build_tiles():
    """Return [(base_grid, overlay_grid, palette, transparent_base)] in tile-id order."""
    on_grass = lambda g, p: (GRASS_G, g, merge(P_GRASS, p))
    on_wall = lambda g, p: (WALL_G, g, merge(P_WALL, P_STONE, p))
    roof_r = [row[::-1].translate(str.maketrans("Ff", "fF")) for row in ROOF_L_G]
    return [
        (GRASS_G, None, P_GRASS),
        (PATH_G, None, P_PATH),
        (TREE_G, None, merge(P_GRASS, P_LEAF, P_TRUNK)),
        (None, TOP_G, P_LEAF),
        (WATER_G, None, P_WATER),
        (shifted(WATER_G, 3), None, P_WATER),
        on_grass(FLOWER_A, P_FLOWER),
        on_grass(FLOWER_B, P_FLOWER),
        (WALL_G, None, merge(P_WALL, P_STONE)),
        (ROOF_G, None, P_ROOF),
        on_wall(DOOR_G, merge(P_WOOD, P_KNOB)),
        (FLOOR_G, None, P_FLOOR),
        (LEDGE_G, None, merge(P_GRASS, P_PATH)),
        on_grass(SIGN_G, P_WOOD),
        (None, TALL_G, merge(P_GRASS, P_TALL)),
        (IWALL_G, None, P_IWALL),
        (FLOOR_G, MAT_G, merge(P_FLOOR, P_RUG)),
        on_grass(FENCE_G, P_WOOD),
        on_grass(BUSH_G, P_LEAF),
        (None, ROOF_L_G, P_ROOF),
        (None, roof_r, P_ROOF),
        on_grass(MAILBOX_G, merge(P_MAIL, P_WOOD)),
        on_grass(ROCK_G, P_ROCK),
        on_wall(WINDOW_G, P_GLASS),
    ]

# ---- maps ----------------------------------------------------------------
OW_FIRST, COL_FIRST = 1, 100  # firstgid of the two tilesets
SOLID, L_DOWN, L_LEFT, L_RIGHT, L_UP = (COL_FIRST + i for i in range(5))

def prop(name, value):
    t = "bool" if isinstance(value, bool) else "int" if isinstance(value, int) else "string"
    return {"name": name, "type": t, "value": value}

class MapBuilder:
    def __init__(self, w, h, base_tile):
        self.w, self.h = w, h
        self.ground = [OW_FIRST + base_tile] * (w * h)
        self.decor = [0] * (w * h)
        self.objects = [0] * (w * h)
        self.above = [0] * (w * h)
        self.collision = [0] * (w * h)
        self.groups = {k: [] for k in ("encounters", "warps", "triggers", "npcs", "signs")}
        self.props = []
        self._oid = 1

    def i(self, x, y):
        return y * self.w + x

    def put(self, layer, x, y, local, col=None):
        if 0 <= x < self.w and 0 <= y < self.h:
            getattr(self, layer)[self.i(x, y)] = OW_FIRST + local if local is not None else 0
            if col:
                self.collision[self.i(x, y)] = col

    def fill(self, layer, x0, y0, x1, y1, local, col=None):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.put(layer, x, y, local, col)

    def block(self, x, y, col=SOLID):
        self.collision[self.i(x, y)] = col

    def obj(self, group, name, x, y, w=1, h=1, point=False, **props):
        o = {"id": self._oid, "name": name, "type": "", "rotation": 0, "visible": True,
             "x": x * T, "y": y * T, "width": 0 if point else w * T, "height": 0 if point else h * T,
             "properties": [prop(k, v) for k, v in props.items()]}
        if point:
            o["point"] = True
        self._oid += 1
        self.groups[group].append(o)

    def tilelayer(self, lid, name, data):
        return {"id": lid, "name": name, "type": "tilelayer", "width": self.w, "height": self.h,
                "x": 0, "y": 0, "opacity": 1, "visible": True, "data": data}

    def build(self):
        layers = [self.tilelayer(1, "ground", self.ground), self.tilelayer(2, "decor", self.decor),
                  self.tilelayer(3, "objects", self.objects), self.tilelayer(4, "above", self.above),
                  self.tilelayer(5, "collision", self.collision)]
        for n, name in enumerate(("encounters", "warps", "triggers", "npcs", "signs")):
            layers.append({"id": 6 + n, "name": name, "type": "objectgroup", "draworder": "topdown",
                           "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": self.groups[name]})
        anim = lambda a, b: [{"id": a, "animation": [{"tileid": a, "duration": 500}, {"tileid": b, "duration": 500}]}]
        # tall grass: rows 9-15 are drawn again over an actor standing in it
        tiles = anim(WA, WB) + anim(FA, FB) + [{"id": TALL, "properties": [prop("cover", 9)]}]
        return {"compressionlevel": -1, "type": "map", "version": "1.10", "tiledversion": "1.10.2",
                "orientation": "orthogonal", "renderorder": "right-down", "infinite": False,
                "width": self.w, "height": self.h, "tilewidth": T, "tileheight": T,
                "nextlayerid": 11, "nextobjectid": self._oid, "layers": layers,
                "tilesets": [
                    {"firstgid": OW_FIRST, "name": "overworld", "image": "tilesets/overworld.png",
                     "imagewidth": 128, "imageheight": 48, "tilewidth": T, "tileheight": T,
                     "columns": 8, "tilecount": 24, "margin": 0, "spacing": 0, "tiles": tiles},
                    {"firstgid": COL_FIRST, "name": "collision", "tilewidth": T, "tileheight": T,
                     "columns": 0, "tilecount": 5, "margin": 0, "spacing": 0}],
                "properties": [prop(k, v) for k, v in self.props]}

def say(*texts):
    return json.dumps([{"op": "say", "text": t} for t in texts])

def town():
    m = MapBuilder(30, 20, GRASS)
    m.props = [("connect_north", "test_route"), ("connect_north_offset", 5), ("border", str(TREE))]
    # border trees (gap at x=14,15 on the top row for the route connection)
    for x in range(30):
        if x not in (14, 15):
            m.put("objects", x, 0, TREE, SOLID)
        m.put("objects", x, 19, TREE, SOLID)
    for y in range(1, 19):
        for x in (0, 1, 28, 29):
            m.put("objects", x, y, TREE, SOLID)
    m.fill("ground", 14, 0, 15, 19, PATH)
    m.fill("ground", 5, 10, 24, 10, PATH)
    # house: roof in the above layer (player walks behind it), wall + door in objects
    m.fill("above", 4, 3, 8, 4, ROOF)
    m.fill("objects", 4, 5, 8, 5, WALL)
    m.put("objects", 6, 5, DOOR)
    m.fill("ground", 6, 6, 6, 10, PATH)
    for x in range(4, 9):
        for y in range(3, 6):
            m.block(x, y)
    m.block(6, 5, 0)
    m.obj("warps", "house_door", 6, 5, kind="door", targetMap="test_house", targetX=5, targetY=6,
          facing="up", transition="iris", enterDir="up")
    # pond (animated water)
    m.fill("ground", 20, 13, 25, 17, WA, SOLID)
    # flowers
    for fx, fy in ((9, 13), (10, 13), (9, 14), (11, 16), (12, 14)):
        m.put("decor", fx, fy, FA)
    # ledge row: hop south from y=14 to y=16
    for x in range(3, 11):
        m.put("decor", x, 15, LEDGE, L_DOWN)
    # a free-standing tree with an above-player canopy
    m.put("objects", 11, 5, TREE, SOLID)
    m.put("above", 11, 4, TOP)
    # tall grass + encounter zone (data only in Phase 1)
    m.fill("decor", 2, 11, 6, 13, TALL)
    m.obj("encounters", "grass_a", 2, 11, 5, 3, table="test_grass")
    # NPCs
    m.obj("npcs", "sage", 12, 12, point=True, sprite="npc", facing="down",
          script=json.dumps([
              {"op": "say", "text": "Hello, trainer! This is a test town. Walk behind the roof, hop the ledge, try the pond."},
              {"op": "setFlag", "flag": "met_sage"}]))
    m.obj("npcs", "guard", 17, 6, point=True, sprite="npc", facing="left",
          script=json.dumps([
              {"op": "requireFlag", "flag": "met_sage", "else": [{"op": "say", "text": "Go talk to the sage first."}]},
              {"op": "say", "text": "Ah, you met the sage. The route north is open."}]))
    m.block(12, 12)
    m.block(17, 6)
    # sign
    m.put("objects", 16, 9, SIGN, SOLID)
    m.obj("signs", "welcome", 16, 9, text="TEST TOWN. Hold X to run. North: Test Route.")
    # triggers: step, enter (once), flag
    m.obj("triggers", "glow", 20, 10, 2, 1, when="step", once=True,
          script=json.dumps([{"op": "say", "text": "You stepped on a glowing tile."}, {"op": "setFlag", "flag": "crossed_glow"}]))
    m.obj("triggers", "welcome_enter", 0, 0, when="enter", once=True, script=say("Welcome to the test map."))
    m.obj("triggers", "after_glow", 0, 0, when="flag", flag="crossed_glow", once=True,
          script=say("(The glow fades.)"))
    return m.build()

def route():
    m = MapBuilder(20, 30, GRASS)
    m.props = [("connect_south", "test_town"), ("connect_south_offset", -5), ("border", str(TREE))]
    for y in range(30):
        for x in (0, 1, 18, 19):
            m.put("objects", x, y, TREE, SOLID)
    for x in range(20):
        m.put("objects", x, 0, TREE, SOLID)
        if x not in (9, 10):
            m.put("objects", x, 29, TREE, SOLID)
    m.fill("ground", 9, 0, 10, 29, PATH)
    m.fill("decor", 3, 5, 7, 9, TALL)
    m.obj("encounters", "grass_r", 3, 5, 5, 5, table="test_grass")
    for y in (12, 16, 20):
        m.fill("decor", 4, y, 8, y, LEDGE)
        for x in range(4, 9):
            m.block(x, y, L_DOWN)
    return m.build()

def house():
    m = MapBuilder(10, 8, FLOOR)
    m.fill("objects", 0, 0, 9, 1, IWALL, SOLID)
    for y in range(8):
        for x in (0, 9):
            m.put("objects", x, y, IWALL, SOLID)
    for x in range(10):
        m.put("objects", x, 7, IWALL, SOLID)
    m.put("ground", 5, 6, MAT)
    m.block(5, 7, 0)
    m.put("objects", 5, 7, MAT)
    m.obj("warps", "exit", 5, 7, kind="door", targetMap="test_town", targetX=6, targetY=6,
          facing="down", transition="iris", enterDir="down")
    m.obj("npcs", "host", 3, 3, point=True, sprite="npc", facing="down",
          script=say("Welcome in! Stand on the mat and go down to leave."))
    m.block(3, 3)
    return m.build()

def main():
    # The tileset (ids 0-23 drawn from build_tiles() above, the rest added on)
    # and every actor sheet now come from scripts/overworld_art:
    #   python3 -m scripts.overworld_art.build_all
    for name, data in (("test_town", town()), ("test_route", route()), ("test_house", house())):
        (MAPS / f"{name}.json").write_text(json.dumps(data, indent=1) + "\n")
    print("ok")

if __name__ == "__main__":
    main()
