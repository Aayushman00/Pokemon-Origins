"""Route surfaces: a worn trail through meadow, on an unchanged walkable layout."""
import json
import unittest
from collections import deque

from . import world_maps as W
from . import nature
from .slice_art import T
from .tiles import tileset_image


def layer(data, name):
    return next(l for l in data["layers"] if l["name"] == name)["data"]


class WornTrail(unittest.TestCase):
    def test_marks_only_open_cells(self):
        grid = ["....", ".T..", "...."]
        self.assertEqual(W.worn(grid, [[(0, 0), (2, 0)]]), [",,,,", ",T,,", "...."])

    def test_a_footpath_is_one_cell_wide(self):
        self.assertEqual(W.worn(["...", "..."], [[(0, 0), (2, 0)]], 1), [",,,", "..."])

    def test_stops_at_the_map_edge(self):
        self.assertEqual(W.worn(["..", ".."], [[(1, 1), (1, 1)]]), ["..", ".,"])


class Route1(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.r = W.ROUTES["route_1"]
        cls.data = W.route("route_1")
        cls.w, cls.h = cls.r["w"], cls.r["h"]
        cls.trail = {(i % cls.w, i // cls.w) for i, g in enumerate(layer(cls.data, "decor"))
                     if g and W.NAMES_BY_ID.get(g - 1, "").startswith("trail_")}

    def open_cells(self):
        return {(x, y) for y, row in enumerate(self.r["grid"]) for x, c in enumerate(row) if c == "."}

    def test_most_of_the_open_ground_is_meadow(self):
        self.assertLess(len(self.trail), len(self.open_cells()) * 0.6)

    def test_trail_stays_on_open_ground(self):
        self.assertLessEqual(self.trail, self.open_cells())

    def test_trail_joins_west_to_east_by_the_north_fork_through_one_grass_strip(self):
        """The road fades under the tall grass at x 19-22 and picks up on the far side."""
        strip = {(x, y) for y in (4, 5, 6) for x in range(19, 23) if self.r["grid"][y][x] == "g"}
        self.assertFalse(strip & self.trail)
        road = self.trail | strip
        seen, todo = {(0, 9)}, deque([(0, 9)])
        while todo:
            x, y = todo.popleft()
            for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if n in road and n not in seen:
                    seen.add(n)
                    todo.append(n)
        self.assertIn((39, 9), seen)

    def test_collision_still_follows_the_layout(self):
        col = layer(self.data, "collision")
        people = {(t["x"], t["y"]) for t in self.r["trainers"]}
        people |= {(x, y) for x, y, _ in W.DRESSING["route_1"]}
        people |= {(x, y) for x0, x1, y in W.LEDGES["route_1"] for x in range(x0, x1 + 1)}
        people |= {(x, y) for x, y0, y1, _ in W.SIDE_LEDGES["route_1"] for y in range(y0, y1 + 1)}
        for y, row in enumerate(self.r["grid"]):
            for x, c in enumerate(row):
                if (x, y) not in people:
                    self.assertEqual(bool(col[y * self.w + x]), c in "Tb", (x, y))

    def test_tall_grass_has_a_tufted_fringe(self):
        decor = layer(self.data, "decor")
        fringe = [1 for y, row in enumerate(self.r["grid"]) for x, c in enumerate(row)
                  if c == "." and (x, y) not in self.trail and decor[y * self.w + x] - 1 == W.ID["tufts"]
                  and any(self.r["grid"][y + dy][x + dx] == "g" for dx in (-1, 0, 1) for dy in (-1, 0, 1)
                          if 0 <= y + dy < self.h and 0 <= x + dx < self.w)]
        self.assertGreaterEqual(len(fringe), 4)


class Ground(unittest.TestCase):
    def test_outdoor_ground_is_never_see_through(self):
        """A transparent ground tile shows as a black square in the game."""
        sheet = tileset_image()[0]
        cols = sheet.width // T
        for name in ("dawnbrook", "route_1", "mossgate", "legend_grove"):
            data = json.loads((W.ROOT / "frontend" / "public" / "maps" / f"{name}.json").read_text())
            for gid in set(layer(data, "ground")):
                i = gid - 1
                tile = sheet.crop(((i % cols) * T, (i // cols) * T, (i % cols + 1) * T, (i // cols + 1) * T))
                self.assertEqual(tile.getchannel("A").getextrema()[0], 255, (name, W.NAMES_BY_ID.get(i, i)))


class Bridge(unittest.TestCase):
    def seams(self, img):
        px = img.convert("RGB").load()
        return sum(px[x, 8] != px[x + 1, 8] for x in range(15)), sum(px[8, y] != px[8, y + 1] for y in range(15))

    def test_boards_lie_across_the_way_you_walk(self):
        across, along = self.seams(nature.plank(True))
        self.assertGreater(across, along)
        across, along = self.seams(nature.plank(False))
        self.assertLess(across, along)

    def test_deck_is_solid(self):
        self.assertEqual(nature.plank(True).getchannel("A").getextrema()[0], 255)

    def test_a_row_of_planks_runs_east_west(self):
        m = W.Town(3, 3, W.base.GRASS)
        W.paint(m, ["...", "kkk", ".k."], "grass")
        self.assertEqual(m.ground[m.i(0, 1)] - 1, W.ID["plank"])
        self.assertEqual(m.ground[m.i(1, 2)] - 1, W.ID["plank_v"])


class DawnbrookStarterGate(unittest.TestCase):
    def test_route_1_stays_shut_until_a_starter_is_picked(self):
        data = W.dawnbrook()
        gate = next(o for l in data["layers"] if l["name"] == "triggers" for o in l["objects"] if o["name"] == "starter_gate")
        self.assertEqual((gate["x"] // 16, gate["y"] // 16, gate["width"] // 16, gate["height"] // 16), (29, 9, 1, 2))
        props = {p["name"]: p["value"] for p in gate["properties"]}
        ops = json.loads(props["script"])
        self.assertEqual((props["when"], ops[0]["op"], ops[0]["flag"]), ("step", "requireFlag", "story:starter"))
        self.assertNotIn("not", ops[0])
        self.assertEqual(ops[0]["else"][-1], {"op": "cutsceneMove", "actor": "player", "path": ["left"]})


class ShoreZones(unittest.TestCase):
    """Reeds (`q`) beside water carry the route's water table (wild encounters design)."""

    def test_reeds_hold_the_water_table_beside_water_and_no_trainer(self):
        from . import towns
        for rid in ("route_2", "route_4", "route_7"):
            with self.subTest(rid):
                r, table = W.ROUTES[rid], towns.WATER_TABLES[rid]
                grid = r["grid"]
                group = next(l for l in towns.route(rid)["layers"] if l["name"] == "encounters")["objects"]
                tiles = set()
                for o in group:
                    if {"name": "table", "type": "string", "value": table} in o.get("properties", []):
                        x0, y0 = o["x"] // 16, o["y"] // 16
                        tiles |= {(x0 + dx, y0 + dy) for dx in range(o["width"] // 16) for dy in range(o["height"] // 16)}
                reeds = {(x, y) for y, row in enumerate(grid) for x, c in enumerate(row) if c == "q"}
                self.assertTrue(reeds)
                self.assertEqual(tiles, reeds)
                at = lambda x, y: grid[y][x] if 0 <= y < len(grid) and 0 <= x < len(grid[y]) else ""
                for x, y in reeds:
                    near = {at(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))}
                    self.assertTrue(near & {"~", "q"}, (rid, x, y))
                self.assertFalse({(t["x"], t["y"]) for t in r["trainers"]} & reeds)


if __name__ == "__main__":
    unittest.main()
