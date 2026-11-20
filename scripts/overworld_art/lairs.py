"""The legendary lairs: four rooms off the gym towns, and the Hollow Lab past Zenith for the last.

Each lair opens from the gate cells marked X in town_layouts.json. A guard there turns back
anyone who is not yet Champion (the server only plays the legendaries once the campaign
reaches level 10). The legendaries still answer in the campaign's order, so one met too
early looks past you and names the lair that comes first.
"""
import json

from scripts import gen_overworld_placeholders as base

from . import world_maps as town
from .league import LEGENDS, hall, opening, statues
from .world_maps import ID, Town, finish, say

CHAMPION_FLAG = "trainer:kestrel_vane"
DIRS = {"up": (0, -1), "down": (0, 1), "left": (-1, 0), "right": (1, 0)}
BACK = {"up": "down", "down": "up", "left": "right", "right": "left"}

# legendary -> its lair. `gate`: host cells that lead in, walked into going `into`; `guard`: (x, y, facing);
# `theme`: the Gym art the chamber borrows; `door`: draw that theme's door on the gate cells.
LAIRS = {
    "articuno": dict(map="frostveil_cavern", host="saltmere", gate=[(37, 15)], into="right", guard=(35, 14, "right"),
                     theme="spire", props=[("time", "night"), ("weather", "snow")], ferry=True,
                     hint="A cold wind still blows from Frostveil Cavern, out past the Saltmere ferry.",
                     arrive="The ferry leaves you on a shelf of blue ice. Your breath hangs in the air and does not fall."),
    "zapdos": dict(map="stormcrown_pylon", host="dynamo", gate=[(28, 8), (28, 9)], into="right", guard=(27, 7, "down"),
                   theme="generator", props=[("time", "night"), ("ambient", "dust")],
                   hint="Thunder still rolls over Stormcrown Pylon, east of Dynamo Station.",
                   arrive="The old pylon's cables hang cut, and still they hum. Every hair on your arm stands up."),
    "moltres": dict(map="crater_throne", host="emberhold", gate=[(22, 1), (23, 1)], into="up", guard=(21, 3, "right"),
                    theme="forge", door=True, props=[("time", "dusk"), ("ambient", "embers")],
                    hint="The crater above Emberhold still burns brighter than its forge.",
                    arrive="The stairs end at the crater's heart. The lava here moves slowly, like something breathing."),
    "mew": dict(map="hidden_grove", host="mossgate", gate=[(3, 1), (4, 1)], into="up", guard=(5, 2, "left"),
                props=[("time", "dusk"), ("ambient", "fireflies")],
                hint="Something small still giggles in the Hidden Grove, north of Mossgate.",
                arrive="Past the roots the trees open on a clearing that should not fit between them. Somebody giggles."),
}
ORDER = [name for name, *_ in LEGENDS]
HINTS = {name: lair["hint"] for name, lair in LAIRS.items()}
W, H = 13, 11  # a chamber; the grove is a little bigger
GROVE_W, GROVE_H = 16, 12
ENTRY = {name: (W // 2, H - 2) for name in LAIRS} | {"mew": (GROVE_W // 2, GROVE_H - 2)}  # one step inside the way out


def front(lair):
    """Host cells in front of the gate, where the guard's check runs and where the lair lets you out."""
    dx, dy = DIRS[lair["into"]]
    return [(x - dx, y - dy) for x, y in lair["gate"]]


def legend_script(name, dex, cry):
    """Battle a legendary, but only once every earlier one in the campaign has been met."""
    waits = [{"op": "requireFlag", "flag": f"trainer:{prev}",
              "else": [{"op": "say", "text": f"{name.upper()} looks straight through you, toward somewhere else. {HINTS[prev]}"}]}
             for prev in ORDER[:ORDER.index(name)]]
    return [*waits, {"op": "cry", "dex": dex}, {"op": "say", "text": f"{name.upper()}: {cry}"}, {"op": "battle", "trainer": name}]


def place_legend(m, name, x, y, facing):
    dex, cry = next((d, c) for n, d, c in LEGENDS if n == name)
    m.obj("npcs", name, x, y, point=True, sprite=f"legend_{dex}", facing=facing, kind="legendary", dex=dex, shiny=False,
          hideFlag=f"trainer:{name}", script=json.dumps(legend_script(name, dex, cry)))
    m.block(x, y)


def gate(m, name):
    """The host side of a lair: gate cells that warp in, a guard, and the Champion check in front."""
    lair = LAIRS[name]
    door = lair.get("door")  # a door tile in a wall; the others open onto a pier, road or path
    for x, y in lair["gate"]:
        if door:
            m.put("ground", x, y, ID[f"gym_{lair['theme']}_exit"])
        m.block(x, y, 0)
        m.obj("warps", f"{lair['map']}_{x}_{y}", x, y, kind="door", targetMap=lair["map"], targetX=ENTRY[name][0],
              targetY=ENTRY[name][1], facing="up", transition="iris" if door else "fade", enterDir=lair["into"])
    cells = front(lair)
    xs, ys = [x for x, _ in cells], [y for _, y in cells]
    m.obj("triggers", f"{lair['map']}_seal", min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1, when="step",
          script=json.dumps([{"op": "requireFlag", "flag": CHAMPION_FLAG, "else": [
              {"op": "say", "text": "Hold it. Past here is League ground. Only the Champion of Aurelia goes on."},
              {"op": "cutsceneMove", "actor": "player", "path": [BACK[lair["into"]]]}]}]))
    gx, gy, facing = lair["guard"]
    m.obj("npcs", f"{lair['map']}_guard", gx, gy, point=True, sprite="sailor" if lair.get("ferry") else "gym_guide",
          facing=facing, script=json.dumps([{"op": "requireFlag", "flag": CHAMPION_FLAG, "else": [
              {"op": "say", "text": "League order. Nobody but the Champion passes. Come back with the title, not just the badges."}]},
              {"op": "say", "text": "Champion! The way's yours. Whatever's in there has waited a long time. Go gently."}]))
    m.block(gx, gy)


def chamber(name):
    """A walled hall in the host Gym's style, no rug: the legendary waits at the far end."""
    lair = LAIRS[name]
    theme = lair["theme"]
    m, cx = hall(W, H, theme)
    for y in range(2, H - 1):
        for x in (cx - 1, cx, cx + 1):
            m.put("ground", x, y, ID[f"gym_{theme}_floor{0 if theme == 'forge' else (x + y) % 2}"])
    m.props = [("nameKey", lair["map"]), *lair["props"]]
    statues(m, theme, W, H)
    bx, by = front(lair)[0]
    opening(m, theme, "exit", cx, H - 1, lair["host"], bx, by, BACK[lair["into"]], "down")
    place_legend(m, name, cx, 3, "down")
    m.obj("triggers", "arrival", 0, 0, when="enter", once=True, script=say(lair["arrive"]))
    return finish(m.build(), m)


def grove():
    """The Hidden Grove is outdoors: a clearing ringed by old trees, one path in from Mossgate."""
    lair = LAIRS["mew"]
    w, h = GROVE_W, GROVE_H
    m = Town(w, h, base.GRASS)
    m.props = [("nameKey", lair["map"]), ("border", town.BORDER), *lair["props"]]
    cx = w // 2
    beds = {(4, 3), (11, 3), (3, 7), (12, 7)}

    def cell(x, y):
        if x in (cx - 1, cx) and y > 4:
            return ","
        if y < 2 or y >= h - 2 or x < 2 or x >= w - 2:
            return "T"
        return "F" if (x, y) in beds else "."

    town.paint(m, ["".join(cell(x, y) for x in range(w)) for y in range(h)], "grass")
    for (hx, hy), x in zip(front(lair), (cx - 1, cx)):
        m.obj("warps", f"exit_{x}", x, h - 1, targetMap=lair["host"], targetX=hx, targetY=hy, facing="down",
              transition="fade", enterDir="down")
    place_legend(m, "mew", cx, 4, "down")
    m.obj("triggers", "arrival", 0, 0, when="enter", once=True, script=say(lair["arrive"]))
    town.autotile_paths(m)
    town.dress_grass(m)
    return finish(m.build(), m)


MAPS = {LAIRS[n]["map"]: (lambda n=n: chamber(n)) for n in LAIRS if n != "mew"} | {LAIRS["mew"]["map"]: grove}
