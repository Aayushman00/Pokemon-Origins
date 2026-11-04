"""Checks for the building kit and props. Run from the repo root:

    python -m unittest scripts.overworld_art.test_buildings -v
"""
import json
import unittest
from pathlib import Path

from .buildings import BUILDINGS, PROPS
from .tiles import tile_ids
from .world_palette import WORLD

MAPS = Path(__file__).resolve().parents[2] / "frontend" / "public" / "maps"
IDS = tile_ids()


def hexes(img, box=None):
    part = img.crop(box) if box else img
    return {"#%02x%02x%02x" % c[:3] for _, c in part.convert("RGBA").getcolors(99999) if c[3]}


class Kit(unittest.TestCase):
    def test_each_building_is_whole_tiles_and_five_rows_tall(self):
        for name, (make, door_col) in BUILDINGS.items():
            img = make()
            self.assertEqual(img.height, 80, name)
            self.assertEqual(img.width % 16, 0, name)
            self.assertLess(door_col, img.width // 16, name)

    def test_door_cell_is_solid_art(self):
        for name, (make, door_col) in BUILDINGS.items():
            img = make()
            box = (door_col * 16 + 4, 64, door_col * 16 + 12, 78)
            self.assertTrue(all(c[3] for _, c in img.crop(box).getcolors(9999)), name)

    def test_landmarks_do_not_look_alike(self):
        art = {name: make().tobytes() for name, (make, _) in BUILDINGS.items()}
        self.assertEqual(len(set(art.values())), len(art))

    def test_props_sit_on_transparent_ground(self):
        for name, img in PROPS.items():
            self.assertEqual(img.getpixel((0, 0))[3], 0, name)
            self.assertIsNotNone(img.getbbox(), name)


class Placed(unittest.TestCase):
    def data(self, map_id):
        m = json.loads((MAPS / f"{map_id}.json").read_text())
        return m, {l["name"]: l for l in m["layers"]}

    def test_old_stamps_are_gone_from_the_towns(self):
        old = {v + 1 for k, v in IDS.items() if k.startswith(("house_", "center_", "gym_"))}
        for map_id in ("dawnbrook", "mossgate"):
            _, layers = self.data(map_id)
            for name in ("objects", "above"):
                self.assertFalse(set(layers[name]["data"]) & old, f"{map_id}/{name}")

    def test_every_door_warp_has_walkable_cell_on_a_building(self):
        for map_id in ("dawnbrook", "mossgate"):
            m, layers = self.data(map_id)
            w = m["width"]
            doors = [o for o in layers["warps"]["objects"] if o["name"].startswith("door_")]
            self.assertTrue(doors)
            for o in doors:
                i = o["y"] // 16 * w + o["x"] // 16
                self.assertEqual(layers["collision"]["data"][i], 0, o["name"])
                self.assertTrue(layers["objects"]["data"][i], o["name"])


if __name__ == "__main__":
    unittest.main()
