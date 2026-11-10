"""Checks for the nature tileset. Run from the repo root:

    python -m unittest scripts.overworld_art.test_nature -v
"""
import json
import unittest
from pathlib import Path

from PIL import Image

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


class Milestone1(unittest.TestCase):
    """Hue-matched outlines, GBA colour budget, trail lip, lawn pockets."""

    def test_outline_is_darker_than_its_ramp_and_never_black(self):
        from .slice_art import luma
        from .world_palette import outline_for
        for name in ("leaf", "bark", "roof_clay", "stone", "wall"):
            ramp = WORLD[name]
            o = outline_for(ramp)
            self.assertNotEqual(o, "#000000", name)
            self.assertLess(luma(Image.new("RGBA", (1, 1), o))[0], luma(Image.new("RGBA", (1, 1), ramp[-1]))[0], name)

    def test_objects_drop_the_global_plum_line(self):
        from .nature import standing_tree
        from .world_palette import LINE
        for img in (forest_tile(N, (0, 0)), forest_tile(S | Wb, (1, 1)), standing_tree("A"), bush()):
            self.assertNotIn(LINE, colours(img))

    def test_tiles_fit_one_gba_palette(self):
        """16 colours per 4bpp palette, one slot being transparency."""
        from .nature import standing_tree
        imgs = [forest_tile(m, p, t) for m in (0, N, S) for p in PHASES for t in (None, "sun", "amber")]
        imgs += [trail_tile(m, p) for m in blob_masks() for p in PHASES] + [lawn_tile(m, (0, 0)) for m in blob_masks()]
        imgs += [standing_tree(k) for k in "ABF"]
        for img in imgs:
            self.assertLessEqual(len(colours(img)), 15)

    def test_grass_lip_hangs_over_the_trails_north_edge(self):
        t = trail_tile(N, (0, 0))
        tops = [next(y for y in range(16) if t.getpixel((x, y))[3]) for x in range(16)]
        self.assertGreater(len(set(tops)), 1, "the lip wanders, not a ruled line")
        rim = "#%02x%02x%02x" % t.getpixel((5, tops[5]))[:3]
        self.assertEqual(rim, WORLD["trail"][3], "shadow right under the lip")

    def test_lawn_variants_share_one_brightness(self):
        from .slice_art import _lawn, luma, meadow
        for make in (_lawn, meadow):
            means = [sum(luma(make(v))) / 256 for v in range(4)]
            self.assertLess(max(means) - min(means), .02)

    def test_built_maps_leave_no_meadow_pockets_in_lawn(self):
        from .tiles import tile_ids
        ids = tile_ids()
        grass = {ids[f"grass{i}"] + 1 for i in range(4)}
        lawn = {v + 1 for k, v in ids.items() if k.startswith("lawn_")}
        for map_id in ("route_1", "mossgate", "dawnbrook"):
            m = json.loads((MAPS / f"{map_id}.json").read_text())
            w, h = m["width"], m["height"]
            g = next(l for l in m["layers"] if l["name"] == "ground")["data"]
            for i, gid in enumerate(g):
                if gid in grass:
                    x, y = i % w, i // w
                    walls = sum(0 <= x + dx < w and 0 <= y + dy < h and g[(y + dy) * w + x + dx] in lawn
                                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                    self.assertLess(walls, 3, f"{map_id} ({x},{y})")


class Milestone2(unittest.TestCase):
    """Ledges and cliff masses: lip, face, shadow; tiles that join; one palette each."""

    def test_ledge_is_lip_then_face_then_shadow(self):
        from .nature import ledge
        t = ledge("m")
        col = [t.getpixel((8, y)) for y in range(16)]
        self.assertEqual(col[0][3], 0, "ground shows above the lip")
        self.assertEqual("#%02x%02x%02x" % col[2][:3], WORLD["lawn"][0], "lit lip edge")
        self.assertTrue(all(0 < c[3] < 255 for c in col[14:]), "cast shadow on the ground below")

    def test_ledges_and_side_ledges_join_up(self):
        from .nature import ledge, side_ledge
        def strip(img, box):
            return list(img.crop(box).getchannel("A").getdata())

        m = ledge("m")
        self.assertEqual(strip(m, (0, 0, 1, 16)), strip(m, (15, 0, 16, 16)), "row of ledges has no gaps")
        for side in "ew":
            s = side_ledge(side)
            width = [sum(a == 255 for a in strip(s, (0, y, 16, y + 1))) for y in range(16)]
            self.assertTrue(all(abs(width[y] - width[y - 1]) <= 1 for y in range(16)), side)  # y=0 checks the wrap

    def test_side_ledges_mirror(self):
        from .nature import side_ledge
        e, w = side_ledge("e"), side_ledge("w")
        self.assertEqual(alpha(e), alpha(w.transpose(Image.FLIP_LEFT_RIGHT)))

    def test_cliff_tiles_fit_one_gba_palette_and_have_a_base(self):
        from .town_art import MASSES, mass_face, mass_top
        from .world_palette import outline_for
        for name in MASSES:
            for mask in range(8):
                self.assertLessEqual(len(colours(mass_top(name, mask & 1, mask & 2, mask & 4).img)), 15, name)
            for mask in range(4):
                face = mass_face(name, mask & 1, mask & 2).img
                self.assertLessEqual(len(colours(face)), 15, name)
                self.assertEqual("#%02x%02x%02x" % face.getpixel((8, 15))[:3], outline_for(MASSES[name][1]), name)

    def test_cliff_faces_cast_a_shadow_on_built_routes(self):
        from .tiles import tile_ids
        ids = tile_ids()
        shadow = ids["mass_shadow"] + 1
        import re
        faces = {v + 1 for k, v in ids.items() if re.fullmatch(r"m_[a-z]+_f\d(_\d)?", k)}
        for map_id in ("route_3", "route_7"):
            m = json.loads((MAPS / f"{map_id}.json").read_text())
            w = m["width"]
            l = {x["name"]: x["data"] for x in m["layers"] if "data" in x}
            below = [i + w for i, g in enumerate(l["ground"]) if g in faces and i + w < len(l["ground"])
                     and l["ground"][i + w] not in faces]
            shaded = sum(l["decor"][i] == shadow for i in below)
            self.assertGreater(shaded, len(below) * .6, map_id)


class Milestone4(unittest.TestCase):
    def count(self, img, colour):
        return sum(p[:3] == tuple(int(colour[i:i + 2], 16) for i in (1, 3, 5)) for p in img.get_flattened_data())

    def test_foam_laps_the_shore(self):
        """Foam spreads on the middle frame and recedes on the last."""
        foam = WORLD["water"][0]
        for mask in (S, E | S, N | E | S):  # open water to the north: a south or east shore
            a, b, c = (self.count(pond_tile(mask, f), foam) for f in range(3))
            self.assertGreater(b, a, mask)
            self.assertGreater(a, c, mask)

    def test_north_bank_shades_the_water(self):
        self.assertGreater(self.count(pond_tile(N, 0), WORLD["water"][3]), 4)

    def test_open_water_moves_every_frame(self):
        full = max(blob_masks())
        self.assertEqual(len({pond_tile(full, f).tobytes() for f in range(3)}), 3)


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
