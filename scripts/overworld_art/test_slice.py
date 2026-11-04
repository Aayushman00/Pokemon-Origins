"""Checks for the Phase 0 art slice. Run from the repo root:

    python -m unittest scripts.overworld_art.test_slice -v

These pin measurable rules from docs/design/ART_BIBLE.md. They prove limits,
not beauty: always look at docs/design/art-slice/before_after.png as well.
"""
import unittest

from PIL import Image, ImageOps

from .slice_art import fence, ground_layer, house, luma, mean_saturation, meadow, player_frames, tree
from .world_palette import LINE, WORLD


def hex_at(img, x, y):
    r, g, b, a = img.convert("RGBA").getpixel((x, y))
    return f"#{r:02x}{g:02x}{b:02x}" if a else None


def solid(hex_colour):
    return Image.new("RGBA", (1, 1), hex_colour)


class Ground(unittest.TestCase):
    def test_meadow_is_quiet(self):
        for v in range(4):
            self.assertLess(mean_saturation(meadow(v)), 0.35)
            l = sorted(luma(meadow(v)))
            self.assertLessEqual(l[int(len(l) * .95)] - l[int(len(l) * .05)], 0.15)

    def test_meadow_variants_have_no_seams(self):
        for a in range(4):
            for b in range(4):
                pair = Image.new("RGBA", (32, 16))
                pair.paste(meadow(a), (0, 0))
                pair.paste(meadow(b), (16, 0))
                px = pair.convert("L").load()
                seam = sum(abs(px[15, y] - px[16, y]) for y in range(16)) / 16
                inner = sum(abs(px[7, y] - px[8, y]) for y in range(16)) / 16
                self.assertLessEqual(seam, inner + 6)

    def test_transition_edges_are_broken_not_straight(self):
        img = ground_layer(["...", ".,.", "..."])
        self.assertEqual(img.size, (48, 48))
        trail = set(WORLD["trail"])
        rows = [sum(hex_at(img, x, y) in trail for x in range(48)) for y in range(48)]
        self.assertGreater(len({r for r in rows if r}), 3)

    def test_ground_is_opaque_and_never_black(self):
        img = ground_layer([".l,", "ll,", ",,,"])
        self.assertTrue(all(c[3] == 255 and c[:3] != (0, 0, 0) for _, c in img.getcolors(9999)))


class Objects(unittest.TestCase):
    def test_objects_carry_the_contrast(self):
        for img in (tree("A"), house()):
            l = sorted(luma(img))
            self.assertGreaterEqual(l[int(len(l) * .95)] - l[int(len(l) * .05)], 0.40)

    def test_house_roof_takes_over_half(self):
        roof, h = set(WORLD["roof_clay"]), house()
        rows = [y for y in range(80) if any(hex_at(h, x, y) in roof for x in range(80))]
        self.assertGreaterEqual(max(rows) + 1, 42)

    def test_windows_never_cross_a_tile_edge(self):
        glass, h = set(WORLD["glass"]), house()
        for edge in (16, 32, 48, 64):
            self.assertFalse(any(hex_at(h, edge - 1, y) in glass and hex_at(h, edge, y) in glass for y in range(80)))

    def test_fence_sizes(self):
        self.assertEqual(fence(4).size, (64, 16))
        self.assertEqual(fence(3, vertical=True).size, (16, 48))


class Player(unittest.TestCase):
    def test_size_and_feet(self):
        for f in player_frames().values():
            _, y0, _, y1 = f.getbbox()
            self.assertEqual(f.size, (16, 32))
            self.assertLessEqual(y1 - y0, 24)
            self.assertEqual(y1, 32)

    def test_side_view_is_narrow(self):
        x0, _, x1, _ = player_frames()["left"].getbbox()
        self.assertLessEqual(x1 - x0, 13)

    def test_right_mirrors_left(self):
        f = player_frames()
        self.assertEqual(ImageOps.mirror(f["left"]).tobytes(), f["right"].tobytes())

    def test_colour_budget(self):
        for f in player_frames().values():
            self.assertLessEqual(len([c for c in f.getcolors(999) if c[1][3]]), 15)

    def test_outline_stands_out_from_every_ground(self):
        line = luma(solid(LINE))[0]
        for ramp in ("meadow", "lawn", "trail"):
            self.assertGreaterEqual(min(luma(solid(c))[0] for c in WORLD[ramp]) - line, 0.40)


if __name__ == "__main__":
    unittest.main()
