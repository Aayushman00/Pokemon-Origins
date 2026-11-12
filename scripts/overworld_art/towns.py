"""Hearthfield to Zenith and Routes 2-9, painted from town_layouts.json and
route_layouts.json. One legend per map says what each grid character means.

Legend kinds: walk road plaza grass stairs plank tree water lava lamp fence hedge
bench well flowers bld stone crop wire | mass:<name> over:<base>:<prop> void
obj:<prop> tall:<prop> (a prop drawn two tiles tall, actors pass behind the top).
"""
import json

from scripts import gen_overworld_placeholders as base

from .gym_rooms import ROOMS
from .tiles_v2 import blob_mask
from .town_art import CRAGGY, LAYOUTS, town_buildings
from .world_maps import (BADGES, BORDER, GYMS, ID, NAMES, NAMES_BY_ID, PEOPLE, PATH, ROUTES, SOLID, Town, autotile_paths, door, dress_grass, finish, halo,
                         ledge_row, fringe, grass_runs, hashed, lone_tree, paint, prop, dress_pond, say, trainer_script, TRAILS, worn)

COMMON = {".": "walk", ",": "road", "p": "plaza", "g": "grass", "=": "stairs", "k": "plank", "b": "plank", "B": "bld", "D": "bld",
          "A": "bld", "T": "tree", "~": "water", "l": "lava", "L": "lamp", "f": "fence", "h": "hedge", "n": "bench", "u": "well",
          "F": "flowers", "j": "tall:lantern", "*": "tall:star", "i": "obj:brazier"}
PAINTED = {"walk": ".", "road": ",", "grass": "g", "tree": "T", "water": "~", "plank": "k", "lamp": "L", "fence": "f",
           "hedge": "h", "bench": "n", "well": "u", "flowers": "F", "bld": "B", "stone": "~"}
BORDERS = {"meadow": BORDER, "hills": BORDER, "sand": BORDER}


def block_of(name):
    return ",".join(str(ID[name]) for _ in range(4))


SKY_BORDER = ",".join(str(ID[f"sky_{x}{y}"]) for y in (0, 1) for x in (0, 1))
BORDERS.update(concrete=block_of("m_plant_t0"), cliff=SKY_BORDER, marble=SKY_BORDER, slate=block_of("m_mountain_t0"),
               basalt=block_of("m_basalt_t0"))


def afloat(cells):
    """What lies under props and buildings that stand in open water (buoys, the
    pier Gym, a crate on the pier): blocks touching only water and planks. They
    used to count as land, which drew a ring of shore round each one."""
    solid = {k for k, v in cells.items() if v == "bld" or v.startswith("obj:")}
    under, seen = {}, set()
    near = lambda c: [(c[0] + dx, c[1] + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
    for start in solid - seen:
        if start in seen:
            continue
        block, todo, edge = set(), [start], set()
        while todo:
            c = todo.pop()
            if c not in block:
                block.add(c)
                todo += [n for n in near(c) if n in solid]
                edge |= {cells[n] for n in near(c) if n in cells and n not in solid}
        seen |= block
        if "water" in edge and edge <= {"water", "plank"}:
            for c in block:  # boards run under anything standing between two of them
                under[c] = "plank" if sum(cells.get(n) == "plank" for n in near(c)) >= 2 else "water"
    return under


def terrain(m, grid, biome, legend, stairs="ns", town=False):
    """Lay `grid` onto m. The grass-world painter does trees, water and street
    furniture; everything else is laid over it from the legend."""
    kind_of = lambda c: legend.get(c) or COMMON[c]
    cells = {(x, y): kind_of(c) for y, row in enumerate(grid) for x, c in enumerate(row)}
    wet = afloat(cells)
    paint(m, ["".join(PAINTED.get(wet.get((x, y), cells[x, y]), ".") for x in range(len(row))) for y, row in enumerate(grid)], "grass", biome)
    group = lambda name: {k for k, v in cells.items() if v == name or v.startswith(f"{name}:") or v.startswith(f"over:{name.split(':')[-1]}:")}
    open_at = lambda g, x, y: (x, y) in cells and (x, y) not in g
    masses = {k: group(f"mass:{k.split(':')[1]}") for k in set(cells.values()) if k.startswith("mass:")}
    void, lava = group("void"), group("lava")
    meadow = biome == "meadow"
    for (x, y), kind in cells.items():
        below = wet.get((x, y), kind)
        if not meadow and below == "water":  # the bank sits on this biome's ground, not on meadow
            m.put("decor", x, y, ID[NAMES_BY_ID[m.ground[m.i(x, y)] - 1].replace("pond_", "pondc_")])
        if not meadow and below not in ("stone", "plank"):
            tile = ID[f"t_{biome}_ground{hashed(x, y) % 4}"]
            m.put("ground", x, y, tile)
            m.under[x, y] = tile
        if kind == "road" and not meadow:
            m.put("ground", x, y, ID[f"t_{biome}_road"])
        elif kind == "plaza":
            m.put("ground", x, y, ID["pave"] if meadow else ID[f"t_{biome}_plaza"])
        elif kind == "stairs":
            m.put("ground", x, y, ID[f"t_{'hills' if meadow else biome}_stairs_{stairs}"])
        elif kind == "stone":
            m.block(x, y, 0)
            m.put("decor", x, y, ID["o_stone"])
        elif kind == "crop":
            m.put("decor", x, y, ID[f"crops{(x + y) % 2}"])
        elif kind == "wire":  # strung a row up, at the height of the pylon arms it hangs from
            w, e = (cells.get((x + d, y)) == "wire" for d in (-1, 1))
            m.put("above", x, y - 1, ID["o_wire" if w and e else "o_wire_w" if e else "o_wire_e" if w else "o_wire_v"])
        elif kind.startswith("obj:"):
            name = kind[4:]
            m.put("objects", x, y, ID[name if name.startswith("prop_") else f"o_{name}"], SOLID)
        elif kind.startswith("tall:"):
            sides = "".join(s for s, d in (("e", 1), ("w", -1)) if cells.get((x + d, y)) == "wire")
            m.put("above", x, y - 1, ID[f"o_{kind[5:]}_top" + (f"_{sides}" if sides else "")])
            m.put("objects", x, y, ID[f"o_{kind[5:]}_base"], SOLID)
        elif kind == "emblem":
            m.put("ground", x, y, ID["o_emblem"])
    uppers = set()  # cells that became the top half of a tall face
    for key, g in masses.items():
        name = key.split(":")[1]
        faces ={(x, y) for x, y in g if open_at(g, x, y + 1)}
        # A craggy plateau with rock above its face and more above that shows a face two tiles tall.
        tall = {(x, y) for x, y in faces if name in CRAGGY and (x, y - 2) in g and (x, y - 1) in g and (x, y - 1) not in faces}
        uppers |= {(x, y - 1) for x, y in tall}
        for x, y in g:
            e, w = open_at(g, x + 1, y), open_at(g, x - 1, y)
            if (x, y + 1) in tall:  # upper half, cut from the same face as the cell below it
                m.put("ground", x, y, ID[f"m_{name}_u{e | w << 1}_{hashed(x, y + 1) % 3}"], SOLID)
            elif (x, y) in faces:
                v = hashed(x, y) % 3 if name in CRAGGY else 0
                if (x, y) in tall:
                    m.put("ground", x, y, ID[f"m_{name}_l{e | w << 1}_{v}"], SOLID)
                else:
                    m.put("ground", x, y, ID[f"m_{name}_f{e | w << 1}" + (f"_{v}" if v else "")], SOLID)
                if not m.decor[m.i(x, y + 1)]:  # the face shades the ground at its foot
                    m.put("decor", x, y + 1, ID["mass_shadow"])
            else:
                phase = f"_p{x % 2}{y % 2}" if name in CRAGGY and (x % 2 or y % 2) else ""
                m.put("ground", x, y, ID[f"m_{name}_t{open_at(g, x, y - 1) | e << 1 | w << 2}{phase}"], SOLID)
    for x, y in void:
        m.put("ground", x, y, ID[f"t_{biome}_drop"] if open_at(void, x, y - 1) else ID[f"sky_{x % 4}{y % 4}"], SOLID)
    for x, y in lava:
        mask = open_at(lava, x, y - 1) | open_at(lava, x + 1, y) << 1 | open_at(lava, x, y + 1) << 2 | open_at(lava, x - 1, y) << 3
        m.put("ground", x, y, ID[f"lava_{mask}_0"], SOLID)
    for (x, y), kind in cells.items():
        if kind.startswith("over:"):
            if (x, y) in uppers:  # a shrub on the rim of a tall face steps back onto the plateau, or goes
                if cells.get((x, y - 1), "").startswith("over:") or (x, y - 1) in uppers:
                    continue
                y -= 1
            m.put("objects", x, y, ID[f"o_{kind.split(':')[2]}"], SOLID)
    if not meadow:
        zones(m, cells, biome, town)


TURF = ("concrete", "sand", "hills", "slate")  # biomes where grass creeps out from a tree line
DIRT = ("sand", "hills", "basalt")  # unpaved roads: a broken shoulder, not a kerb
PAVED = ("road", "plaza", "stairs", "plank", "emblem")


def zones(m, cells, biome, town):
    """Off the meadow, what lawn does on it: turf creeping out from the trees,
    a cool worn tone hugging buildings and fences, and an edge where a road or
    plaza meets open ground. All of it is decor: nothing here touches collision.
    Cliffs count as walls only in a town: a route is a corridor between them, and
    shading out from both sides would cover it whole."""
    near = lambda test: halo(["".join("B" if test(cells[x, y]) else "." for x in range(m.w)) for y in range(m.h)])
    wall = lambda kind: kind in ("bld", "fence", "hedge") or town and (kind.startswith("mass:") or (
        kind.startswith("over:") and kind.split(":")[1] not in ("void", "lava")))

    def patch(source):
        """Halo of the cells `source` matches, minus spurs and islands: a lone
        cell of grass out on the concrete reads as a green bubble."""
        group = near(source)
        for _ in range(2):
            group = {(x, y) for x, y in group if source(cells.get((x, y), ""))
                     or sum((x + dx, y + dy) in group for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))) >= 2}
        return group

    turf = patch(lambda kind: kind == "tree") if biome in TURF else set()
    worn = patch(wall) - turf
    out = lambda group, x, y: (x, y) in cells and (x, y) not in group
    is_ground = lambda x, y: NAMES_BY_ID[m.ground[m.i(x, y)] - 1].startswith(f"t_{biome}_ground")
    foot = base.OW_FIRST + ID["mass_shadow"]
    for (x, y) in cells:
        i = m.i(x, y)
        if not is_ground(x, y):
            continue
        if m.decor[i]:  # under a cliff's shadow the tone still carries on, one layer up, or the cell reads as a pale box
            if m.decor[i] == foot and (x, y) in worn and not m.objects[i]:
                m.put("objects", x, y, ID[f"verge_{blob_mask(lambda dx, dy: out(worn, x + dx, y + dy))}"])
        elif (x, y) in turf:
            mask = blob_mask(lambda dx, dy: out(turf, x + dx, y + dy))
            m.put("decor", x, y, ID[f"turf_{mask}_{x % 2}{y % 2}"])
        elif (x, y) in worn:
            m.put("decor", x, y, ID[f"verge_{blob_mask(lambda dx, dy: out(worn, x + dx, y + dy))}"])
    edge = "shoulder" if biome in DIRT else "kerb"
    open_ground = lambda x, y: (x, y) in cells and cells[x, y] not in PAVED and cells[x, y] != "bld"
    for (x, y), kind in cells.items():
        if kind in PAVED and not m.decor[m.i(x, y)]:
            mask = sum(bit for bit, (dx, dy) in ((1, (0, -1)), (2, (1, 0)), (4, (0, 1)), (8, (-1, 0))) if open_ground(x + dx, y + dy))
            if mask:
                m.put("decor", x, y, ID[f"{edge}_{mask}"])


def gate(m, side, leader, route):
    """Sends the player back from a town edge until they hold this town's badge."""
    x, y, w, h, back = {"east": (29, 9, 1, 2, "left"), "west": (0, 9, 1, 2, "right"), "north": (14, 0, 2, 1, "down")}[side]
    line = f"The road to {NAMES[route]} is closed to anyone without the {BADGES[leader]} Badge. Try the Gym here first."
    script = [{"op": "requireFlag", "flag": f"trainer:{leader}", "else": [{"op": "say", "text": line},
                                                                         {"op": "cutsceneMove", "actor": "player", "path": [back]}]}]
    m.obj("triggers", "gate", x, y, w, h, when="step", script=json.dumps(script))


# Each town: art, what its grid letters mean, cells to change (old guard gates,
# which the design dropped), edges, and the people. Edges are side -> neighbour.
TOWNS = {
    "hearthfield": dict(
        biome="meadow", leader="mara_quill", props=[("ambient", "butterflies"), ("clouds", True)],
        links={"west": "route_2", "east": "route_3"}, onward="east",
        legend={"w": "crop", "S": "obj:scarecrow", "W": "bld"},
        signs=[("town_sign", 9, 7, "HEARTHFIELD - Warm bread, warm beds, long days."),
               ("gym_sign", 14, 7, "HEARTHFIELD GYM - Leader: Mara Quill. Mind the belts."),
               ("route_sign", 27, 8, "ROUTE 3 - East over the Ironback hills to Ironbrook.")],
        npcs=[("baker_boy", 12, 8, "youngster", "down", "Mara's rolls sell out by noon. The belts in her Gym never stop, though."),
              ("farmer", 7, 8, "old_man", "right", "Good wheat this year. Something's been at the north field, mind. Tidy footprints, and no animal I know."),
              ("mother", 26, 8, "picnicker", "left", "The old fellow in the house by the mill can teach your Pokemon moves they've forgotten."),
              ("kid", 22, 12, "twin", "up", "If you stand on a belt you don't get a say any more. That's the whole trick!")]),
    "ironbrook": dict(
        biome="meadow", leader="tavish_rook", props=[("ambient", "leaves"), ("clouds", True)],
        links={"west": "route_3", "east": "route_4"}, onward="east",
        legend={"r": "obj:prop_rock", "R": "mass:rock", "e": "stone", "Y": "obj:statue", "y": "obj:post"},
        stairs="ns",
        signs=[("town_sign", 5, 8, "IRONBROOK - Breathe in. Stand firm. Breathe out."),
               ("gym_sign", 23, 7, "IRONBROOK GYM - Leader: Tavish Rook. Read the scroll."),
               ("route_sign", 27, 8, "ROUTE 4 - East to the coast and Saltmere Harbor.")],
        npcs=[("student", 18, 8, "black_belt", "left", "Master Tavish says twelve words a day. I counted. Today was a good day: nine."),
              ("elder", 8, 8, "old_man", "down", "The brook runs both sides of town, and it takes one bridge to hold us together."),
              ("hiker", 25, 8, "hiker", "down", "Strangers in grey came through asking about old maps. Bought nothing. Thanked nobody."),
              ("trainee", 18, 13, "battle_girl", "right", "Those posts have been kicked every day for forty years. They're winning.")]),
    "saltmere": dict(
        biome="sand", leader="coral_marlowe", props=[("clouds", True), ("ambient", "dust")], links={"west": "route_4", "north": "route_5"}, onward="north",
        legend={"r": "obj:prop_rock", "W": "water", "N": "obj:net", "c": "obj:prop_crate", "q": "obj:buoy", "X": "obj:prop_crate"},
        signs=[("town_sign", 12, 8, "SALTMERE HARBOR - Tide tables at the Mart."),
               ("gym_sign", 29, 13, "SALTMERE GYM - Out on the pier. Leader: Coral Marlowe."),
               ("route_sign", 13, 1, "ROUTE 5 - North to Dynamo Station.")],
        npcs=[("deckhand", 25, 11, "sailor", "left", "Captain Marlowe once sailed a storm in a soup pot. She tells it better."),
              ("netmender", 14, 12, "fisherman", "up", "Team Hollow, they call themselves. Chartered three boats and paid in coins nobody's minted in a century."),
              ("tourist", 9, 7, "beauty", "right", "The sand here squeaks when you walk on it. Nobody warned me about the squeak.")]),
    "dynamo": dict(
        biome="concrete", leader="volt_dray", props=[("clouds", True), ("ambient", "dust")], links={"south": "route_5", "north": "route_6"}, onward="north",
        legend={"P": "tall:pylon", "-": "wire", "z": "obj:steel_rail", "K": "obj:container", "X": "obj:container"},
        patch=[(29, 8, "K"), (29, 9, "K")],
        signs=[("town_sign", 10, 7, "DYNAMO STATION - Output today: 91 percent."),
               ("gym_sign", 23, 7, "DYNAMO GYM - Leader: Volt Dray. Do not lick the panels."),
               ("route_sign", 12, 10, "ROUTE 6 - North along the Gale cliffs.")],
        npcs=[("technician", 8, 8, "scientist", "right", "Somebody tapped the north line last week. Whatever's drawing that much power isn't a Pokemon."),
              ("rigger", 20, 10, "hiker", "up", "That wire hums a low note at night. We've started tuning to it."),
              ("apprentice", 6, 10, "youngster", "down", "Mr. Dray says the odds of me passing are ninety-one percent! He says that to everyone.")]),
    "gale": dict(
        biome="cliff", leader="skye_corvin", props=[("clouds", True), ("ambient", "leaves")], links={"south": "route_6", "west": "route_7"}, onward="west",
        legend={"v": "void", "R": "obj:rail", "O": "obj:boulder", "o": "emblem", "M": "mass:mountain"}, weather="snow",
        ledges=[(10, 12, 11), (14, 16, 19)],  # hop down a terrace; the stairs are the way back up
        signs=[("town_sign", 7, 8, "GALE SPIRE - Hold on to your hat."),
               ("gym_sign", 15, 7, "GALE GYM - Leader: Skye Corvin. The wind does not stop."),
               ("route_sign", 2, 8, "ROUTE 7 - West into the Starfall range.")],
        npcs=[("keeper", 24, 6, "old_woman", "left", "The birds fly low when grey coats pass. They flew low all last month."),
              ("climber", 22, 7, "camper", "down", "From the top of the spire you can see Zenith Summit. And a door in its side nobody remembers building."),
              ("sketcher", 9, 14, "lass", "right", "I've been drawing the same cloud for an hour. It keeps leaving.")]),
    "starfall": dict(
        biome="slate", leader="sage_ilmara", props=[("time", "night"), ("ambient", "fireflies")], links={"east": "route_7", "west": "route_8"}, onward="west",
        legend={"W": "bld"},
        signs=[("town_sign", 7, 7, "STARFALL OBSERVATORY - Quiet, please. The stars are working."),
               ("gym_sign", 6, 7, "STARFALL GYM - Leader: Sage Ilmara. She knows you're reading this."),
               ("route_sign", 2, 8, "ROUTE 8 - West across the Emberhold slopes.")],
        npcs=[("astronomer", 21, 8, "scientist", "left", "Team Hollow borrowed our star charts. The ones from before the League was founded."),
              ("stargazer", 8, 8, "old_woman", "down", "Every eighty years one star over Zenith goes dark. It's due."),
              ("student", 15, 12, "twin", "up", "Your reflection in the Gym moves the wrong way. I checked. Twice.")]),
    "emberhold": dict(
        biome="basalt", leader="cinder_valko", props=[("time", "dusk"), ("ambient", "embers")], links={"east": "route_8", "west": "route_9"}, onward="west",
        legend={"#": "mass:basalt", "W": "bld", "X": "mass:basalt"},
        patch=[(22, 0, "#"), (23, 0, "#")],
        signs=[("town_sign", 7, 11, "EMBERHOLD - Forged, not grown."),
               ("gym_sign", 17, 8, "EMBERHOLD GYM - Leader: Cinder Valko. Count your steps."),
               ("route_sign", 2, 11, "ROUTE 9 - West up the Grand Stair to Zenith Summit.")],
        npcs=[("smith", 4, 11, "hiker", "right", "Our forge has burned since before the town had a name. Nobody lit it."),
              ("stoker", 18, 11, "biker", "left", "Grey coats ordered a key from us. Big as a door. Paid double, wouldn't say what for."),
              ("widow", 25, 11, "old_woman", "down", "Eight badges is a lot of road, dear. Sit by the fire a minute.")]),
    "zenith": dict(
        biome="marble", leader=None, props=[("clouds", True)], links={"east": "route_9"}, onward=None,
        legend={"v": "void", "X": "road"}, patch=[(0, 3, "v"), (0, 4, "v")], weather="snow",
        signs=[("town_sign", 19, 11, "ZENITH SUMMIT - Every road in Aurelia ends here."),
               ("league_sign", 15, 6, "POKEMON LEAGUE - Eight badges. No way back once you begin.")],
        npcs=[("veteran", 11, 7, "cooltrainer_m", "right", "I've stood at this door nine times. Stock up in the lobby. There's no second chance past it."),
              ("warden", 4, 9, "gym_guide", "right", "That west door's sealed by League order. Only a Champion may open it.")]),
}

ROAD_SPRITES = {"hollow_grunt_marco": "grunt_m", "hollow_grunt_silas": "grunt_m", "hollow_grunt_petra": "grunt_f",
                "hollow_grunt_odessa": "grunt_f", "cooltrainer_vince": "cooltrainer_m", "cooltrainer_selena": "cooltrainer_f",
                "blackbelt_kiyo": "black_belt", "swimmer_nora": "swimmer_f"}
ROUTE_LOOK = {  # biome, ambient, legend, stairs direction
    "route_2": ("meadow", "butterflies", {"f": "mass:field", "w": "over:field:wheatstack", "B": "plank"}, "ns"),
    "route_3": ("hills", "leaves", {"r": "mass:rock", "T": "over:rock:shrub"}, "ns"),
    "route_4": ("sand", "dust", {"a": "walk", "r": "mass:rock", "s": "over:rock:palm"}, "ns"),
    "route_5": ("concrete", "dust", {"K": "mass:plant", "P": "over:plant:pylon"}, "ns"),
    "route_6": ("cliff", "leaves", {"v": "void", "r": "over:void:float", "B": "plank"}, "ns"),
    "route_7": ("slate", "fireflies", {"m": "mass:mountain", "r": "over:mountain:crag"}, "ns"),
    "route_8": ("basalt", "embers", {"#": "over:lava:spire", "B": "plank"}, "ns"),
    "route_9": ("marble", None, {"v": "void", "c": "over:void:column"}, "ew"),
}
TOWN_IDS = {name: tid for tid, name in NAMES.items()}
ROUTE_SIGNS = {"route_2": (9, 3, 8), "route_3": (2, 2, 8), "route_4": (1, 20, 8), "route_5": (14, 13, 40),
               "route_6": (14, 14, 40), "route_7": (53, 53, 8), "route_8": (52, 52, 10), "route_9": (60, 60, 9)}


def target_of(town, label, order):
    if label == "G":
        return None
    return f"{town}_{ {'C': 'center', 'M': 'mart', 'V': 'tutor'}.get(label) or 'house_' + 'abc'[order] }"


def town(tid):
    t, spec = LAYOUTS[tid], TOWNS[tid]
    grid = [list(r) for r in t["grid"]]
    for x, y, c in spec.get("patch", ()):
        grid[y][x] = c
    grid = ["".join(r) for r in grid]
    m = Town(len(grid[0]), len(grid), base.GRASS)  # 30x20 unless the layout says otherwise
    links = [p for side, other in spec["links"].items() for p in ((f"connect_{side}", other), (f"connect_{side}_offset", 0))]
    m.props = [("nameKey", tid), *spec["props"], ("border", BORDERS[spec["biome"]]), *links]
    if spec.get("weather"):
        m.props.append(("weather", spec["weather"]))
    terrain(m, grid, spec["biome"], spec["legend"], spec.get("stairs", "ns"), town=True)
    for _, x0, y0, img in town_buildings(tid):
        for r in range(img.height // 16):
            for c in range(img.width // 16):
                cell = img.crop((c * 16, r * 16, (c + 1) * 16, (r + 1) * 16))
                if cell.getbbox():
                    m.put("objects", x0 + c, y0 + r, ID[f"{_}_{c}_{r}"])
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            if (spec["legend"].get(c) or COMMON[c]) == "bld":
                m.block(x, y)
    houses = 0
    for d in t["doors"]:
        x, y, label = d["x"], d["y"], d["label"]
        if label == "G":
            if tid == "zenith":
                m.block(x, y, 0)
                m.obj("warps", "door_league", x, y, kind="door", targetMap="zenith_league", targetX=7, targetY=9, facing="up",
                      transition="iris", enterDir="up")
                continue
            leader = spec["leader"]
            rows = GYMS[leader]["rows"]
            px, py = next((i, j) for j, r in enumerate(rows) for i, c in enumerate(r) if c == "P")
            over = tid == "saltmere"
            m.block(x, y, 0)
            m.obj("warps", f"door_{tid}_gym", x, y, kind="door", targetMap=f"{tid}_gym", targetX=px, targetY=py, facing="up",
                  transition="iris", enterDir="down" if over else "up")
        else:
            door(m, target_of(tid, label, houses), x, y)
            houses += label == "h"
    for row in spec.get("ledges", ()):
        ledge_row(m, *row, look="ledge" if spec["biome"] == "meadow" else "ledge_" + spec["biome"])
    for name, x, y, text in spec["signs"]:
        m.sign(name, x, y, text)
    for name, x, y, sprite, facing, *lines in spec["npcs"]:
        m.npc(name, x, y, sprite, facing, *lines)
    if spec["onward"]:
        gate(m, spec["onward"], spec["leader"], spec["links"][spec["onward"]])
    if tid == "zenith":
        hollow_lab_door(m)
    if spec["biome"] == "meadow":
        autotile_paths(m)
    else:
        dress_grass(m, spec["biome"])
    return finish(m.build(), m)


def hollow_lab_door(m):
    """Two cells of old stone in the west wall. Only a Champion gets past the step in front."""
    for y in (3, 4):
        m.put("ground", 1, y, ID["gym_dome_exit"])
        m.obj("warps", f"lab_door_{y}", 1, y, kind="door", targetMap="hollow_lab", targetX=24, targetY=4, facing="left",
              transition="iris", enterDir="left")
    m.obj("triggers", "lab_seal", 2, 3, 1, 2, when="step", script=json.dumps([
        {"op": "requireFlag", "flag": "trainer:kestrel_vane",
         "else": [{"op": "say", "text": "The door is sealed by League order. Only a Champion may open it."},
                  {"op": "cutsceneMove", "actor": "player", "path": ["right"]}]}]))


def route(rid):
    r = ROUTES[rid]
    biome, ambient, legend, stairs = ROUTE_LOOK[rid]
    m = Town(r["w"], r["h"], base.GRASS)
    links = []
    for end in (r["entry"], r["exit"]):
        links += [(f"connect_{end['side']}", TOWN_IDS[end["town"]]), (f"connect_{end['side']}_offset", 0)]
    m.props = [("nameKey", rid), ("entry", r["entry"]["side"]), ("border", BORDERS[biome]), *links]
    if ambient:
        m.props.append(("ambient", ambient))
    if biome not in ("slate", "basalt"):
        m.props.append(("clouds", True))
    if biome == "slate":
        m.props.append(("time", "night"))
    if biome == "basalt":
        m.props.append(("time", "dusk"))
    if biome == "marble":  # the climb to Zenith, which is under snow
        m.props.append(("weather", "snow"))
    grid = r["grid"]
    for size, lines in TRAILS.get(rid, {}).items():
        grid = worn(grid, lines, size)
    terrain(m, grid, biome, legend, stairs)
    for i, (x, y, w) in enumerate(grass_runs(r["grid"])):
        m.obj("encounters", f"grass_{i + 1}", x, y, w, 1, table=rid)
    for t in r["trainers"]:
        sprite = ROAD_SPRITES.get(t["id"]) or t["id"].rsplit("_", 1)[0]
        m.obj("npcs", t["id"], t["x"], t["y"], point=True, sprite=sprite, facing=t["facing"],
              trainer=t["id"], order=t["i"], sight=t["sight"], script=trainer_script(t["id"]))
        m.block(t["x"], t["y"])
    if biome == "meadow":
        autotile_paths(m)
        fringe(m, r["grid"])
    dress_grass(m, biome)
    return finish(m.build(), m)


# The Playground: a park where trainers meet and chat (pages/playground). Not
# linked into the world. 40 x 28 must match the server room in
# backend/src/playground/movement.js. Its spawn circle (2 tiles round tile
# 20,14) sits on the fountain; the client nudges spawns to the open rim
# (playgroundGame.js nearestOpen). Paths run to the woods on all four sides.
PLAYGROUND = [
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTT...........T....,,....T...........TTT",
    "TT..ffffffff.......,,........~~~~.....TT",
    "TT..fFFFFFFf.......,,.......~~~~~~....TT",
    "TT..fFFFFFFf...L...,,...L..~~~~~~~n...TT",
    "TT..fFFFFFFf.......,,.......~~~~~~....TT",
    "TT..fff,ffff.......,,.........~~......TT",
    "TT.....,...........,,.................TT",
    "TT.....,,,,,,.....pppp...........h....TT",
    "TT..........,,..pppppppp.........h....TT",
    "TT...L.......,.pppppppppp..L.....h....TT",
    "TT...........,pppppppppppp............TT",
    "T,,,,,,,,,,,,,pppppppppppp,,,,,,,,,,,,,T",
    "T,,,,,,,,,,,,,pppppppppppp,,,,,,,,,,,,,T",
    "TT............pppppppppppp............TT",
    "TT...n.n.......pppppppppp.....gggg....TT",
    "TT..........L...pppppppp...L.gggggg...TT",
    "TT...n.n..........pppp.......gggggg...TT",
    "TT.................,,.........gggg....TT",
    "TT.....hhh.........,,.................TT",
    "TT.................,,......F.F.F......TT",
    "TT...L.............,,.................TT",
    "TT.................,,.........L.......TT",
    "TTT................,,................TTT",
    "TTTT...............,,...............TTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
]


def playground():
    m = Town(40, 28, base.GRASS)
    m.props = [("ambient", "butterflies"), ("clouds", True), ("border", BORDER)]
    terrain(m, PLAYGROUND, "meadow", {})
    for kind, x, y in (("A", 9, 22), ("B", 33, 21), ("F", 23, 4), ("A", 2, 11), ("B", 35, 12), ("A", 13, 24)):
        lone_tree(m, kind, x, y)
    for name, x, y in (("rock", 25, 20), ("stump", 11, 3), ("rock", 3, 18), ("barrel", 32, 9), ("crate", 32, 10)):
        prop(m, name, x, y)
    plaza_pieces(m)
    dress_pond(m, PLAYGROUND)
    autotile_paths(m)
    fringe(m, PLAYGROUND)
    dress_grass(m)
    return finish(m.build(), m)


# Things to walk up to on the plaza; the client reads the same spots (playgroundGame.js SPOTS).
FOUNTAIN_AT = (18, 12)   # 4x4, centred on the plaza
BOARD_AT = (16, 10)      # 2x2, north-west of the fountain
BENCHES = ((17, 17), (21, 17))  # two-seat benches facing the fountain


def plaza_pieces(m):
    fx, fy = FOUNTAIN_AT
    for r in range(4):
        for c in range(4):
            m.put("objects", fx + c, fy + r, ID[f"fountain0_{c}_{r}"], SOLID)
    bx, by = BOARD_AT
    for r in range(2):
        for c in range(2):
            m.put("objects", bx + c, by + r, ID[f"board_{c}_{r}"], SOLID)
    for x, y in BENCHES:
        m.put("objects", x, y, ID["prop_bench"], SOLID)
        m.put("objects", x + 1, y, ID["prop_bench"], SOLID)


MAPS = {**{tid: (lambda tid=tid: town(tid)) for tid in TOWNS}, **{rid: (lambda rid=rid: route(rid)) for rid in ROUTE_LOOK}}
MAPS["playground"] = playground
