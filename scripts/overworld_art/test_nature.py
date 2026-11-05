"""Checks for the nature tileset. Run from the repo root:

    python -m unittest scripts.overworld_art.test_nature -v
"""
import json
import unittest
from pathlib import Path

from .nature import bush, fence_tile, flowers, forest_tile, lawn_tile, pond_tile, tall_grass, trail_tile, tufts
from .tiles_v2 import E, N, S, Wb, blob_masks
from .world_palette import TALL, WORLD

MAPS = Path(__file__).resolve().parents[2] / "frontend" / "public" / "maps"
PHASES = [(0, 0), (1, 0), (0, 1), (1, 1)]


def alpha(img):
    return [img.getpixel((x, y))[3] for y in range(16) for x in range(16)]


def colours(img):
    return {"#%02x%02x%02x" % c[:3] for _, c in img.getcolors(9999) if c[3]}


class Blobs(unittest.TestCase):
    def test_trail_interior_is_solid_and_edges_are_open(self):
        self.assertTrue(all(a == 255 for p in PHASES for a in alpha(trail_tile(0, p))))
        for mask in blob_masks():
            if mask & 15:  # a corner-only notch rounds away inside the tile
                self.assertIn(0, alpha(trail_tile(mask, (0, 0))), mask)

    def test_lawn_is_always_opaque(self):
        for mask in blob_masks():
            self.assertTrue(all(a == 255 for a in alpha(lawn_tile(mask, (1, 0)))), mask)

    def test_forest_interior_is_opaque_for_the_map_border(self):
        for p in PHASES:
            self.assertTrue(all(a == 255 for a in alpha(forest_tile(0, p))))

    def test_trunks_show_only_on_the_south_rim(self):
        bark = set(WORLD["bark"])
        self.assertTrue(colours(forest_tile(S, (0, 0))) & bark)
        self.assertFalse(colours(forest_tile(0, (0, 0))) & bark)
        self.assertFalse(colours(forest_tile(N, (0, 0))) & bark)

    def test_forest_phases_differ(self):
        self.assertEqual(len({forest_tile(0, p).tobytes() for p in PHASES}), 4)

    def test_pond_is_opaque_and_animates(self):
        for mask in blob_masks():
            self.assertTrue(all(a == 255 for a in alpha(pond_tile(mask, 0))), mask)
        self.assertEqual(len({pond_tile(0, f).tobytes() for f in range(3)}), 3)


class Fence(unittest.TestCase):
    def test_vertical_run_has_no_gaps(self):
        t = fence_tile(N | S)
        self.assertTrue(all(t.getpixel((7, y))[3] for y in range(16)))

    def test_horizontal_run_reaches_both_tile_edges(self):
        t = fence_tile(E | Wb)
        self.assertTrue(any(t.getpixel((0, y))[3] for y in range(16)))
        self.assertTrue(any(t.getpixel((15, y))[3] for y in range(16)))

    def test_lone_post_stays_inside_the_tile(self):
        t = fence_tile(0)
        self.assertFalse(any(t.getpixel((0, y))[3] or t.getpixel((15, y))[3] for y in range(16)))


class Decor(unittest.TestCase):
    def test_decals_are_transparent(self):
        for img in (tufts(0), flowers(0, 0), bush()):
            self.assertIn(0, alpha(img))

    def test_tall_grass_fills_the_middle_of_a_patch_and_sways(self):
        for phase in (0, 1):
            self.assertTrue(all(a == 255 for a in alpha(tall_grass("meadow", 0, phase, 0))))
        self.assertNotEqual(tall_grass("meadow", 0, 0, 0).tobytes(), tall_grass("meadow", 0, 0, 1).tobytes())
        self.assertNotEqual(tall_grass("meadow", 0, 0, 0).tobytes(), tall_grass("meadow", 0, 1, 0).tobytes())

    def test_tall_grass_thins_out_raggedly_at_a_patch_edge(self):
        top = [tall_grass("meadow", N, 0, 0).getpixel((x, 1))[3] for x in range(16)]
        self.assertTrue(0 in top and 255 in top, "tips, with gaps between them")
        left = [tall_grass("meadow", Wb, 0, 0).getpixel((1, y))[3] for y in range(16)]
        self.assertTrue(0 in left and 255 in left)

    def test_every_biome_has_grass(self):
        for biome, ramp in TALL.items():
            self.assertEqual(len(ramp), 4, biome)
            self.assertTrue(all(a == 255 for a in alpha(tall_grass(biome, 0, 0, 0))), biome)


class BuiltMaps(unittest.TestCase):
    """Reads the committed maps, so run build_all first."""

    def layers(self, map_id):
        m = json.loads((MAPS / f"{map_id}.json").read_text())
        return m, {l["name"]: l for l in m["layers"]}

    def test_collision_tileset_sits_above_every_tile(self):
        m, _ = self.layers("dawnbrook")
        self.assertEqual(m["tilesets"][1]["firstgid"], 4000)
        self.assertLess(m["tilesets"][0]["tilecount"], 4000)

    def test_decor_sits_in_clusters_not_everywhere(self):
        from .tiles import tile_ids
        ids = tile_ids()
        scatter = {ids[n] + 1 for n in ("tufts", "flowers0", "flowers1")}
        m, l = self.layers("dawnbrook")
        w = m["width"]
        cells = {(i % w, i // w) for i, g in enumerate(l["decor"]["data"]) if g in scatter}
        self.assertGreater(len(cells), 8)
        self.assertLess(len(cells), 70)
        clustered = [c for c in cells if any((c[0] + dx, c[1] + dy) in cells
                                             for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy)]
        self.assertGreater(len(clustered), len(cells) * .6)


if __name__ == "__main__":
    unittest.main()
