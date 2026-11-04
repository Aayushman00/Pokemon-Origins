"""World maps: towns and routes painted from text grids.

Town grids come from the Aurelia Town Layouts artifact, route grids from
route_layouts.json (the approved Aurelia Route Layouts). One character is one
tile; `paint` turns them into layers, so a new town is a grid plus its doors.
Display names come from backend/data/world/names.json.
"""
import json
from pathlib import Path

from scripts import gen_overworld_placeholders as base

from .tiles import FIRST_NEW, new_tiles, tile_ids

COL_FIRST = 1000  # collision tileset firstgid: above every overworld tile id
ID = tile_ids()
ROOT = Path(__file__).resolve().parents[2]
WORLD_NAMES = json.loads((ROOT / "backend" / "data" / "world" / "names.json").read_text())
NAMES, PEOPLE = WORLD_NAMES["places"], WORLD_NAMES["people"]
GYMS = json.loads((ROOT / "backend" / "data" / "gyms" / "gym_puzzles.json").read_text(encoding="utf8"))
ROUTES = {r["id"]: r for r in json.loads((Path(__file__).parent / "route_layouts.json").read_text())}
PATH, MAILBOX, ROCK, WA, WB, FA, FB, TALL_OLD = (
    base.PATH, base.MAILBOX, base.ROCK, base.WA, base.WB, base.FA, base.FB, base.TALL)
GRASS_IDS = {base.GRASS} | {ID[f"grass{i}"] for i in range(4)}
SOLID = base.SOLID
BORDER = ",".join(str(ID[f"forestA_{x}_{y}"]) for y in (0, 1) for x in (0, 1))


def say(*texts):
    return json.dumps([{"op": "say", "text": t} for t in texts])


class Town(base.MapBuilder):
    def npc(self, name, x, y, sprite, facing, *lines):
        self.obj("npcs", name, x, y, point=True, sprite=sprite, facing=facing, script=say(*lines))
        self.block(x, y)

    def sign(self, name, x, y, text):
        self.obj("signs", name, x, y, text=text)
        self.put("objects", x, y, base.SIGN, SOLID)


def door(m, target, x, y):
    """A walkable door cell: stepping UP onto it enters `target`; you arrive one
    row above that room's exit mat (interiors.ARRIVE), facing up."""
    from .interiors import ARRIVE, DOORS
    xs, _ = DOORS[target]
    ax, ay = ARRIVE[target][xs.index(x)]
    m.block(x, y, 0)
    m.obj("warps", f"door_{target}_{x}", x, y, kind="door", targetMap=target, targetX=ax, targetY=ay,
          facing="up", transition="iris", enterDir="up")


def stamp(m, name, x0, y0, w, h, door_x):
    """Stretch a 4x4 building stamp to the outline's footprint: outer columns and
    rows stay, the middle repeats, and the stamp's door column lands on door_x."""
    for j in range(h):
        r = 3 if j == h - 1 else 0 if j == 0 else 2 if j == h - 2 else 1
        for i in range(w):
            c = 0 if i == 0 else 3 if i == w - 1 else 1 if x0 + i == door_x else 2
            m.put("above" if j == 0 else "objects", x0 + i, y0 + j, ID[f"{name}_{c}_{r}"], SOLID)


def trainer_script(trainer, *lines):
    """Battle until beaten, then a word in passing. The server sets trainer:<id> on a win."""
    return json.dumps([{"op": "requireFlag", "flag": f"trainer:{trainer}", "not": True,
                        "else": [{"op": "say", "text": "That was a good battle. Safe travels!"}]},
                       *[{"op": "say", "text": t} for t in lines], {"op": "battle", "trainer": trainer}])


def hashed(x, y):
    return (x * 73856093 ^ y * 19349663) & 0xFFFF


def plain_windows(m, size=3):
    """Top-left corners of size x size windows that are nothing but bare grass."""
    bad = []
    for y0 in range(m.h - size + 1):
        for x0 in range(m.w - size + 1):
            if all(m.ground[m.i(x, y)] - 1 in GRASS_IDS and not m.decor[m.i(x, y)] and not m.objects[m.i(x, y)]
                   and not m.above[m.i(x, y)]
                   for y in range(y0, y0 + size) for x in range(x0, x0 + size)):
                bad.append((x0, y0))
    return bad


def autotile_paths(m):
    """Swap every plain dirt-path cell for the blob tile matching its 8
    neighbours. Paving and the map edge count as path (no grass rim there)."""
    from .tiles_v2 import blob_mask
    joins = {PATH, ID["pave"], ID["plank"]} | {ID["pave_" + e] for e in ("n", "s", "w", "e", "nw", "ne", "sw", "se")}
    is_path = [m.ground[i] - 1 == PATH for i in range(m.w * m.h)]

    def grass_at(x, y):
        if not (0 <= x < m.w and 0 <= y < m.h):
            return False
        return not (is_path[m.i(x, y)] or m.ground[m.i(x, y)] - 1 in joins)

    for y in range(m.h):
        for x in range(m.w):
            if is_path[m.i(x, y)]:
                mask = blob_mask(lambda dx, dy: grass_at(x + dx, y + dy))
                m.put("ground", x, y, ID[f"path_{mask}"])


def paint(m, grid, walk_tile):
    """Lay a text grid onto m. `walk_tile` is what "." means: "grass" or "path"."""
    from .tiles_v2 import blob_mask
    water = {(x, y) for y, row in enumerate(grid) for x, c in enumerate(row) if c == "~"}
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            m.put("ground", x, y, ID[f"grass{hashed(x, y) % 4}"])
            if c == "," or (c == "." and walk_tile == "path"):
                m.put("ground", x, y, PATH)
            elif c in "Tb":
                v = "A" if ((x // 2) + (y // 2)) % 2 == 0 else "B"
                m.put("objects", x, y, ID[f"forest{v}_{x % 2}_{y % 2}"], SOLID)
            elif c == "k":
                m.put("ground", x, y, ID["plank"])
            elif c == "g":
                m.put("ground", x, y, ID["tallA"])
            elif c == "F":
                m.put("ground", x, y, ID["bedA" if (x + y) % 2 else "bed2A"])
            elif c == "f":
                m.put("objects", x, y, ID["picket"], SOLID)
            elif c == "h":
                m.put("objects", x, y, ID["bush"], SOLID)
            elif c == "u":  # ponytail: no well tile yet, see assets/TODO_ART_AUDIO.md
                m.put("objects", x, y, ID["barrel"], SOLID)
            elif c == "n":
                m.put("objects", x, y, ID["bench_l"], SOLID)
            elif c == "L":
                m.put("above", x, y - 1, ID["lamp_top"])
                m.put("objects", x, y, ID["lamp_base"], SOLID)
            elif c == "~":
                mask = blob_mask(lambda dx, dy: (x + dx, y + dy) not in water)
                m.put("ground", x, y, ID[f"pond_{mask}_0"], SOLID)


def dress_grass(m):
    """Break up bare grass with tufts and tiny flowers: no 3x3 window stays plain."""
    decals = [ID["tufts"], ID["flowers0"], ID["flowers1"], ID["tufts"]]
    while True:
        bad = plain_windows(m)
        if not bad:
            return
        x0, y0 = bad[0]
        x, y = x0 + hashed(x0, y0) % 3, y0 + hashed(y0, x0) % 3
        m.put("decor", x, y, decals[hashed(x, y) % len(decals)])


DAWNBROOK = [
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTT..........TTTTTTTT",
    "TT.ffffffff.......BBBBBBBBB.TT",
    "T..fBBBBBBf..hhh..BBBBBBBBB..T",
    "T..fBBBBBBf.......BBBBBBBBB..T",
    "T..fBBBDBBf....u..BBBBDBBBB..T",
    "T..fFFF,FFf.........L.,.L....T",
    "T..ffff,fff...........,......T",
    "T......,s.............,.....sT",
    "T..L,,,,,,,,,,,,,,,,,,,,,,,,,,",
    "T...,,,,,,,,,,,,,,,,,,,,,,,,,,",
    "T....L.....,....L.........L..T",
    "T...BBBBBB.,.ff.fff.....~~...T",
    "T...BBBBBB.,.fFFFFf...~~~~~..T",
    "T...BBBDBB.,.fFFFFf..~~~~~~n.T",
    "T......,,,,,.fFFFFf...~~~~~..T",
    "T.F.F.F......ffffff....~~~...T",
    "T............................T",
    "TT............TT............TT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
]


def dawnbrook():
    m = Town(30, 20, base.GRASS)
    m.props = [("nameKey", "dawnbrook"), ("border", BORDER), ("connect_east", "route_1"), ("connect_east_offset", 0)]
    paint(m, DAWNBROOK, "grass")
    stamp(m, "house", 4, 3, 6, 3, 7)
    stamp(m, "house", 18, 2, 9, 4, 22)  # ponytail: placeholder until the lab has its own art
    stamp(m, "house", 4, 12, 6, 3, 7)
    door(m, "dawnbrook_home", 7, 5)
    door(m, "dawnbrook_lab", 22, 5)
    door(m, "dawnbrook_house", 7, 14)
    m.sign("town_sign", 8, 8, f"{NAMES['dawnbrook'].upper()} - Where every journey begins.")
    m.sign("route_sign", 28, 8, f"{NAMES['route_1'].upper()} - East to {NAMES['mossgate']}.")
    m.npc("old_woman", 15, 6, "old_woman", "up", "This old well has never run dry. Nobody remembers who dug it.")
    m.npc("rival", 20, 7, "rival", "left", "Late again? The Professor's been waiting. I got here first, as usual.")
    dress_grass(m)
    autotile_paths(m)
    return finish(m.build(), m)


MOSSGATE = [
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TT....TTTTTTBBBBBBTTTTTTTTTTTT",
    "TTL...TTT..hBBBBBBh.T.BBBBBTTT",
    "TT....TT...hBBBBBBh.T.BBBBBTTT",
    "TTh..hT..L.hBBBBBBh.L.BBBBBTTT",
    "TTh..h......BBBDBB....BBDBBTTT",
    "TTh..h.........,........,..TTT",
    "TT....L........,........,...TT",
    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,",
    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,",
    "TT.hhhhhh.,....L....k....L.TTT",
    "TT.BBBBBB.,.~~~~~~~.k.BBBBB.TT",
    "TT.BBBBBB.,~~~~~~~~~k.BBBBB.TT",
    "TT.BBBBBB.,kkkkkkkkkk.BBBBB.TT",
    "TT.BBBDBB.,~~~~~~~~.k.BBDBB.TT",
    "TT.g..,,,,,..~~~~...k,,,,..gTT",
    "TTgg.........gg...........TTTT",
    "TTTTT...TTTTTTTTT..TTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
]


def mossgate():
    m = Town(30, 20, base.GRASS)
    m.props = [("nameKey", "mossgate"), ("border", BORDER), ("connect_west", "route_1"), ("connect_west_offset", 0)]
    paint(m, MOSSGATE, "grass")
    for r in range(5):  # ponytail: stock Gym stamp until the hollow trunk has its own art
        for c in range(6):
            m.put("above" if r == 0 else "objects", 12 + c, 2 + r, ID[f"gym_{c}_{r}"], SOLID)
    stamp(m, "house", 22, 3, 5, 4, 24)
    stamp(m, "center", 3, 12, 6, 4, 6)
    stamp(m, "house", 22, 12, 5, 4, 24)
    m.block(15, 6, 0)
    m.obj("warps", "door_mossgate_gym", 15, 6, kind="door", targetMap="mossgate_gym", targetX=1, targetY=5,
          facing="right", transition="iris", enterDir="up")
    door(m, "mossgate_house_a", 24, 6)
    door(m, "mossgate_center", 6, 15)
    door(m, "mossgate_house_b", 24, 15)
    m.sign("town_sign", 7, 8, f"{NAMES['mossgate'].upper()} - Nothing here grows in a hurry.")
    m.sign("gym_sign", 16, 7, f"{NAMES['mossgate'].upper()} GYM - Leader: {PEOPLE['willow_thornby']}.")
    m.sign("route_sign", 27, 8, f"{NAMES['route_2'].upper()} - East to {NAMES['hearthfield']}. (Opens in a later update.)")
    m.npc("camper", 12, 8, "camper", "down", "The Gym is built inside a hollow trunk. Older than the town, they say.")
    m.npc("picnicker", 18, 17, "picnicker", "up", "Rest at the Center before the Gym. The Leader won't rush you, but the seeds might.")
    dress_grass(m)
    autotile_paths(m)
    return finish(m.build(), m)


def mossgate_gym():
    """The Seed pods puzzle, at the same coordinates as gym_puzzles.json so the
    server's replay() and this map agree. Cols 10-12 are the Leader's chamber.
    ponytail: pods are fixed rocks until the puzzle client lands, so the gate stays shut."""
    gym = GYMS["willow_thornby"]
    rows = [r + "####" for r in gym["rows"]]
    rows[4] = rows[4][:10] + "...#"
    rows[5] = "." + rows[5][1:10] + "...#"  # col 0 is the exit, one step west of the start
    rows[6] = rows[6][:9] + "....#"
    m = Town(14, 8, base.GRASS)
    paint(m, ["".join({"#": "T", "g": "h"}.get(c, ".") for c in r) for r in rows], "path")
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c == "_":
                m.put("ground", x, y, ID["veg"])
            elif c == "$":
                m.put("objects", x, y, ID["rock2"], SOLID)
    m.obj("warps", "exit", 0, 5, kind="door", targetMap="mossgate", targetX=15, targetY=7, facing="down",
          transition="iris", enterDir="left")
    m.sign("hint", 0, 4, gym["hint"])
    m.obj("signs", "vine_gate", 7, 6, text="Thick vines bar the way. (Pushing seed pods opens in a later update.)")
    script = trainer_script("willow_thornby", "Welcome to the Grove. Take your time, nothing here grows in a hurry.")
    m.obj("npcs", "willow_thornby", 12, 5, point=True, sprite="leader_f", facing="left", script=script)
    m.block(12, 5)
    autotile_paths(m)
    return finish(m.build(), m)


def route(route_id):
    """A route from route_layouts.json. Its trainers carry `trainer`, `order` and
    `sight`, which validate:maps uses to prove they cannot be skipped."""
    r = ROUTES[route_id]
    m = Town(r["w"], r["h"], base.GRASS)
    links = {"route_1": [("connect_west", "dawnbrook"), ("connect_west_offset", 0),
                         ("connect_east", "mossgate"), ("connect_east_offset", 0)]}[route_id]
    m.props = [("nameKey", route_id), ("entry", r["entry"]["side"]), ("border", BORDER), *links]
    paint(m, r["grid"], "path")
    for i, g in enumerate(r["grass"]):
        m.obj("encounters", f"grass_{i + 1}", g["x"], g["y"], g["w"], g["h"], table=route_id)
    for t in r["trainers"]:
        script = trainer_script(t["id"], "Our eyes met! That means we battle!")
        m.obj("npcs", t["id"], t["x"], t["y"], point=True, sprite=t["id"].rsplit("_", 1)[0], facing=t["facing"],
              trainer=t["id"], order=t["i"], sight=t["sight"], script=script)
        m.block(t["x"], t["y"])
    autotile_paths(m)
    return finish(m.build(), m)


MAPS = {"dawnbrook": dawnbrook, "route_1": lambda: route("route_1"), "mossgate": mossgate, "mossgate_gym": mossgate_gym}


def finish(data, m):
    """Point the map at the extended tileset and move collision gids to 1000+."""
    total = FIRST_NEW + len(new_tiles())
    rows = (total + 7) // 8
    ts = data["tilesets"][0]
    ts.update(imageheight=rows * 16, tilecount=total)
    anim = lambda a, b, ms: {"id": a, "animation": [{"tileid": a, "duration": ms}, {"tileid": b, "duration": ms}]}
    tiles = [anim(WA, WB, 500), anim(FA, FB, 500), {"id": TALL_OLD, "properties": [base.prop("cover", 9)]},
             anim(ID["bedA"], ID["bedB"], 700), anim(ID["bed2A"], ID["bed2B"], 760),
             {**anim(ID["tallA"], ID["tallB"], 900), "properties": [base.prop("cover", 9)]}]
    for sides in ("n", "s", "w", "e", "nw", "ne", "sw", "se"):
        tiles.append(anim(ID[f"shore_{sides}A"], ID[f"shore_{sides}B"], 500))
    from .tiles_v2 import blob_masks
    for mask in blob_masks():  # pond: 3 frames, ripple drift + foam lap + sparkle
        f = [ID[f"pond_{mask}_{k}"] for k in range(3)]
        tiles.append({"id": f[0], "animation": [{"tileid": i, "duration": 420} for i in f]})
    ts["tiles"] = tiles
    data["tilesets"][1]["firstgid"] = COL_FIRST
    for layer in data["layers"]:
        if layer["name"] == "collision":
            layer["data"] = [v - base.COL_FIRST + COL_FIRST if v else 0 for v in layer["data"]]
    return data
