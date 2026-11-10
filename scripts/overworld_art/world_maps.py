"""World maps: towns and routes painted from text grids.

Town grids come from the Aurelia Town Layouts artifact, route grids from
route_layouts.json (the approved Aurelia Route Layouts). One character is one
tile; `paint` turns them into layers, so a new town is a grid plus its doors.
Display names come from backend/data/world/names.json.
"""
import json
from itertools import groupby
from pathlib import Path

from scripts import gen_overworld_placeholders as base

from .slice_art import variant_at
from .tiles import FIRST_NEW, new_tiles, tile_ids

from .slice_art import _wave

COL_FIRST = 4000  # collision tileset firstgid: above every overworld tile id
ID = tile_ids()
NAMES_BY_ID = {v: k for k, v in ID.items()}
ROOT = Path(__file__).resolve().parents[2]
WORLD_NAMES = json.loads((ROOT / "backend" / "data" / "world" / "names.json").read_text())
NAMES, PEOPLE = WORLD_NAMES["places"], WORLD_NAMES["people"]
GYMS = json.loads((ROOT / "backend" / "data" / "gyms" / "gym_puzzles.json").read_text(encoding="utf8"))
VOICES = json.loads((ROOT / "backend" / "data" / "trainers" / "voices.json").read_text(encoding="utf8"))
BADGES = {"willow_thornby": "Bloom", "mara_quill": "Hearth", "tavish_rook": "Breath", "coral_marlowe": "Tide",
          "volt_dray": "Current", "skye_corvin": "Updraft", "sage_ilmara": "Orbit", "cinder_valko": "Ember"}
ROUTES = {r["id"]: r for r in json.loads((Path(__file__).parent / "route_layouts.json").read_text())}
PATH, MAILBOX, ROCK, WA, WB, FA, FB, TALL_OLD = (
    base.PATH, base.MAILBOX, base.ROCK, base.WA, base.WB, base.FA, base.FB, base.TALL)
GRASS_IDS = {base.GRASS} | {ID[f"grass{i}"] for i in range(4)}
SOLID = base.SOLID
BORDER = ",".join(str(ID[f"forest_0_{x}{y}"]) for y in (0, 1) for x in (0, 1))


def say(*texts):
    return json.dumps([{"op": "say", "text": t} for t in texts])


class Town(base.MapBuilder):
    def npc(self, name, x, y, sprite, facing, *lines):
        self.obj("npcs", name, x, y, point=True, sprite=sprite, facing=facing, script=say(*lines))
        self.block(x, y)

    def sign(self, name, x, y, text):
        self.obj("signs", name, x, y, text=text)
        self.put("objects", x, y, ID["prop_sign"], SOLID)


def door(m, target, x, y):
    """A walkable door cell: stepping UP onto it enters `target`; you arrive one
    row above that room's exit mat (interiors.ARRIVE), facing up."""
    from .interiors import ARRIVE, DOORS
    xs, _ = DOORS[target]
    ax, ay = ARRIVE[target][xs.index(x)]
    m.block(x, y, 0)
    m.put("objects", x, y + 1, ID["doormat"])
    m.obj("warps", f"door_{target}_{x}", x, y, kind="door", targetMap=target, targetX=ax, targetY=ay,
          facing="up", transition="iris", enterDir="up")


def place(m, name, x0, y0):
    """Put a whole building down at its own size, top-left tile at (x0, y0)."""
    from .buildings import BUILDINGS
    cols = BUILDINGS[name][0]().width // 16
    for r in range(5):
        for c in range(cols):
            m.put("objects", x0 + c, y0 + r, ID[f"{name}_{c}_{r}"], SOLID)


def before_in_stage(trainer):
    """The trainer the server plays just before this one in the same stage, or None."""
    for path in (ROOT / "backend/data/campaign").glob("level*.json"):
        ids = [b.get("trainerId") for b in json.loads(path.read_text(encoding="utf8"))["battles"]]
        if trainer in ids:
            return ids[ids.index(trainer) - 1] if ids.index(trainer) else None
    return None


def trainer_script(trainer):
    """Battle until beaten, then a word in passing. The server sets trainer:<id> on a win and plays
    a stage in order, so anyone walked past sends the player back rather than asking it out of turn."""
    voice = VOICES[trainer]
    prior = before_in_stage(trainer)
    wait = "You walked past someone further back on the road. They get first go at you."
    if trainer in GYMS:
        wait = "A Leader only meets trainers who finished the road. Someone further back is still waiting for you."
    return json.dumps([{"op": "requireFlag", "flag": f"trainer:{trainer}", "not": True,
                        "else": [{"op": "say", "text": voice["after"]}]},
                       *([{"op": "requireFlag", "flag": f"trainer:{prior}", "else": [{"op": "say", "text": wait}]}] if prior else []),
                       {"op": "say", "text": voice.get("greet") or voice["intro"]}, {"op": "battle", "trainer": trainer}])


def leader_story(m, leader, x, y, facing, *more_rules):
    """A Gym's people: the rule on first entry, the Leader, and the badge after the win."""
    gym = GYMS[leader]
    badge = BADGES[leader]
    m.obj("triggers", "rule", 0, 0, when="enter", once=True, script=say(f"{gym['name']}. {gym['rule']}", *more_rules))
    m.obj("triggers", "badge", 0, 0, when="flag", flag=f"trainer:{leader}", once=True,
          script=say(VOICES[leader]["badge"], f"You received the {badge} Badge!"))
    m.obj("npcs", leader, x, y, point=True, sprite=leader, facing=facing, script=trainer_script(leader))
    m.block(x, y)


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
    """Lay the blob trail tile matching each path cell's 8 neighbours over the
    ground left under it. Paving and the map edge count as path (no rim there)."""
    from .tiles_v2 import blob_mask
    joins = {PATH, ID["pave"], ID["plank"], ID["plank_v"]} | {ID["pave_" + e] for e in ("n", "s", "w", "e", "nw", "ne", "sw", "se")}
    is_path = [m.ground[i] - 1 == PATH for i in range(m.w * m.h)]

    def grass_at(x, y):
        if not (0 <= x < m.w and 0 <= y < m.h):
            return False
        return not (is_path[m.i(x, y)] or m.ground[m.i(x, y)] - 1 in joins)

    for y in range(m.h):
        for x in range(m.w):
            if is_path[m.i(x, y)]:
                mask = blob_mask(lambda dx, dy: grass_at(x + dx, y + dy))
                m.put("ground", x, y, m.under[x, y])
                m.put("decor", x, y, ID[f"trail_{mask}_{x % 2}{y % 2}"])


def halo(grid):
    """Cells of darker lawn: everything touching a building, fence, hedge or tree,
    with an edge that wanders out to three cells so patches never read as boxes."""
    solid = {(x, y) for y, row in enumerate(grid) for x, c in enumerate(row) if c in "BTbfh"}
    lawn = set()
    for x, y in solid:
        for dx in range(-3, 4):
            for dy in range(-3, 4):
                reach, noise = max(abs(dx), abs(dy)), _wave((x + dx) * 5, (y + dy) * 5, 1.7)
                if reach <= 1 or (reach == 2 and noise > 4) or (reach == 3 and noise > 22):
                    lawn.add((x + dx, y + dy))
    # Fill pockets: a meadow cell walled by lawn on 3+ sides reads as a pale box.
    cells = {(x, y) for y, row in enumerate(grid) for x in range(len(row))}
    while pockets := {c for c in cells - lawn
                      if sum((c[0] + dx, c[1] + dy) in lawn for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))) >= 3}:
        lawn |= pockets
    return lawn


def forest_name(mask, x, y, deep):
    """Deep forest shifts tone per 32px block, with a rare amber tree. Only blocks
    `deep` inside the forest change: a rim would cut their clumps into scraps."""
    tones = (None, None, "sun", "deep", None, "sun", "deep", None, "deep", None, "sun", None, "deep", None, None, None, "amber")
    tone = tones[hashed(x // 2, y // 2) % len(tones)] if deep else None
    return f"forest_{tone}_{x % 2}{y % 2}" if tone else f"forest_{mask}_{x % 2}{y % 2}"


def paint(m, grid, walk_tile, biome="meadow"):
    """Lay a text grid onto m. `walk_tile` is what "." means: "grass" or "path"."""
    from .tiles_v2 import E, N, S, Wb, blob_mask
    cells = {(x, y): c for y, row in enumerate(grid) for x, c in enumerate(row)}
    water = {k for k, c in cells.items() if c == "~"}
    forest = {k for k, c in cells.items() if c in "Tb"}
    lawn = halo(grid)
    m.under = {}

    def outside(group, x, y):
        """Blob test: past the map edge counts as more of the same."""
        return (x, y) in cells and (x, y) not in group

    for (x, y), c in cells.items():
        if (x, y) in lawn:
            mask = blob_mask(lambda dx, dy: outside(lawn, x + dx, y + dy))
            m.under[x, y] = ID[f"lawn_{mask}_{x % 2}{y % 2}"]
        else:
            m.under[x, y] = ID[f"grass{variant_at(x, y)}"]
        m.put("ground", x, y, m.under[x, y])
        if c == "," or (c == "." and walk_tile == "path"):
            m.put("ground", x, y, PATH)
        elif c in "Tb":
            mask = blob_mask(lambda dx, dy: outside(forest, x + dx, y + dy))
            bx, by = x // 2 * 2, y // 2 * 2
            deep = not any(outside(forest, bx + dx, by + dy) for dx in range(-1, 3) for dy in range(-1, 3))
            m.put("objects", x, y, ID[forest_name(mask, x, y, deep)], SOLID)
        elif c == "k":
            run = "k" in (cells.get((x - 1, y)), cells.get((x + 1, y)))
            m.put("ground", x, y, ID["plank" if run else "plank_v"])
        elif c == "g":
            edge = sum(bit for (dx, dy), bit in (((0, -1), N), ((1, 0), E), ((0, 1), S), ((-1, 0), Wb))
                       if cells.get((x + dx, y + dy), "g") != "g")
            m.put("decor", x, y, ID[f"tall_{biome}_{edge}_{(x + y) % 2}_0"])
        elif c == "F":
            m.put("decor", x, y, ID["bedA" if (x + y) % 2 else "bed2A"])
        elif c == "f":
            links = sum(bit for (dx, dy), bit in (((0, -1), N), ((1, 0), E), ((0, 1), S), ((-1, 0), Wb))
                        if cells.get((x + dx, y + dy)) == "f")
            m.put("objects", x, y, ID[f"fence_{links}"], SOLID)
        elif c == "h":
            m.put("objects", x, y, ID["bush"], SOLID)
        elif c == "u":
            m.put("above", x, y - 1, ID["prop_well_top"])
            m.put("objects", x, y, ID["prop_well_base"], SOLID)
        elif c == "n":
            m.put("objects", x, y, ID["prop_bench"], SOLID)
        elif c == "L":
            m.put("above", x, y - 1, ID["prop_lamp_top"])
            m.put("objects", x, y, ID["prop_lamp_base"], SOLID)
        elif c == "~":
            mask = blob_mask(lambda dx, dy: (x + dx, y + dy) not in water)
            m.put("ground", x, y, ID[f"pond_{mask}_0"], SOLID)


# Worn lines through a route's meadow, by brush width: top-left brush corners,
# walked corner to corner. Solid cells and tall grass stay as they are, so a
# trail fades out under the grass and picks up on the far side. The main road
# is 2 wide to meet the 2-tall map connections; side paths are footpaths.
TRAILS = {
    "route_1": {
        2: [[(0, 9), (6, 9), (6, 7), (16, 7), (16, 5), (26, 5), (26, 9), (27, 9), (27, 12), (33, 12), (33, 13),
             (36, 13), (36, 9), (39, 9)]],
        1: [[(14, 9), (14, 15), (27, 15), (27, 13), (30, 13)]],
    },
    # Up round the west wheat block, over the bridge, round the east one.
    "route_2": {2: [[(0, 9), (7, 9), (7, 4), (14, 4), (14, 13), (23, 13), (23, 4), (31, 4), (31, 9), (38, 9)]]},
}


# Hand-placed solids on open ground, and one-way ledges (x0, x1, y), per route.
DRESSING = {"route_1": [("rock", 9, 5), ("stump", 12, 10), ("rock", 30, 10), ("stump", 29, 9), ("rock", 19, 16),
                        ("stump", 23, 14), ("rock", 34, 15)]}
DRESSING = {k: [(x, y, n) for n, x, y in v] for k, v in DRESSING.items()}
# x0, x1, y. A ledge is a wall from below: leave a way round it, or it splits the
# route. Row 6 has to stay open at x 10-13, the only way past lass_annie.
LEDGES = {"route_1": [(7, 9, 6), (29, 32, 11)]}


def worn(grid, lines, size=2):
    """`grid` with "." turned to "," under each line, `size` cells wide."""
    rows = [list(r) for r in grid]
    for line in lines:
        for (x0, y0), (x1, y1) in zip(line, line[1:]):
            for x in range(min(x0, x1), max(x0, x1) + 1):
                for y in range(min(y0, y1), max(y0, y1) + 1):
                    for cx, cy in ((x + i, y + j) for i in range(size) for j in range(size)):
                        if cy < len(rows) and cx < len(rows[cy]) and rows[cy][cx] == ".":
                            rows[cy][cx] = ","
    return ["".join(r) for r in rows]


def grass_runs(grid):
    """Tall grass as (x, y, w) strips, so wild battles happen only where it is drawn."""
    for y, row in enumerate(grid):
        x = 0
        for c, run in groupby(row):
            w = len(list(run))
            if c == "g":
                yield x, y, w
            x += w


def fringe(m, grid):
    """Tufts on open ground around tall grass, breaking up its square edge."""
    tall = {(x, y) for y, row in enumerate(grid) for x, c in enumerate(row) if c == "g"}
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            near = any((x + dx, y + dy) in tall for dx in (-1, 0, 1) for dy in (-1, 0, 1))
            if c == "." and near and hashed(x, y) % 3:
                m.put("decor", x, y, ID["tufts"])


def dress_grass(m, biome="meadow"):
    """Scatter decor in small clusters, one chance per 5x5 block, so grass keeps
    empty space between them instead of an even speckle. Off the meadow: tufts
    in the biome's own tones and pebbles."""
    decals = [ID["tufts"], ID["tufts"], ID["flowers0"], ID["flowers1"], ID["pebbles"], ID["mushrooms"]]
    if biome != "meadow":
        decals = [ID[f"tufts_{biome}"]] * 4 + [ID["pebbles"]] * 2
    bare = set(m.under.values())

    def free(x, y):
        return (0 <= x < m.w and 0 <= y < m.h and m.ground[m.i(x, y)] - 1 in bare
                and not (m.decor[m.i(x, y)] or m.objects[m.i(x, y)] or m.above[m.i(x, y)]))

    for by in range(0, m.h, 5):
        for bx in range(0, m.w, 5):
            h = hashed(bx + 1, by + 3)
            if h % 3 == 0:
                continue
            x, y = bx + h % 4, by + (h >> 3) % 4
            for dx, dy in ((0, 0), (1, 0), (0, 1))[:2 + h % 2]:
                if free(x + dx, y + dy):
                    m.put("decor", x + dx, y + dy, decals[(h >> 5) % 6])


def lone_tree(m, kind, x, y):
    """A 2x2 tree whose trunk row is (x, y), (x + 1, y). Actors pass behind the canopy."""
    for c in (0, 1):
        m.put("above", x + c, y - 1, ID[f"tree{kind}_{c}_0"])
        m.put("objects", x + c, y, ID[f"tree{kind}_{c}_1"], SOLID)


def prop(m, name, x, y):
    m.put("objects", x, y, ID[name if name.startswith("crops") else f"prop_{name}"], None if name.startswith("crops") else SOLID)


def ledge_row(m, x0, x1, y):
    """A one-way drop: walk off it heading south, never back up."""
    for x in range(x0, x1 + 1):
        part = "l" if x == x0 else "r" if x == x1 else "m"
        m.put("objects", x, y, ID[f"ledge_{part}"], base.L_DOWN)


def dress_pond(m, grid):
    """Lily pads out on open water, reeds along the south and west banks."""
    water = {(x, y) for y, row in enumerate(grid) for x, c in enumerate(row) if c == "~"}
    for x, y in water:
        h = hashed(x, y)
        if all((x + dx, y + dy) in water for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            if h % 4 == 0:
                m.put("decor", x, y, ID[f"lily{(h >> 4) % 2}"])
        elif ((x, y + 1) not in water or (x - 1, y) not in water) and h % 3 != 1:
            m.put("decor", x, y, ID["reeds"])


DAWNBROOK = [
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTT.......TTTTTTTTTTT",
    "TT...BBBBB.........BBBBBBB..TT",
    "T..f.BBBBB.f.hhh...BBBBBBB...T",
    "T..f.BBBBB.f.......BBBBBBB...T",
    "T..f.BBBBB.f...u...BBBBBBB...T",
    "T..f.BBBBB.f.......BBBBBBB...T",
    "T..fFFF,FFFf........L.,.L....T",
    "T..ffff,ffff..........,.....sT",
    "T..L,,,,,,,,,,,,,,,,,,,,,,,,,,",
    "T...,,,,,,,,,,,,,,,,,,,,,,,,,,",
    "T....L.....,....L.........L..T",
    "T....BBBBB.,.ff.fff.....~~...T",
    "T....BBBBB.,.fFFFFf...~~~~~..T",
    "T....BBBBB.,.fFFFFf..~~~~~~n.T",
    "T....BBBBB.,.fFFFFf...~~~~~..T",
    "T....BBBBB.,.ffffff....~~~...T",
    "T......,,,,,.................T",
    "TT............TT............TT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
]


def dawnbrook():
    m = Town(30, 20, base.GRASS)
    m.props = [("nameKey", "dawnbrook"), ("ambient", "butterflies"), ("clouds", True), ("border", BORDER), ("connect_east", "route_1"), ("connect_east_offset", 0)]
    paint(m, DAWNBROOK, "grass")
    place(m, "home_clay", 5, 2)
    place(m, "lab", 19, 2)
    place(m, "home_slate", 5, 12)
    door(m, "dawnbrook_home", 7, 6)
    door(m, "dawnbrook_lab", 22, 6)
    door(m, "dawnbrook_house", 7, 16)
    m.sign("town_sign", 12, 8, f"{NAMES['dawnbrook'].upper()} - Where every journey begins.")
    m.sign("route_sign", 28, 8, f"{NAMES['route_1'].upper()} - East to {NAMES['mossgate']}.")
    m.npc("old_woman", 15, 6, "old_woman", "up", "This old well has never run dry. Nobody remembers who dug it.")
    m.npc("rival", 21, 8, "rival", "left", "Late again? The Professor's been waiting. I got here first, as usual.")
    lone_tree(m, "F", 17, 3)
    lone_tree(m, "A", 26, 4)
    lone_tree(m, "B", 2, 14)
    for name, x, y in (("mailbox", 6, 7), ("mailbox", 6, 17), ("barrel", 18, 5), ("crate", 18, 6), ("barrel", 26, 6),
                       ("rock", 20, 17), ("rock", 27, 16), ("stump", 1, 11), ("crops0", 1, 16), ("crops1", 2, 16),
                       ("crops0", 3, 16), ("crops1", 1, 17), ("crops0", 2, 17), ("crops1", 3, 17)):
        prop(m, name, x, y)
    dress_pond(m, DAWNBROOK)
    dress_grass(m)
    autotile_paths(m)
    return finish(m.build(), m)


MOSSGATE = [
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TT....TTTTTTBBBBBBTTTTBBBBBTTT",
    "TTL...TTT..hBBBBBBh.T.BBBBBTTT",
    "TT....TT...hBBBBBBh.T.BBBBBTTT",
    "TTh..hT..L.hBBBBBBh.L.BBBBBTTT",
    "TTh..h......BBBDBB....BBDBBTTT",
    "TTh..h.........,........,..TTT",
    "TT....L........,........,...TT",
    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,",
    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,",
    "TT.BBBBBB.,....L....k.BBBBB.TT",
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
    m.props = [("nameKey", "mossgate"), ("time", "dusk"), ("ambient", "fireflies"), ("border", BORDER), ("connect_west", "route_1"),
               ("connect_west_offset", 0), ("connect_east", "route_2"), ("connect_east_offset", 0)]
    paint(m, MOSSGATE, "grass")
    place(m, "trunk_gym", 12, 2)
    place(m, "home_moss", 22, 2)
    place(m, "care_center", 3, 11)
    place(m, "home_slate", 22, 11)
    m.block(15, 6, 0)
    m.obj("warps", "door_mossgate_gym", 15, 6, kind="door", targetMap="mossgate_gym", targetX=1, targetY=5,
          facing="right", transition="iris", enterDir="up")
    door(m, "mossgate_house_a", 24, 6)
    door(m, "mossgate_center", 6, 15)
    door(m, "mossgate_house_b", 24, 15)
    m.sign("town_sign", 7, 8, f"{NAMES['mossgate'].upper()} - Nothing here grows in a hurry.")
    m.sign("gym_sign", 16, 7, f"{NAMES['mossgate'].upper()} GYM - Leader: {PEOPLE['willow_thornby']}.")
    m.sign("route_sign", 27, 8, f"{NAMES['route_2'].upper()} - East to {NAMES['hearthfield']}.")
    line = f"The road to {NAMES['route_2']} is closed to anyone without the Bloom Badge. Try the Gym here first."
    m.obj("triggers", "gate", 29, 9, 1, 2, when="step", script=json.dumps(
        [{"op": "requireFlag", "flag": "trainer:willow_thornby",
          "else": [{"op": "say", "text": line}, {"op": "cutsceneMove", "actor": "player", "path": ["left"]}]}]))
    m.npc("camper", 12, 8, "camper", "down", "The Gym is built inside a hollow trunk. Older than the town, they say.")
    m.npc("picnicker", 18, 17, "picnicker", "up", "Rest at the Center before the Gym. The Leader won't rush you, but the seeds might.")
    lone_tree(m, "B", 18, 7)
    lone_tree(m, "A", 8, 17)
    for name, x, y in (("mailbox", 25, 7), ("mailbox", 25, 16), ("barrel", 9, 15), ("crate", 9, 14), ("rock", 4, 4),
                       ("stump", 4, 8), ("rock", 26, 17)):
        prop(m, name, x, y)
    dress_pond(m, MOSSGATE)
    dress_grass(m)
    autotile_paths(m)
    return finish(m.build(), m)


def mossgate_gym():
    """The Seed pods puzzle, at the same coordinates as gym_puzzles.json so the
    server's replay() and this map agree. Cols 10-12 are the Leader's chamber.
    Pods and the gate are not in the map: game/overworld.js runs them from the
    `puzzle` property, drawing `puzzle_pod` and `puzzle_gate` (gids)."""
    gym = GYMS["willow_thornby"]
    rows = [r + "####" for r in gym["rows"]]
    rows[4] = rows[4][:10] + "...#"
    rows[5] = "." + rows[5][1:10] + "...#"  # col 0 is the exit, one step west of the start
    rows[6] = rows[6][:9] + "....#"
    m = Town(14, 8, base.GRASS)
    m.props = [("puzzle", "willow_thornby"), ("puzzle_pod", ID["rock2"] + 1), ("puzzle_socket-full", ID["rock2"] + 1),
               ("puzzle_gate", ID["bush"] + 1)]
    paint(m, ["".join("T" if c == "#" else "." for c in r) for r in rows], "path")
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c == "_":
                m.put("ground", x, y, ID["veg"])
    m.obj("warps", "exit", 0, 5, kind="door", targetMap="mossgate", targetX=15, targetY=7, facing="down",
          transition="iris", enterDir="left")
    m.sign("hint", 0, 4, gym["hint"] + " Stuck? Leave the room and the seeds roll back.")
    leader_story(m, "willow_thornby", 12, 5, "left")
    autotile_paths(m)
    return finish(m.build(), m)


def route(route_id):
    """A route from route_layouts.json. Its trainers carry `trainer`, `order` and
    `sight`, which validate:maps uses to prove they cannot be skipped."""
    r = ROUTES[route_id]
    m = Town(r["w"], r["h"], base.GRASS)
    links = {"route_1": [("connect_west", "dawnbrook"), ("connect_west_offset", 0),
                         ("connect_east", "mossgate"), ("connect_east_offset", 0)]}[route_id]
    m.props = [("nameKey", route_id), ("ambient", "leaves"), ("clouds", True), ("entry", r["entry"]["side"]), ("border", BORDER), *links]
    grid = r["grid"]
    for size, lines in TRAILS[route_id].items():
        grid = worn(grid, lines, size)
    paint(m, grid, "grass")
    for i, (x, y, w) in enumerate(grass_runs(grid)):
        m.obj("encounters", f"grass_{i + 1}", x, y, w, 1, table=route_id)
    for t in r["trainers"]:
        m.obj("npcs", t["id"], t["x"], t["y"], point=True, sprite=t["id"].rsplit("_", 1)[0], facing=t["facing"],
              trainer=t["id"], order=t["i"], sight=t["sight"], script=trainer_script(t["id"]))
        m.block(t["x"], t["y"])
    autotile_paths(m)
    for x, y, name in DRESSING[route_id]:
        prop(m, name, x, y)
    for row in LEDGES[route_id]:
        ledge_row(m, *row)
    fringe(m, grid)
    dress_grass(m)
    return finish(m.build(), m)


MAPS = {"dawnbrook": dawnbrook, "route_1": lambda: route("route_1"), "mossgate": mossgate, "mossgate_gym": mossgate_gym}


def light_tiles():
    """Tiles with a runtime light or effect: lamps, windows, chimneys."""
    from .buildings import BUILDINGS, WINDOWS
    lit = [{"id": ID["prop_lamp_top"], "properties": [base.prop("glow", 20)]}]
    lit += [{"id": ID[f"home_{roof}_3_0"], "properties": [base.prop("smoke", True)]} for roof in ("clay", "slate", "moss")]
    for name in BUILDINGS:
        lit += [{"id": ID[f"{name}_{c}_3"], "properties": [base.prop("glow", 9)]} for c in WINDOWS.get(name, ())]
    return lit


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
    from .gym_art import ANIMATED
    tiles += [anim(ID[f"gym_{theme}_{name}0"], ID[f"gym_{theme}_{name}1"], ms) for theme, name, ms in ANIMATED]
    tiles += [anim(ID[f"lava_{mask}_0"], ID[f"lava_{mask}_1"], 420) for mask in range(16)]
    for sides in ("n", "s", "w", "e", "nw", "ne", "sw", "se"):
        tiles.append(anim(ID[f"shore_{sides}A"], ID[f"shore_{sides}B"], 500))
    from .tiles_v2 import blob_masks
    for mask in blob_masks():  # pond: 3 frames, ripple drift + foam lap + sparkle
        for kind in ("pond", "pondc"):
            f = [ID[f"{kind}_{mask}_{k}"] for k in range(3)]
            tiles.append({"id": f[0], "animation": [{"tileid": i, "duration": 420} for i in f]})
    decor = next(l for l in data["layers"] if l["name"] == "decor")["data"]
    grass = {g - 1 for g in decor if NAMES_BY_ID.get(g - 1, "").startswith("tall_")}  # only what this map shows
    tiles += [{**anim(i, i + 1, 900), "properties": [base.prop("cover", 9)]} for i in sorted(grass)]
    ts["tiles"] = tiles + light_tiles()
    key = dict(m.props).get("nameKey")
    if key:
        data["properties"].append(base.prop("mapName", NAMES[key]))
    data["tilesets"][1]["firstgid"] = COL_FIRST
    for layer in data["layers"]:
        if layer["name"] == "collision":
            layer["data"] = [v - base.COL_FIRST + COL_FIRST if v else 0 for v in layer["data"]]
    return data
