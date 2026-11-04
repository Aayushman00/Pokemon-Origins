"""The seven puzzle gyms after Mossgate, built from gym_puzzles.json.

The puzzle keeps its coordinates from the json, so the server's replay() and the
map agree. The Leader's chamber sits to the east behind a solid wall: solving the
room fades the player in (`puzzleChamber`), and a solved gym's door lands there.
Solid cells are the json's walls and nothing else: the puzzle decides the rest.
"""
from scripts import gen_overworld_placeholders as base

from .gym_art import BELT
from .world_maps import COL_FIRST, GYMS, ID, SOLID, Town, finish, leader_story

# town, art theme, the exit cell in the puzzle's wall and the way you step onto it,
# and the town cell you come back to.
ROOMS = {
    "mara_quill": ("hearthfield", "bakery", (3, 0, "up"), (15, 7)),
    "tavish_rook": ("ironbrook", "dojo", (4, 3, "left"), (22, 7)),
    "coral_marlowe": ("saltmere", "harbor", (4, 0, "up"), (19, 15)),
    "volt_dray": ("dynamo", "generator", (0, 1, "left"), (22, 7)),
    "skye_corvin": ("gale", "spire", (7, 7, "left"), (14, 7)),
    "sage_ilmara": ("starfall", "dome", (0, 2, "left"), (5, 7)),
    "cinder_valko": ("emberhold", "forge", (10, 7, "down"), (16, 8)),
}
CELLS = {
    "bakery": {c: f"belt{d}0" for c, d in BELT.items()},
    "dojo": {c: f"plate_{c}" for c in "abcde"},
    "harbor": {"~": "water0", "s": "water0", "b": "water0", "v": "valve"},
    "generator": {"p": "panel_off"},
    "spire": {"_": "drop", "o": "cloud"},
    "dome": {"G": "star", "H": "star_twin"},
    "forge": {"l": "lava0", "h": "heat", "e": "stone_down", "o": "stone_down"},
}
PIECES = {  # the puzzle's cell kinds that change during play -> tile
    "bakery": {},
    "dojo": {**{f"door-{c}": f"door_{c}" for c in "ABCD"}, **{f"door-open-{c}": f"open_{c}" for c in "ABCD"}},
    "harbor": {"sand": "sand", "sand-under": "under", "boat": "boat", "boat-low": "boat_low"},
    "generator": {"panel-on-want": "panel_on", "panel-off-want": "panel_off", "gate": "gate"},
    "spire": {},
    "dome": {"twin": "twin"},
    "forge": {"stone-up": "stone_up", "stone-down": "stone_down"},
}
# Said after the rule. The stones change as you land, which the rule alone doesn't show.
EXTRA = {"cinder_valko": "The stones change as you land, so aim for the ones that are down now."}
CHAMBER_W = 9
SEAMLESS = ("bakery", "forge")  # checker floors: one tile already alternates


def build(leader):
    gym = GYMS[leader]
    town, theme, (ex, ey, way), back = ROOMS[leader]
    tile = lambda name: ID[f"gym_{theme}_{name}"]
    rows = gym["rows"]
    gw, gh = len(rows[0]), len(rows)
    w, h = gw - 1 + CHAMBER_W, max(gh, 10)
    grid = [["#"] * w for _ in range(h)]
    for y, row in enumerate(rows):
        grid[y][:gw] = row
    x0, cx = gw - 1, gw - 1 + CHAMBER_W // 2
    for y in range(2, h - 1):
        grid[y][x0 + 1:x0 + CHAMBER_W - 1] = "." * (CHAMBER_W - 2)
    wall = lambda x, y: not (0 <= x < w and 0 <= y < h) or grid[y][x] == "#"

    m = Town(w, h, base.GRASS)
    pieces = [(f"puzzle_{kind}", tile(name) + 1) for kind, name in PIECES[theme].items()]
    m.props = [("puzzle", leader), ("puzzleChamber", f"{cx},{h - 2}"), *pieces]
    floor = lambda x, y: tile("floor0" if theme in SEAMLESS else f"floor{(x + y) % 2}")
    for y in range(h):
        for x in range(w):
            c = grid[y][x]
            if c == "#":
                side = ("l" if not wall(x - 1, y) else "") + ("r" if not wall(x + 1, y) else "")
                name = "face" if not wall(x, y + 1) else f"cap_{side}" if side else "cap"
                m.put("ground", x, y, tile(name), SOLID)
            elif c in CELLS[theme]:
                m.put("ground", x, y, tile(CELLS[theme][c]))
            else:
                m.put("ground", x, y, floor(x, y))
                if c == "G":
                    m.put("decor", x, y, tile("goal"))

    def way_out(name, x, y, enter):
        m.put("ground", x, y, tile("exit"))
        m.block(x, y, 0)
        m.obj("warps", name, x, y, kind="door", targetMap=town, targetX=back[0], targetY=back[1],
              facing="up" if town == "saltmere" else "down", transition="iris", enterDir=enter)

    way_out("exit", ex, ey, way)
    way_out("chamber_exit", cx, h - 1, "down")
    for y in range(5, h - 1):
        m.put("ground", cx - 1, y, tile("rug_l"))
        m.put("ground", cx, y, tile("rug"))
        m.put("ground", cx + 1, y, tile("rug_r"))
    for x, y in ((x0 + 2, 3), (x0 + CHAMBER_W - 3, 3), (x0 + 2, h - 3), (x0 + CHAMBER_W - 3, h - 3)):
        m.put("objects", x, y, tile("deco"), SOLID)

    px, py = next((x, y) for y, r in enumerate(rows) for x, c in enumerate(r) if c == "P")
    plaques = [(x, y) for y in range(gh - 1) for x in range(gw) if wall(x, y) and not wall(x, y + 1) and (x, y) != (ex, ey)]
    sx, sy = min(plaques, key=lambda c: abs(c[0] - px) + abs(c[1] - py))
    m.put("ground", sx, sy, tile("plaque"))
    m.obj("signs", "hint", sx, sy, text=gym["hint"] + " Stuck? Walk back out and the room resets.")
    leader_story(m, leader, cx, 3, "down", *filter(None, [EXTRA.get(leader)]))
    return finish(m.build(), m)


MAPS = {f"{room[0]}_gym": (lambda who=who: build(who)) for who, room in ROOMS.items()}
