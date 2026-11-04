"""Battle portraits of the Gym Leaders and League. Run from the repo root:

    python -m unittest scripts.overworld_art.test_portraits -v
"""
import json
import unittest
from pathlib import Path

from .portraits import PORTRAITS, draw

ROOT = Path(__file__).resolve().parents[2]
TRAINERS = ROOT / "backend" / "data" / "trainers"


def leaders():
    out = {}
    for name in ("gym_leaders", "elite_four", "champion"):
        out.update(json.loads((TRAINERS / f"{name}.json").read_text(encoding="utf8")))
    return out


class Portraits(unittest.TestCase):
    def test_every_leader_has_a_portrait(self):
        for trainer in leaders().values():
            self.assertIn(trainer["sprite"], PORTRAITS)

    def test_portraits_fill_a_64_pixel_frame(self):
        for name in PORTRAITS:
            img = draw(name)
            self.assertEqual(img.size, (64, 64), name)
            self.assertGreaterEqual(img.getbbox()[3] - img.getbbox()[1], 50, name)

    def test_feet_reach_the_bottom_of_the_frame(self):
        for name in PORTRAITS:
            self.assertEqual(draw(name).getbbox()[3], 64, name)

    def test_background_is_transparent_with_hard_edges(self):
        for name in PORTRAITS:
            alphas = {a for a in draw(name).getchannel("A").getdata()}
            self.assertEqual(alphas, {0, 255}, name)

    def test_no_two_portraits_share_an_outline(self):
        shapes = {draw(n).getchannel("A").tobytes(): n for n in PORTRAITS}
        self.assertEqual(len(shapes), len(PORTRAITS))

    def test_each_portrait_is_written_to_disk(self):
        for name in PORTRAITS:
            self.assertTrue((ROOT / "frontend" / "public" / "sprites" / "trainers" / f"{name}.png").exists(), name)


if __name__ == "__main__":
    unittest.main()
