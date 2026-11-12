"""World dressing: ground that wanders, trees, pond life, ledges, props."""
import unittest

from . import nature
from . import world_maps as W
from .tiles import new_tiles


def layer(data, name):
    return next(l for l in data["layers"] if l["name"] == name)["data"]


def cells(data, layer_name, prefix):
    w = data["width"]
    return {(i % w, i // w) for i, g in enumerate(layer(data, layer_name))
            if g and W.NAMES_BY_ID.get(g - 1, "").startswith(prefix)}


class Ground(unittest.TestCase):
    def setUp(self):
        self.grid = ["." * 40] * 8 + ["T" * 40] + ["." * 40] * 8
        self.lawn = W.halo(self.grid)

    def test_lawn_hugs_what_stands_on_it(self):
        self.assertTrue({(x, 8) for x in range(40)} <= self.lawn)

    def test_the_edge_wanders(self):
        reach = {x: max(abs(y - 8) for y in range(17) if (x, y) in self.lawn) for x in range(40)}
        self.assertGreater(len(set(reach.values())), 1)


class Towns(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dawn = W.dawnbrook()
        cls.moss = W.mossgate()

    def test_towns_have_standing_trees(self):
        self.assertTrue(cells(self.dawn, "objects", "tree"))
        self.assertTrue(cells(self.dawn, "above", "tree"))

    def test_a_tree_blocks_at_the_trunk_not_the_canopy(self):
        col = layer(self.dawn, "collision")
        w = self.dawn["width"]
        for x, y in cells(self.dawn, "objects", "tree"):
            self.assertTrue(col[y * w + x], (x, y))
        for x, y in cells(self.dawn, "above", "tree"):
            self.assertFalse(col[y * w + x], (x, y))

    def test_ponds_have_life(self):
        self.assertTrue(cells(self.dawn, "decor", "lily"))
        self.assertTrue(cells(self.dawn, "decor", "reeds"))

    def test_homes_get_mail_and_mats(self):
        self.assertGreaterEqual(len(cells(self.dawn, "objects", "prop_mailbox")), 2)
        self.assertIn((7, 7), cells(self.dawn, "objects", "doormat"))

    def test_mats_stay_walkable(self):
        w = self.dawn["width"]
        for x, y in cells(self.dawn, "objects", "doormat"):
            self.assertFalse(layer(self.dawn, "collision")[y * w + x], (x, y))

    def test_nothing_lays_a_grey_block_on_the_ground(self):
        self.assertFalse(cells(self.dawn, "objects", "cast_"))
        self.assertFalse(cells(self.moss, "objects", "cast_"))

    def test_clouds_drift_over_the_outdoors(self):
        for data in (self.dawn, W.route("route_1")):
            self.assertIn("clouds", [p["name"] for p in data["properties"]])

    def test_chimneys_smoke(self):
        tiles = self.dawn["tilesets"][0]["tiles"]
        smoking = [t for t in tiles if any(p["name"] == "smoke" for p in t.get("properties", []))]
        self.assertTrue(smoking)


class Route(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = W.route("route_1")

    def test_ledges_drop_the_way_they_face(self):
        col = layer(self.data, "collision")
        w = self.data["width"]
        side = {(x, y): s for x, y0, y1, s in W.SIDE_LEDGES["route_1"] for y in range(y0, y1 + 1)}
        ledges = cells(self.data, "objects", "ledge_")
        self.assertGreaterEqual(len(ledges), 6 + len(side))
        for x, y in ledges:  # COL: 2 down, 3 left, 4 right
            self.assertEqual(col[y * w + x] - W.COL_FIRST + 1, {"e": 4, "w": 3}.get(side.get((x, y)), 2), (x, y))

    def test_dressing_stays_off_the_trail(self):
        decor = layer(self.data, "decor")
        w = self.data["width"]
        for x, y, _ in W.DRESSING["route_1"]:
            self.assertFalse(W.NAMES_BY_ID.get(decor[y * w + x] - 1, "").startswith("trail_"), (x, y))


class Terrain(unittest.TestCase):
    def test_forests_are_not_one_green(self):
        data = W.route("route_1")
        tones = {t for t in ("sun", "deep", "amber") if cells(data, "objects", f"forest_{t}")}
        self.assertGreaterEqual(tones, {"sun", "deep"})

    def test_tones_never_touch_a_forest_rim(self):
        data = W.route("route_1")
        grid = W.ROUTES["route_1"]["grid"]
        for t in ("sun", "deep", "amber"):
            for x, y in cells(data, "objects", f"forest_{t}"):
                near = [grid[y + dy][x + dx] for dx in (-1, 0, 1) for dy in (-1, 0, 1)
                        if 0 <= y + dy < len(grid) and 0 <= x + dx < len(grid[0])]
                self.assertTrue(all(c in "Tb" for c in near), (x, y))

    def test_tones_keep_the_clump_shapes(self):
        plain = nature._canopy().convert("RGB")
        sun = nature._canopy("sun").convert("RGB")
        self.assertNotEqual(plain.tobytes(), sun.tobytes())
        self.assertEqual(plain.crop((0, 0, 32, 1)).tobytes(), sun.crop((0, 0, 32, 1)).tobytes())

    def test_a_ledge_has_a_real_face(self):
        alpha = nature.ledge("m").getchannel("A").load()
        self.assertGreaterEqual(sum(alpha[8, y] > 0 for y in range(16)), 10)


class Shadows(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tiles = dict(new_tiles())

    def soft(self, name):
        return {a for a in self.tiles[name].getchannel("A").getdata() if 0 < a < 255}

    def test_props_and_trees_stand_on_a_shadow(self):
        for name in ("prop_mailbox", "prop_barrel", "bush", "treeA_0_1", "treeB_1_1", "ledge_m", "ledge_e", "mass_shadow"):
            self.assertTrue(self.soft(name), name)

    def test_the_ground_itself_stays_clean(self):
        for name in ("pebbles", "doormat"):
            self.assertFalse(self.soft(name), name)


class OffTheMeadow(unittest.TestCase):
    """Dynamo stands for every biome town: zoned ground, edged roads, strung wire."""

    @classmethod
    def setUpClass(cls):
        from .towns import MAPS
        cls.town = MAPS["dynamo"]()

    def test_bare_ground_is_zoned_and_roads_are_edged(self):
        for prefix in ("turf_", "verge_", "kerb_"):
            self.assertGreater(len(cells(self.town, "decor", prefix)), 10, prefix)

    def test_every_span_of_wire_ends_on_a_pylon_arm(self):
        wire, tops = cells(self.town, "above", "o_wire"), cells(self.town, "above", "o_pylon_top_")
        self.assertTrue(wire)
        for x, y in wire:
            for side in (-1, 1):
                self.assertIn((x + side, y), wire | tops, (x, y))

    def test_buildings_stand_on_a_shadow_inside_their_own_tiles(self):
        tiles = dict(new_tiles())
        for name in ("home_clay_1_4", "bld_dynamo_0_1_5"):  # bottom rows
            self.assertTrue({a for a in tiles[name].getchannel("A").tobytes() if 0 < a < 255}, name)


if __name__ == "__main__":
    unittest.main()
