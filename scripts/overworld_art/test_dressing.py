"""World dressing: ground that wanders, trees, pond life, shadows, ledges, props."""
import unittest

from . import world_maps as W


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

    def test_buildings_cast_shadows_east_and_south(self):
        self.assertIn((10, 4), cells(self.dawn, "objects", "cast_e"))
        self.assertTrue(cells(self.dawn, "objects", "cast_s"))

    def test_shadows_are_never_solid(self):
        w = self.moss["width"]
        for x, y in cells(self.moss, "objects", "cast_"):
            self.assertFalse(layer(self.moss, "collision")[y * w + x], (x, y))

    def test_chimneys_smoke(self):
        tiles = self.dawn["tilesets"][0]["tiles"]
        smoking = [t for t in tiles if any(p["name"] == "smoke" for p in t.get("properties", []))]
        self.assertTrue(smoking)


class Route(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = W.route("route_1")

    def test_ledges_drop_south_only(self):
        col = layer(self.data, "collision")
        w = self.data["width"]
        ledges = cells(self.data, "objects", "ledge_")
        self.assertGreaterEqual(len(ledges), 6)
        for x, y in ledges:
            self.assertEqual(col[y * w + x] - W.COL_FIRST + 1, 2, (x, y))

    def test_dressing_stays_off_the_trail(self):
        decor = layer(self.data, "decor")
        w = self.data["width"]
        for x, y, _ in W.DRESSING["route_1"]:
            self.assertFalse(W.NAMES_BY_ID.get(decor[y * w + x] - 1, "").startswith("trail_"), (x, y))


if __name__ == "__main__":
    unittest.main()
