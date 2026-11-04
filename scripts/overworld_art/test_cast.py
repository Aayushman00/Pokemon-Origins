"""Checks for the cast's body builds and player redesign. Run from the repo root:

    python -m unittest scripts.overworld_art.test_cast -v
"""
import unittest

from PIL import Image

from .characters import ROSTER
from .palette import OUTLINE
from .sheets import build_sheet
from .world_palette import LINE

BY_ID = {c["id"]: c for c in ROSTER}


def stand(cid, row=0):
    return build_sheet(BY_ID[cid]).crop((0, row * 32, 16, row * 32 + 32))


def height(img):
    _, y0, _, y1 = img.getbbox()
    return y1 - y0


def torso_width(img):
    row = [x for x in range(16) if img.getpixel((x, 26))[3]]
    return row[-1] - row[0] + 1


class Builds(unittest.TestCase):
    def test_children_are_shorter_than_adults(self):
        self.assertLess(height(stand("youngster")), height(stand("cooltrainer_m")))
        self.assertLess(height(stand("twin")), height(stand("cooltrainer_f")))

    def test_heavy_builds_are_wider_than_adults(self):
        self.assertGreater(torso_width(stand("hiker")), torso_width(stand("cooltrainer_m")))

    def test_elders_stoop(self):
        self.assertLess(height(stand("old_man")), height(stand("gentleman")))

    def test_feet_stay_on_the_cell_floor_for_every_build(self):
        for cid in ("youngster", "hiker", "old_man", "player"):
            self.assertEqual(stand(cid).getbbox()[3], 32, cid)


class Players(unittest.TestCase):
    def test_outline_matches_the_world(self):
        self.assertEqual(OUTLINE, LINE)

    def test_player_has_no_cap_material(self):
        for cid in ("player", "player_f"):
            self.assertNotIn("c", BY_ID[cid]["mats"], cid)

    def test_players_are_not_clones(self):
        self.assertNotEqual(stand("player").tobytes(), stand("player_f").tobytes())


if __name__ == "__main__":
    unittest.main()
