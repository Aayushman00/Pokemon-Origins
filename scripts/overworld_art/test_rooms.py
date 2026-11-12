"""Rooms read as their own places, and everyone in them can be reached."""
import unittest
from collections import deque

from . import interiors as I
from .world_palette import LINE


def reachable(room, start):
    seen, todo = {start}, deque([start])
    while todo:
        x, y = todo.popleft()
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if n not in seen and n not in room.solid and 0 <= n[0] < room.w and 0 <= n[1] < room.h:
                seen.add(n)
                todo.append(n)
    return seen


class OwnRooms(unittest.TestCase):
    def pixels(self, map_id):
        return I.ROOMS[map_id][0](0).t.img.tobytes()

    def test_the_lab_is_not_the_care_centre(self):
        self.assertNotEqual(self.pixels("dawnbrook_lab"), self.pixels("mossgate_center"))

    def test_neighbours_do_not_live_in_the_players_home(self):
        for house in ("dawnbrook_house", "mossgate_house_a", "mossgate_house_b"):
            self.assertNotEqual(self.pixels(house), self.pixels("dawnbrook_home"), house)

    def test_floors_carry_no_shadow_patches(self):
        for map_id, (paint, _) in I.ROOMS.items():
            room = paint(0)
            px = room.t.img.load()
            clean = {I.hexrgb(c) for mode in ("normal", "light") for c in I.FLOORS[room.theme].get(mode, {}).values()}
            for y, row in enumerate(room.key):
                for x, k in enumerate(row):
                    if k is not None:
                        self.assertIn(px[x, y], clean, (map_id, x, y))

    def test_rooms_share_the_world_outline(self):
        self.assertEqual(I.OL, LINE)


class Lab(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.room = I.paint_lab(0)
        cls.open = reachable(cls.room, (I.MAT["dawnbrook_lab"], 8))

    def test_the_professor_can_be_talked_to_across_the_bench(self):
        self.assertIn((7, 3), self.room.solid)
        self.assertIn((7, 4), self.open)

    def test_the_professor_and_the_bench_offer_the_starter_until_one_is_picked(self):
        import json
        data = I.MAPS["dawnbrook_lab"]()
        objs = {o["name"]: o for l in data["layers"] if l.get("objects") for o in l["objects"]}
        for name in ("professor", "counter_professor"):
            ops = json.loads(next(p["value"] for p in objs[name]["properties"] if p["name"] == "script"))
            self.assertEqual(ops[0]["op"], "requireFlag")
            self.assertEqual((ops[0]["flag"], ops[0]["not"]), ("story:starter", True))
            self.assertEqual(ops[0]["else"][0]["op"], "say")
            self.assertEqual(ops[-1], {"op": "starter"})

    def test_the_bookcase_can_be_read(self):
        self.assertIn((1, 2), self.open)

    def test_the_bench_hides_the_feet_of_whoever_is_behind_it(self):
        data = I.MAPS["dawnbrook_lab"]()
        above = next(l for l in data["layers"] if l["name"] == "above")["data"]
        gid = above[2 * data["width"] + 7]
        self.assertTrue(gid)
        img = I.build()[0][gid - 1].getchannel("A").load()
        self.assertEqual(img[8, 0], 0, "open above the bench edge")
        self.assertEqual(img[8, 15], 255, "solid along it")

    def test_the_exit_mat_is_open(self):
        self.assertNotIn((I.MAT["dawnbrook_lab"], self.room.h - 1), self.room.solid)

    def test_the_rack_blinks(self):
        self.assertNotEqual(I.paint_lab(0).t.img.tobytes(), I.paint_lab(1).t.img.tobytes())


if __name__ == "__main__":
    unittest.main()
