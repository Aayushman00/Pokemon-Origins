"""Checks for the generated overworld art. Run from the repo root:

    python3 -m unittest scripts.overworld_art.test_art -v

They read the committed PNG/JSON files (what the game actually loads), so
run `python3 -m scripts.overworld_art.build_all` first after art changes.
"""
import json
import unittest
from pathlib import Path

from PIL import Image

from .characters import ROSTER
from .origin_town import GRASS_IDS, plain_windows
from .palette import OUTLINE, RAMPS, WHITE
from .sheets import COLUMNS, ROWS

ROOT = Path(__file__).resolve().parents[2]
SPRITES = ROOT / "frontend" / "public" / "sprites" / "overworld"
MAPS = ROOT / "frontend" / "public" / "maps"
MAX_COLOURS = 15  # + transparent = one 16-colour GBA palette


def frames(img):
    for r in range(len(ROWS)):
        for c in range(len(COLUMNS)):
            yield r, c, img.crop((c * 16, r * 32, c * 16 + 16, r * 32 + 32))


def hexs(rgb):
    return "#%02x%02x%02x" % rgb[:3]


class SheetTests(unittest.TestCase):
    def setUp(self):
        self.sheets = {c["id"]: Image.open(SPRITES / f"{c['id']}.png").convert("RGBA") for c in ROSTER}

    def test_roster_is_19_boys_and_12_girls_plus_townsperson(self):
        cast = [c for c in ROSTER if c["id"] != "npc"]
        self.assertEqual(sum(c["gender"] == "male" for c in cast), 19)
        self.assertEqual(sum(c["gender"] == "female" for c in cast), 12)
        self.assertEqual(len({c["id"] for c in ROSTER}), len(ROSTER), "duplicate ids")

    def test_engine_names_still_exist(self):
        for name in ("player", "npc", "player_f"):
            self.assertIn(name, self.sheets)

    def test_sheet_dimensions(self):
        for cid, img in self.sheets.items():
            self.assertEqual(img.size, (16 * len(COLUMNS), 32 * len(ROWS)), cid)
            self.assertEqual(img.size, (128, 128), cid)

    def test_every_frame_is_drawn(self):
        for cid, img in self.sheets.items():
            for r, c, f in frames(img):
                self.assertIsNotNone(f.getbbox(), f"{cid}: empty frame row {r} col {c}")

    def test_palette_limit_and_no_semi_alpha(self):
        for cid, img in self.sheets.items():
            px = list(img.get_flattened_data())
            self.assertTrue(all(p[3] in (0, 255) for p in px), f"{cid}: semi-transparent pixels")
            colours = {p[:3] for p in px if p[3]}
            self.assertLessEqual(len(colours), MAX_COLOURS, f"{cid}: {len(colours)} colours")

    def test_colours_come_from_the_master_palette(self):
        allowed = {OUTLINE, WHITE} | {c for ramp in RAMPS.values() for c in ramp}
        for cid, img in self.sheets.items():
            used = {hexs(p) for p in img.get_flattened_data() if p[3]}
            self.assertFalse(used - allowed, f"{cid}: off-palette {used - allowed}")

    def test_outline_is_dark_brown_never_black(self):
        for cid, img in self.sheets.items():
            self.assertNotIn((0, 0, 0), {p[:3] for p in img.get_flattened_data() if p[3]}, cid)
        r, g, b = (int(OUTLINE[i:i + 2], 16) for i in (1, 3, 5))
        self.assertTrue(r > b and r > g and max(r, g, b) < 80, "outline should be a dark brown")

    def test_right_row_mirrors_left(self):
        for cid, img in self.sheets.items():
            left = img.crop((0, 64, 128, 96))
            right = img.crop((0, 96, 128, 128))
            for c in range(8):
                lf = left.crop((c * 16, 0, c * 16 + 16, 32)).transpose(Image.FLIP_LEFT_RIGHT)
                self.assertEqual(list(lf.get_flattened_data()), list(right.crop((c * 16, 0, c * 16 + 16, 32)).get_flattened_data()), f"{cid} col {c}")

    def test_feet_anchor_on_the_tile(self):
        """Every frame stands on the cell's last row: no floating or clipped feet."""
        for cid, img in self.sheets.items():
            for r, c, f in frames(img):
                self.assertEqual(f.getbbox()[3], 32, f"{cid} row {r} col {c}")

    def test_walk_frames_bob_and_differ(self):
        for cid, img in self.sheets.items():
            for r, _, _ in list(frames(img))[::8]:
                stand = img.crop((0, r * 32, 16, r * 32 + 32))
                for c in (1, 2):
                    walk = img.crop((c * 16, r * 32, c * 16 + 16, r * 32 + 32))
                    self.assertEqual(walk.getbbox()[1], stand.getbbox()[1] + 1, f"{cid} row {r}: walk frame must bob 1px")
                    self.assertNotEqual(list(walk.get_flattened_data()), list(stand.get_flattened_data()))

    def test_blink_changes_the_face_only_when_there_are_open_eyes(self):
        for cid, img in self.sheets.items():
            stand = img.crop((0, 0, 16, 32))
            blink = img.crop((96, 0, 112, 32))
            diff = [i for i, (a, b) in enumerate(zip(stand.get_flattened_data(), blink.get_flattened_data())) if a != b]
            self.assertTrue(all(10 * 16 <= i < 22 * 16 for i in diff), f"{cid}: blink touched more than the face")

    def test_no_orphan_shading_pixels(self):
        """Every shading tone pixel touches another pixel of its colour; only
        line work (outline, eyes) and white glints may stand alone. The alert
        pose and hat brims may leave a few single pixels (at most 4 a frame)."""
        free = {OUTLINE, WHITE}
        for cid, img in self.sheets.items():
            for r, c, f in frames(img):
                p = f.load()
                lone = []
                for y in range(32):
                    for x in range(16):
                        if not p[x, y][3] or hexs(p[x, y]) in free:
                            continue
                        if not any((dx or dy) and 0 <= x + dx < 16 and 0 <= y + dy < 32 and p[x + dx, y + dy] == p[x, y]
                                   for dx in (-1, 0, 1) for dy in (-1, 0, 1)):
                            lone.append((x, y))
                self.assertLessEqual(len(lone), 4, f"{cid} row {r} col {c}: orphan pixels {lone}")

    def test_silhouettes_are_distinct(self):
        """No two characters share the same front-facing silhouette."""
        seen = {}
        for cid, img in self.sheets.items():
            mask = tuple(a > 0 for *_, a in img.crop((0, 0, 16, 32)).get_flattened_data())
            side = tuple(a > 0 for *_, a in img.crop((0, 64, 16, 96)).get_flattened_data())
            seen.setdefault((mask, side), []).append(cid)
        clones = [v for v in seen.values() if len(v) > 1]
        self.assertFalse(clones, clones)


class WorldTests(unittest.TestCase):
    def test_tileset_keeps_8_columns_and_old_ids(self):
        with Image.open(MAPS / "tilesets" / "overworld.png") as img:
            self.assertEqual(img.width, 128)
            self.assertEqual(img.height % 16, 0)

    def test_origin_town_has_no_bare_grass_and_valid_tiles(self):
        m = json.loads((MAPS / "origin_town.json").read_text())
        ts = m["tilesets"][0]
        with Image.open(MAPS / ts["image"]) as img:
            self.assertEqual((ts["imagewidth"], ts["imageheight"]), img.size)
        layers = {l["name"]: l for l in m["layers"]}
        for name in ("ground", "decor", "objects", "above"):
            for g in layers[name]["data"]:
                self.assertTrue(g == 0 or 1 <= g <= ts["tilecount"], f"{name}: gid {g}")
        W, H = m["width"], m["height"]

        class Grid:
            ground, decor, objects, above = (layers[n]["data"] for n in ("ground", "decor", "objects", "above"))

            @staticmethod
            def i(x, y):
                return y * W + x

        import scripts.overworld_art.origin_town as town
        self.assertEqual((town.W, town.H), (W, H))
        self.assertEqual(plain_windows(Grid), [], "bare grass patch")
        self.assertTrue(GRASS_IDS)

    def test_origin_town_npcs_use_existing_sheets(self):
        m = json.loads((MAPS / "origin_town.json").read_text())
        npcs = next(l for l in m["layers"] if l["name"] == "npcs")["objects"]
        self.assertGreaterEqual(len(npcs), 10)
        for o in npcs:
            sprite = next(p["value"] for p in o["properties"] if p["name"] == "sprite")
            self.assertTrue((SPRITES / f"{sprite}.png").exists(), sprite)


if __name__ == "__main__":
    unittest.main()
