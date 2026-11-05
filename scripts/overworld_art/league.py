"""The end of the road: the League lobby and five rooms behind Zenith's great door,
and the Hollow Lab, the sealed cave a Champion can open.

Rooms run in a line. A door north stays shut until that room's trainer is beaten,
which the server records, so a lost run picks up at the next unbeaten room.
"""
import json

from scripts import gen_overworld_placeholders as base

from .world_maps import ID, SOLID, Town, VOICES, finish, say

LOBBY = "zenith_league"
CHAMPION = "kestrel_vane"
ROOM_LOOK = [("hollis_rime", "spire"), ("bastian_cairn", "dojo"), ("morwen_hallow", "dome"), ("drake_zephyrin", "forge"),
             (CHAMPION, "generator")]
ZENITH_DOOR = (14, 6)  # the cell in front of the League door
LAB_DOOR = (2, 3)  # the cell east of the Hollow Lab door
LEGENDS = [("articuno", 144, "Kyaaa!"), ("zapdos", 145, "Gyaoo!"), ("moltres", 146, "Gyaoo!"), ("mew", 151, "Mew!"), ("mewtwo", 150, "...!")]


def hall(w, h, theme):
    """A walled room with a rug up the middle. Returns the map and its centre column."""
    tile = lambda name: ID[f"gym_{theme}_{name}"]
    m = Town(w, h, base.GRASS)
    cx = w // 2
    seamless = theme in ("bakery", "forge")
    for y in range(h):
        for x in range(w):
            if y == 0 or x in (0, w - 1) or y == h - 1:
                side = ("l" if x == 0 and 0 < y < h - 1 else "") or ("r" if x == w - 1 and 0 < y < h - 1 else "")
                m.put("ground", x, y, tile(f"cap_{'r' if side == 'l' else 'l'}" if side else "cap"), SOLID)
            elif y == 1:
                m.put("ground", x, y, tile("face"), SOLID)
            else:
                m.put("ground", x, y, tile("floor0" if seamless else f"floor{(x + y) % 2}"))
    for y in range(2, h - 1):
        m.put("ground", cx - 1, y, tile("rug_l"))
        m.put("ground", cx, y, tile("rug"))
        m.put("ground", cx + 1, y, tile("rug_r"))
    return m, cx


def opening(m, theme, name, x, y, target, tx, ty, facing, enter):
    m.put("ground", x, y, ID[f"gym_{theme}_exit"])
    m.block(x, y, 0)
    m.obj("warps", name, x, y, kind="door", targetMap=target, targetX=tx, targetY=ty, facing=facing, transition="iris", enterDir=enter)


def statues(m, theme, w, h):
    for x, y in ((2, 3), (w - 3, 3), (2, h - 3), (w - 3, h - 3)):
        m.put("objects", x, y, ID[f"gym_{theme}_deco"], SOLID)


def lobby():
    w, h = 15, 11
    m, cx = hall(w, h, "spire")
    m.props = [("nameKey", "zenith")]
    opening(m, "spire", "exit", cx, h - 1, "zenith", *ZENITH_DOOR, "down", "down")
    opening(m, "spire", "league_door", cx, 1, "league_1", 5, 10, "up", "up")
    nurse = [{"op": "say", "text": "Welcome to the League. Shall I look after your team one last time?"}, {"op": "heal"},
             {"op": "say", "text": "All done. Whatever happens in there, you got here."}]
    shop = [{"op": "say", "text": "Last Mart in Aurelia. Nothing past that door sells anything."}, {"op": "shop", "shop": "origin_mart"}]
    m.obj("npcs", "nurse", 3, 3, point=True, sprite="nurse", facing="down", script=json.dumps(nurse))
    m.obj("npcs", "clerk", 11, 3, point=True, sprite="clerk", facing="down", script=json.dumps(shop))
    m.obj("npcs", "tutor", 2, 7, point=True, sprite="old_man", facing="right",
          script=say("I've taught moves to four Champions. One of them never told me why she wanted them."))
    for x, y in ((3, 3), (11, 3), (2, 7)):
        m.block(x, y)
    m.obj("triggers", "warning", 0, 0, when="enter", once=True,
          script=say("Beyond the north door are the Elite Four and the Champion, one room after another."))
    return finish(m.build(), m)


def room(index):
    trainer, theme = ROOM_LOOK[index]
    w, h = 11, 12
    m, cx = hall(w, h, theme)
    m.props = []
    last = index == len(ROOM_LOOK) - 1
    statues(m, theme, w, h)
    back = LOBBY if index == 0 else f"league_{index}"
    opening(m, theme, "back", cx, h - 1, back, 7 if index == 0 else cx, 2 if index == 0 else 2, "down", "down")
    if last:
        m.obj("triggers", "crowned", 0, 0, when="flag", flag=f"trainer:{CHAMPION}", once=True, script=json.dumps([
            {"op": "say", "text": "Kestrel Vane steps aside. Past her, the League's records stand open."},
            {"op": "say", "text": "Your name is written beneath every Champion before you. Dawnbrook to Zenith Summit, on foot."},
            {"op": "say", "text": "POKEMON ORIGINS. Thank you for playing. The Hollow Lab west of the summit now opens for a Champion."},
            {"op": "setFlag", "flag": "story:champion"},
            {"op": "warp", "map": "zenith", "x": ZENITH_DOOR[0], "y": ZENITH_DOOR[1], "facing": "down"}]))
    else:
        nxt = f"league_{index + 2}"
        opening(m, theme, "next", cx, 1, nxt, cx, h - 2, "up", "up")
        m.obj("triggers", "sealed", cx, 2, when="step", script=json.dumps([
            {"op": "requireFlag", "flag": f"trainer:{trainer}",
             "else": [{"op": "say", "text": "The door won't open while this room's trainer stands."},
                      {"op": "cutsceneMove", "actor": "player", "path": ["down"]}]}]))
    line = VOICES[trainer]["lose"]
    script = [{"op": "requireFlag", "flag": f"trainer:{trainer}", "not": True, "else": [{"op": "say", "text": line}]},
              {"op": "battle", "trainer": trainer}]
    # beside the rug's top so the way to the door stays clear
    m.obj("npcs", trainer, cx, 4, point=True, sprite=trainer, facing="down", script=json.dumps(script))
    m.block(cx, 4)
    return finish(m.build(), m)


LAB = [
    "##########################",
    "##########################",
    "#....#....#....#....#....#",
    "#....#....#....#....#....#",
    "#.........................",
    "#....#....#....#....#....#",
    "#....#....#....#....#....#",
    "##########################",
    "##########################",
]


def lab():
    """Five chambers on one corridor. Each legendary fills a doorway, so they come in the
    campaign's order, and each is gone once met. The floor under them stays walkable."""
    theme = "dome"
    tile = lambda name: ID[f"gym_{theme}_{name}"]
    w, h = len(LAB[0]), len(LAB)
    m = Town(w, h, base.GRASS)
    m.props = [("nameKey", "hollow_lab"), ("time", "night")]
    wall = lambda x, y: not (0 <= x < w and 0 <= y < h) or LAB[y][x] == "#"
    for y in range(h):
        for x in range(w):
            if wall(x, y):
                m.put("ground", x, y, tile("face" if not wall(x, y + 1) else "cap"), SOLID)
            else:
                m.put("ground", x, y, tile(f"floor{(x + y) % 2}"))
    opening(m, theme, "exit", w - 1, 4, "zenith", *LAB_DOOR, "right", "right")
    for (name, dex, cry), x in zip(LEGENDS, (20, 15, 10, 5, 2)):  # four doorways, then the last chamber
        script = [{"op": "cry", "dex": dex}, {"op": "say", "text": f"{name.upper()}: {cry}"}, {"op": "battle", "trainer": name}]
        m.obj("npcs", name, x, 4, point=True, sprite=f"legend_{dex}", facing="left", kind="legendary", dex=dex, shiny=False,
              hideFlag=f"trainer:{name}", script=json.dumps(script))
    m.obj("triggers", "arrival", 0, 0, when="enter", once=True, script=say(
        "Crates, cut chains and a great key left in the lock. Team Hollow broke the seal and ran from what was inside.",
        "Five old presences wait along the corridor. They have been asleep since before the League had a name."))
    m.sign("notes", 22, 1, "Hollow Lab, final entry: 'We wanted to know how Pokemon and people first met. We asked them. They answered.'")
    m.put("ground", 22, 1, tile("plaque"))
    return finish(m.build(), m)


MAPS = {LOBBY: lobby, "hollow_lab": lab, **{f"league_{i + 1}": (lambda i=i: room(i)) for i in range(len(ROOM_LOOK))}}
