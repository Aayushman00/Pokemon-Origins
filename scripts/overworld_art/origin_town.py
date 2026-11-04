"""Origin Town: the showcase map (frontend/public/maps/origin_town.json).

Gym with a herringbone plaza, pines and log fences up top; the player's
house, a care centre and a mart; a ledge, tall grass, a pond with animated
shores and a cast of NPCs. Plain grass is broken up automatically: no
3x3 window may be bare grass (see `plain_windows`), stricter
than the "nothing larger than ~4x4" brief so the field always reads busy.
"""
import json

from scripts import gen_overworld_placeholders as base

from .tiles import FIRST_NEW, new_tiles, tile_ids

W, H = 32, 28
COL_FIRST = 1000  # collision tileset firstgid: above every overworld tile id
ID = tile_ids()
TREE, PATH, LEDGE, MAILBOX, ROCK, WA, WB, FA, FB, TALL_OLD = (
    base.TREE, base.PATH, base.LEDGE, base.MAILBOX, base.ROCK, base.WA, base.WB, base.FA, base.FB, base.TALL)
GRASS_IDS = {base.GRASS} | {ID[f"grass{i}"] for i in range(4)}
SOLID, L_DOWN = base.SOLID, base.L_DOWN


def say(*texts):
    return json.dumps([{"op": "say", "text": t} for t in texts])


class Town(base.MapBuilder):
    def building(self, name, x0, y0, cols, rows, roof_rows=2):
        for r in range(rows):
            for c in range(cols):
                layer = "above" if r < roof_rows - 1 else "objects"
                self.put(layer, x0 + c, y0 + r, ID[f"{name}_{c}_{r}"], SOLID)

    def skirt(self, x0, y0, x1, y1):
        self.fill("ground", x0, y0, x1, y1, ID["mown"])

    def npc(self, name, x, y, sprite, facing, *lines):
        self.obj("npcs", name, x, y, point=True, sprite=sprite, facing=facing, script=say(*lines))
        self.block(x, y)

    def sign(self, name, x, y, text):
        self.obj("signs", name, x, y, text=text)
        self.block(x, y)


def hashed(x, y):
    return (x * 73856093 ^ y * 19349663) & 0xFFFF


def plain_windows(m, size=3):
    """Top-left corners of size x size windows that are nothing but bare grass."""
    bad = []
    for y0 in range(H - size + 1):
        for x0 in range(W - size + 1):
            if all(m.ground[m.i(x, y)] - 1 in GRASS_IDS and not m.decor[m.i(x, y)] and not m.objects[m.i(x, y)]
                   and not m.above[m.i(x, y)]
                   for y in range(y0, y0 + size) for x in range(x0, x0 + size)):
                bad.append((x0, y0))
    return bad


def _free(m, x, y, lawn=False):
    """A grass cell with nothing on it (no path, decor, object, roof, NPC, sign).
    lawn=True also accepts the mown skirt around buildings."""
    if not (0 <= x < W and 0 <= y < H):
        return False
    i = m.i(x, y)
    ground_ok = GRASS_IDS | ({ID["mown"]} if lawn else set())
    if m.ground[i] - 1 not in ground_ok or m.decor[i] or m.objects[i] or m.above[i] or m.collision[i]:
        return False
    for group in ("npcs", "signs", "warps", "triggers"):
        for o in m.groups[group]:
            ox, oy = o["x"] // 16, o["y"] // 16
            ow, oh = max(1, o.get("width", 0) // 16), max(1, o.get("height", 0) // 16)
            if ox <= x < ox + ow and oy <= y < oy + oh:
                return False
    return True


def _occupied(m, x, y):
    """An NPC, sign, warp or trigger stands on this cell."""
    for group in ("npcs", "signs", "warps", "triggers"):
        for o in m.groups[group]:
            ox, oy = o["x"] // 16, o["y"] // 16
            ow, oh = max(1, o.get("width", 0) // 16), max(1, o.get("height", 0) // 16)
            if ox <= x < ox + ow and oy <= y < oy + oh:
                return True
    return False


def _walkable(m, x, y):
    return 0 <= x < W and 0 <= y < H and not m.collision[m.i(x, y)] and not m.objects[m.i(x, y)]


def _prop_ok(m, cells):
    """Every cell free grass, and the group leaves 3 of 4 sides of each cell walkable."""
    if not all(_free(m, x, y, lawn=True) for x, y in cells):
        return False
    group = set(cells)
    for x, y in cells:
        sides = [(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if (x + dx, y + dy) not in group]
        if sum(_walkable(m, *c) for c in sides) < len(sides) - 1:
            return False
    return True


def place_props(m):
    """Town dressing; each spot is skipped if it would block anything."""
    # barrels / crates against building walls (first spots that block nothing)
    buildings = [(3, 3, 4, 4), (24, 3, 4, 4), (25, 19, 4, 4)]
    for bx, by, bw, bh in buildings:
        placed = 0
        for y in range(by + 2, by + bh):  # wall rows only (not beside the roof)
            for x in (bx + bw, bx - 1):
                if placed < 2 and _prop_ok(m, [(x, y)]):
                    m.put("objects", x, y, ID["barrel" if placed == 0 else "crate"], SOLID)
                    placed += 1
    for x, y in ((14, 19), (17, 16), (10, 16)):  # lamps at the crossroads
        head_clear = not m.above[m.i(x, y - 1)] and not _occupied(m, x, y - 1)
        if _prop_ok(m, [(x, y)]) and head_clear:
            m.put("above", x, y - 1, ID["lamp_top"])
            m.put("objects", x, y, ID["lamp_base"], SOLID)
    for (x, y), pair in (((22, 14), ("bench_l", "bench_r")), ((8, 4), ("laundry_l", "laundry_r"))):
        if _prop_ok(m, [(x, y), (x + 1, y)]):
            m.put("objects", x, y, ID[pair[0]], SOLID)
            m.put("objects", x + 1, y, ID[pair[1]], SOLID)
    for x, y in ((2, 10), (3, 10)):  # vegetable bed behind the picket fence (walkable soil)
        if _free(m, x, y):
            m.put("ground", x, y, ID["veg"])


def stagger_edge(m):
    """Pines and bushes in front of the forest band so its edge is not a
    ruler line. Every ~3rd free edge cell, only where the cell inward is
    free grass and no path is adjacent (path mouths and walkways stay open)."""
    PATHS = {PATH, ID["pave"]}
    sides = [([(x, 2) for x in range(2, W - 2)], (0, 1)), ([(x, H - 3) for x in range(2, W - 2)], (0, -1)),
             ([(2, y) for y in range(3, H - 3)], (1, 0)), ([(W - 3, y) for y in range(3, H - 3)], (-1, 0))]
    n = 0
    for cells, (ix, iy) in sides:
        for x, y in cells:
            near_path = any(m.ground[m.i(x + dx, y + dy)] - 1 in PATHS
                            for dx in (-1, 0, 1) for dy in (-1, 0, 1) if 0 <= x + dx < W and 0 <= y + dy < H)
            if not _free(m, x, y) or not _free(m, x + ix, y + iy) or near_path:
                continue
            n += 1
            if n % 3:
                continue
            top_ok = y - 1 >= 0 and not m.above[m.i(x, y - 1)] and (y - 1 < 2 or _free(m, x, y - 1))
            if hashed(x, y) % 2 and top_ok:
                m.put("above", x, y - 1, ID["pine_top"])
                m.put("objects", x, y, ID["pine_base"], SOLID)
            else:
                m.put("objects", x, y, ID["bush"], SOLID)


def autotile_paths(m):
    """Swap every plain dirt-path cell for the blob tile matching its 8
    neighbours. Paving and the map edge count as path (no grass rim there)."""
    from .tiles_v2 import blob_mask
    joins = {PATH, ID["pave"]} | {ID["pave_" + e] for e in ("n", "s", "w", "e", "nw", "ne", "sw", "se")}
    is_path = [m.ground[i] - 1 == PATH for i in range(W * H)]

    def grass_at(x, y):
        if not (0 <= x < W and 0 <= y < H):
            return False
        return not (is_path[m.i(x, y)] or m.ground[m.i(x, y)] - 1 in joins)

    for y in range(H):
        for x in range(W):
            if is_path[m.i(x, y)]:
                mask = blob_mask(lambda dx, dy: grass_at(x + dx, y + dy))
                m.put("ground", x, y, ID[f"path_{mask}"])


def build():
    m = Town(W, H, base.GRASS)
    # off-map fill: the 2x2 forest block, picked by tile parity like FireRed
    m.props = [("border", ",".join(str(ID[f"forestA_{x}_{y}"]) for y in (0, 1) for x in (0, 1)))]

    # ground: four grass variants scattered so the field never tiles visibly
    for y in range(H):
        for x in range(W):
            m.put("ground", x, y, ID[f"grass{hashed(x, y) % 4}"])

    # forest border: one 2x2 tree deep on every side; leaf shade alternates
    # per 2x2 block so the wall is not one repeated stamp
    for y in range(H):
        for x in range(W):
            if y < 2 or y >= H - 2 or x < 2 or x >= W - 2:
                v = "A" if ((x // 2) + (y // 2)) % 2 == 0 else "B"
                m.put("objects", x, y, ID[f"forest{v}_{x % 2}_{y % 2}"], SOLID)

    # ---- paths
    m.fill("ground", 15, 13, 16, H - 3, PATH)
    m.fill("ground", 2, 17, W - 3, 18, PATH)
    m.fill("ground", 4, 8, 5, 16, PATH)
    m.fill("ground", 25, 8, 26, 16, PATH)
    m.fill("ground", 25, 23, 26, 24, PATH)

    # ---- gym, plaza, pines, fences, beds
    m.skirt(12, 2, 19, 7)
    m.building("gym", 13, 3, 6, 5)
    m.block(15, 7, 0)
    m.block(16, 7, 0)
    for x in (15, 16):  # door: read it like a sign
        m.put("objects", x, 7, ID[f"gym_{x - 13}_4"], SOLID)
    m.sign("gym_door", 15, 7, "ORIGIN GYM - Leader: Marina. The doors are locked for renovation. Train hard and come back soon!")
    m.sign("gym_door2", 16, 7, "ORIGIN GYM - Leader: Marina. The doors are locked for renovation. Train hard and come back soon!")
    for y in range(8, 13):
        for x in range(11, 21):
            edges = ("n" if y == 8 else "s" if y == 12 else "") + ("w" if x == 11 else "e" if x == 20 else "")
            m.put("ground", x, y, ID["pave_" + edges] if edges else ID["pave"])
    for (px, py) in ((10, 3), (21, 3), (10, 6), (21, 6)):
        m.put("above", px, py, ID["pine_top"])
        m.put("objects", px, py + 1, ID["pine_base"], SOLID)
    for x in list(range(10, 15)) + list(range(17, 22)):
        end = "log_l" if x in (10, 17) else "log_r" if x in (14, 21) else "logfence"
        m.put("objects", x, 13, ID[end], SOLID)
    for x, y in ((8, 9), (9, 9), (8, 10), (9, 10), (22, 9), (23, 9), (22, 10), (23, 10)):
        m.put("ground", x, y, ID["bedA" if (x + y) % 2 else "bed2A"])
    m.sign("gym_sign", 14, 12, "ORIGIN TOWN GYM - Leader: Marina, the tidal tactician.")
    m.put("objects", 14, 12, ID["gym_sign"], SOLID)

    # ---- player's house (left) and care centre (right)
    m.skirt(2, 3, 7, 8)
    m.building("house", 3, 3, 4, 4)
    m.sign("home_door", 4, 6, "It's your house. Mom left the door open for you.")
    m.put("objects", 7, 7, MAILBOX, SOLID)
    m.put("ground", 4, 7, ID["doormat"])
    for x, tile in ((2, "picket"), (3, "picket_r"), (6, "picket_l"), (7, "picket_r")):
        m.put("objects", x, 9, ID[tile], SOLID)
    m.skirt(24, 3, 29, 8)
    m.building("center", 24, 3, 4, 4)
    m.sign("center_door", 25, 6, "CARE CENTRE - Rest your team for free. Pokemon Origins trainers welcome!")
    m.put("objects", 28, 7, ID["bush"], SOLID)

    # ---- mart (bottom right) beside the pond
    m.skirt(24, 19, 29, 23)
    m.building("mart", 25, 19, 4, 4)
    m.sign("mart_door", 26, 22, "MART - Potions, Poke Balls and everything a new trainer needs.")
    m.fill("ground", 25, 23, 26, 25, PATH)

    # ---- pond: water autotile (sand bank, foam, ripples), lily pads, reeds
    from .tiles_v2 import blob_mask
    px0, py0, px1, py1 = 18, 20, 23, 25
    water = {(x, y) for y in range(py0, py1 + 1) for x in range(px0, px1 + 1)}
    water -= {(px0, py0), (px1, py0), (px0, py1), (px1, py1), (px1 - 1, py1)}  # organic outline
    for (x, y) in water:
        mask = blob_mask(lambda dx, dy: (x + dx, y + dy) not in water)
        m.put("ground", x, y, ID[f"pond_{mask}_0"], SOLID)
    for x, y in ((20, 22), (22, 24)):
        m.put("decor", x, y, ID["lily"])
    for x, y in ((18, 21), (23, 23)):
        m.put("decor", x, y, ID["reeds"])

    # ---- ledge, tall grass
    for x in range(2, 14):
        if x not in (4, 5):
            tile = "ledge_r" if x in (3, 13) else "ledge_l" if x == 6 else "ledge"
            m.put("decor", x, 15, ID[tile], L_DOWN)
    m.fill("ground", 3, 20, 9, 24, ID["tallA"])
    m.obj("encounters", "grass_origin", 3, 20, 7, 5, table="test_grass")

    # ---- props
    for x, y in ((12, 15), (21, 15), (28, 12), (2, 12), (10, 25)):
        m.put("objects", x, y, ID["bush"], SOLID)
    for x, y in ((8, 13), (28, 16), (13, 25)):
        m.put("objects", x, y, ID["rock2"], SOLID)
    for x, y in ((11, 21), (12, 22), (11, 24), (21, 14), (22, 15)):
        m.put("ground", x, y, ID["bedA" if (x + y) % 2 else "bed2A"])
    m.sign("town_sign", 14, 16, "ORIGIN TOWN - Where every Pokemon Origins journey begins.")
    m.put("objects", 14, 16, base.SIGN, SOLID)

    # ---- cast
    m.npc("guide", 12, 9, "gym_guide", "right", "Yo, champ in the making! The gym's closed, but Marina still trains out here.")
    m.npc("marina", 19, 10, "leader_f", "left", "I'm Marina. Water bends, but it never breaks. Come find me when you have a badge or two.")
    m.npc("mom", 6, 8, "mom", "down", "Off on an adventure? Don't forget to come home for dinner!")
    m.npc("nurse", 27, 9, "nurse", "down", "The care centre is open. Your team's health comes first!")
    m.npc("lass", 9, 12, "lass", "left", "Those flower beds sway when the wind comes off the pond. Pretty, right?")
    m.npc("youngster", 12, 19, "youngster", "up", "My Rattata is in the top percentage of Rattata! ...Probably.")
    m.npc("bugcatcher", 10, 22, "bug_catcher", "left", "Shh! There's something rustling in the tall grass.")
    m.npc("fisher", 17, 22, "fisherman", "right", "Nothing's biting today. The pond's too pretty to leave, though.")
    m.npc("sailor", 24, 25, "sailor", "up", "Ahoy! This pond's a little small for my ship.")
    m.npc("oldman", 21, 16, "old_man", "down", "When I was young there was no town here. Just grass, as far as you could see.")
    m.npc("hiker", 28, 14, "hiker", "left", "I climbed every hill around here. The view from Route 1 is the best!")
    m.npc("picnicker", 7, 25, "picnicker", "up", "I packed sandwiches for everyone! Well... for me.")
    m.npc("scientist", 22, 12, "scientist", "down", "The gym's roof is designed to reflect sunlight. Fascinating!")
    m.npc("rival", 17, 15, "rival", "left", "Took you long enough. I'll beat Marina before you do!")
    m.npc("twin", 2, 21, "twin", "right", "We're twins! My sister is... somewhere. Hiding.")

    # ---- props (placed only where they block nothing)
    place_props(m)

    # ---- stagger the forest edge: pine / bush clumps in front of the band
    stagger_edge(m)

    # ---- break up any remaining bare grass with tufts and tiny flowers
    decals = [ID["tufts"], ID["flowers0"], ID["flowers1"], ID["tufts"]]
    while True:
        bad = plain_windows(m)
        if not bad:
            break
        x0, y0 = bad[0]
        x, y = x0 + hashed(x0, y0) % 3, y0 + hashed(y0, x0) % 3
        m.put("decor", x, y, decals[hashed(x, y) % len(decals)])

    autotile_paths(m)
    data = m.build()
    return finish(data, m)


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
