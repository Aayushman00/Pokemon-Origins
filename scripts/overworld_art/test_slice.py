"""Checks for the Phase 0 art slice. Run from the repo root:

    python -m unittest scripts.overworld_art.test_slice -v

These pin measurable rules from docs/design/ART_BIBLE.md. They prove limits,
not beauty: always look at docs/design/art-slice/before_after.png as well.
"""
import unittest

from PIL import Image

from .slice_art import fence, ground_layer, house, luma, mean_saturation, meadow, tree
from .world_palette import WORLD


def hex_at(img, x, y):
    r, g, b, a = img.convert("RGBA").getpixel((x, y))
    return f"#{r:02x}{g:02x}{b:02x}" if a else None


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


if __name__ == "__main__":
    unittest.main()
