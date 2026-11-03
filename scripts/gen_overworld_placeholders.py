"""Generate the Phase 1 original placeholder art + sample Tiled maps.

Everything here is drawn from scratch with flat colours (CC0). Output:
  frontend/public/maps/tilesets/overworld.png   16x16 tiles, 8 columns
  frontend/public/sprites/overworld/{player,npc}.png   16x32 frames, 3 cols x 4 rows
  frontend/public/maps/{test_town,test_route,test_house}.json   Tiled JSON

Re-run is idempotent. Usage: python scripts/gen_overworld_placeholders.py
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MAPS = ROOT / "frontend" / "public" / "maps"
SPRITES = ROOT / "frontend" / "public" / "sprites" / "overworld"
T = 16

# ---- tileset -------------------------------------------------------------
# local ids: 0 grass 1 path 2 tree 3 treetop 4 waterA 5 waterB 6 flowerA
# 7 flowerB 8 wall 9 roof 10 door 11 floor 12 ledge 13 sign 14 tallgrass
# 15 intwall 16 mat
GRASS, PATH, TREE, TOP, WA, WB, FA, FB, WALL, ROOF, DOOR, FLOOR, LEDGE, SIGN, TALL, IWALL, MAT = range(17)

def tile(draw, ox, oy, fn):
    fn(lambda x, y, c: draw.point((ox + x, oy + y), fill=c))

def make_tileset():
    cols, rows = 8, 3
    img = Image.new("RGBA", (cols * T, rows * T), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    g1, g2 = (96, 168, 72, 255), (80, 148, 60, 255)
    def grass(p):
        for y in range(T):
            for x in range(T):
                p(x, y, g1 if (x * 7 + y * 13) % 11 else g2)
    def path(p):
        for y in range(T):
            for x in range(T):
                p(x, y, (214, 186, 130, 255) if (x + y * 3) % 9 else (196, 166, 112, 255))
    def tree(p):
        grass(p)
        for y in range(2, 15):
            for x in range(2, 14):
                if (x - 8) ** 2 / 36 + (y - 8) ** 2 / 42 < 1:
                    p(x, y, (36, 100, 52, 255) if (x + y) % 4 else (28, 84, 44, 255))
        for y in range(11, 16):
            for x in range(7, 9):
                p(x, y, (110, 74, 44, 255))
    def top(p):
        for y in range(0, 12):
            for x in range(1, 15):
                if (x - 8) ** 2 / 49 + (y - 6) ** 2 / 40 < 1:
                    p(x, y, (36, 100, 52, 255) if (x + y) % 4 else (28, 84, 44, 255))
    def water(shift):
        def f(p):
            for y in range(T):
                for x in range(T):
                    wave = ((x + shift * 4) // 4 + y // 4) % 2
                    p(x, y, (64, 128, 216, 255) if wave else (88, 152, 232, 255))
        return f
    def flower(shift):
        def f(p):
            grass(p)
            for fx, fy in ((3, 4), (10, 3), (6, 11), (12, 12)):
                p(fx + shift, fy, (240, 220, 80, 255))
                p(fx + shift, fy + 1, (236, 120, 160, 255))
        return f
    def wall(p):
        for y in range(T):
            for x in range(T):
                p(x, y, (226, 214, 190, 255) if (y % 8) else (190, 176, 150, 255))
    def roof(p):
        for y in range(T):
            for x in range(T):
                p(x, y, (190, 70, 60, 255) if (x + y) % 6 else (160, 52, 46, 255))
    def door(p):
        wall(p)
        for y in range(3, T):
            for x in range(4, 12):
                p(x, y, (110, 74, 44, 255))
        p(10, 10, (240, 200, 80, 255))
    def floor(p):
        for y in range(T):
            for x in range(T):
                p(x, y, (232, 210, 170, 255) if (x // 8 + y // 8) % 2 else (220, 196, 156, 255))
    def ledge(p):
        grass(p)
        for x in range(T):
            p(x, 11, (60, 110, 48, 255))
            p(x, 12, (120, 100, 72, 255))
            p(x, 13, (96, 80, 58, 255))
    def sign(p):
        grass(p)
        for y in range(3, 10):
            for x in range(3, 13):
                p(x, y, (170, 124, 76, 255))
        for y in range(10, 15):
            p(7, y, (110, 74, 44, 255))
            p(8, y, (110, 74, 44, 255))
    def tall(p):
        grass(p)
        for x in range(1, T, 3):
            for y in range(4, 15):
                p(x, y, (40, 120, 56, 255))
                if y < 7:
                    p(x + 1, y, (40, 120, 56, 255))
    def iwall(p):
        for y in range(T):
            for x in range(T):
                p(x, y, (150, 140, 170, 255) if y < 12 else (110, 100, 130, 255))
    def mat(p):
        floor(p)
        for y in range(4, 12):
            for x in range(2, 14):
                p(x, y, (200, 80, 80, 255))
    fns = [grass, path, tree, top, water(0), water(1), flower(0), flower(1), wall, roof, door, floor, ledge, sign, tall, iwall, mat]
    for i, fn in enumerate(fns):
        tile(d, (i % cols) * T, (i // cols) * T, fn)
    (MAPS / "tilesets").mkdir(parents=True, exist_ok=True)
    img.save(MAPS / "tilesets" / "overworld.png")

# ---- sprites -------------------------------------------------------------
def make_sheet(name, hair, shirt, pants):
    # 3 cols (idle, walkA, walkB) x 4 rows (down, up, left, right), 16x32 each
    img = Image.new("RGBA", (48, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    skin = (240, 196, 160, 255)
    for r, facing in enumerate(("down", "up", "left", "right")):
        for c in range(3):
            ox, oy = c * 16, r * 32
            d.rectangle([ox + 4, oy + 4, ox + 11, oy + 11], fill=skin)  # head
            d.rectangle([ox + 4, oy + 3, ox + 11, oy + 6], fill=hair)
            if facing == "up":
                d.rectangle([ox + 4, oy + 3, ox + 11, oy + 10], fill=hair)
            if facing == "down":
                d.point((ox + 6, oy + 9), fill=(40, 40, 60, 255))
                d.point((ox + 9, oy + 9), fill=(40, 40, 60, 255))
            if facing == "left":
                d.point((ox + 5, oy + 9), fill=(40, 40, 60, 255))
            if facing == "right":
                d.point((ox + 10, oy + 9), fill=(40, 40, 60, 255))
            d.rectangle([ox + 4, oy + 12, ox + 11, oy + 21], fill=shirt)  # torso
            arm = 1 if c else 0
            d.rectangle([ox + 2, oy + 13 + arm, ox + 3, oy + 19], fill=skin)
            d.rectangle([ox + 12, oy + 13 + (1 if c == 2 else 0), ox + 13, oy + 19], fill=skin)
            lleg = 4 + (1 if c == 1 else 0)
            rleg = 4 + (1 if c == 2 else 0)
            d.rectangle([ox + 4, oy + 22, ox + 7, oy + 22 + lleg], fill=pants)
            d.rectangle([ox + 8, oy + 22, ox + 11, oy + 22 + rleg], fill=pants)
            d.rectangle([ox + 4, oy + 27 + (lleg - 4), ox + 7, oy + 28 + (lleg - 4)], fill=(60, 50, 50, 255))
            d.rectangle([ox + 8, oy + 27 + (rleg - 4), ox + 11, oy + 28 + (rleg - 4)], fill=(60, 50, 50, 255))
    SPRITES.mkdir(parents=True, exist_ok=True)
    img.save(SPRITES / f"{name}.png")

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
        anim = lambda a, b: [{"tileid": a, "animation": [{"tileid": a, "duration": 500}, {"tileid": b, "duration": 500}]}]
        tiles = anim(WA, WB) + anim(FA, FB)
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
    m.props = [("connect_north", "test_route"), ("connect_north_offset", 5)]
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
    m.props = [("connect_south", "test_town"), ("connect_south_offset", -5)]
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
    make_tileset()
    make_sheet("player", (90, 60, 40, 255), (60, 100, 200, 255), (70, 70, 110, 255))
    make_sheet("npc", (150, 150, 150, 255), (70, 160, 100, 255), (110, 90, 70, 255))
    for name, data in (("test_town", town()), ("test_route", route()), ("test_house", house())):
        (MAPS / f"{name}.json").write_text(json.dumps(data, indent=1) + "\n")
    print("ok")

if __name__ == "__main__":
    main()
