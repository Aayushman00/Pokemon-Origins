"""Checks for the Phase 0 art slice. Run from the repo root:

    python -m unittest scripts.overworld_art.test_slice -v

These pin measurable rules from docs/design/ART_BIBLE.md. They prove limits,
not beauty: always look at docs/design/art-slice/before_after.png as well.
"""
import unittest

from PIL import Image

from .slice_art import ground_layer, luma, mean_saturation, meadow
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


if __name__ == "__main__":
    unittest.main()
