"""Checks for the cast's body builds and player redesign. Run from the repo root:

    python -m unittest scripts.overworld_art.test_cast -v
"""
import unittest

from PIL import Image

from .characters import ROSTER
from .palette import OUTLINE
from .sheets import _slim_head, build_sheet
from .world_palette import LINE

BY_ID = {c["id"]: c for c in ROSTER}


def stand(cid, row=0):
    return build_sheet(BY_ID[cid]).crop((0, row * 32, 16, row * 32 + 32))


HEROES = ("player", "player_f", "rival", "professor", "mom")  # hand-shaded to the hero rules


def iris_of(cid):
    """The dark iris tone of a hand-shaded hero."""
    from .palette import RAMPS
    ramp = RAMPS[BY_ID[cid]["mats"]["i"]]
    return tuple(int(ramp[-1][i:i + 2], 16) for i in (1, 3, 5))


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

    def test_hero_eyes_have_the_glint_above_the_iris(self):
        """Despeckle once swapped the 1px glint and iris; every view must keep the glint on top."""
        from .palette import RAMPS, WHITE
        white = tuple(int(WHITE[i:i + 2], 16) for i in (1, 3, 5))
        for cid in HEROES:
            iris = iris_of(cid)
            for row in (0, 2, 3):  # down, left, right: the back view has no face
                img = stand(cid, row)
                glints = [(x, y) for y in range(32) for x in range(16) if img.getpixel((x, y))[:3] == white]
                self.assertTrue(glints, f"{cid} row {row}: no eye glint")
                for x, y in glints:
                    self.assertEqual(img.getpixel((x, y + 1))[:3], iris, f"{cid} row {row}: no iris under the glint at {x},{y}")

    def test_hero_side_strides_reach_past_the_stance(self):
        """Profile walk frames split the feet wider than standing: front foot out, back heel up."""
        for cid, row in ((c, r) for c in HEROES for r in (2, 3)):
            sheet = build_sheet(BY_ID[cid])

            def feet(col):
                a = sheet.crop((col * 16, row * 32, col * 16 + 16, row * 32 + 32)).getchannel("A").load()
                xs = [x for y in (29, 30) for x in range(16) if a[x, y]]
                return max(xs) - min(xs) + 1
            for col in (1, 2):
                self.assertGreaterEqual(feet(col) - feet(0), 4, f"{cid} row {row} col {col}")

    def test_hero_side_eye_is_on_every_open_eyed_frame(self):
        """Glint over iris in every side frame but the blink, at the same spot on the face."""
        from .palette import RAMPS, WHITE
        white = tuple(int(WHITE[i:i + 2], 16) for i in (1, 3, 5))
        for cid, row in ((c, r) for c in HEROES for r in (2, 3)):
            iris, sheet = iris_of(cid), build_sheet(BY_ID[cid])
            for col in range(8):
                if col == 6:  # blink
                    continue
                f = sheet.crop((col * 16, row * 32, col * 16 + 16, row * 32 + 32))
                glints = [(x, y) for y in range(32) for x in range(16) if f.getpixel((x, y))[:3] == white]
                self.assertEqual(len(glints), 1, f"{cid} row {row} col {col}: {glints}")
                x, y = glints[0]
                self.assertEqual(f.getpixel((x, y + 1))[:3], iris, f"{cid} row {row} col {col}")

    def test_hero_profile_face_is_not_pinched(self):
        """Side views: 5+ px of skin across the eye row, 1+ px before the eye and
        3+ px behind it, and skin on at least half the head's rows."""
        from .palette import RAMPS, WHITE
        hexs = lambda p: "#%02x%02x%02x" % p[:3]
        for cid, row in ((c, r) for c in HEROES for r in (2, 3)):
            skin = set(RAMPS[BY_ID[cid]["mats"]["s"]])
            img = stand(cid, row)
            px = lambda x, y: hexs(img.getpixel((x, y)))
            glint = next((x, y) for y in range(32) for x in range(16) if px(x, y) == WHITE)
            gx, gy = glint
            ahead = range(gx - 1, -1, -1) if row == 2 else range(gx + 1, 16)  # toward the facing
            behind = range(gx + 1, 16) if row == 2 else range(gx - 1, -1, -1)
            run = lambda xs: next((n for n, x in enumerate(xs) if px(x, gy) not in skin), len(xs))
            self.assertGreaterEqual(run(ahead), 1, f"{cid} row {row}: no skin before the eye")
            self.assertGreaterEqual(run(behind), 3, f"{cid} row {row}: under 3 px of cheek behind the eye")
            self.assertGreaterEqual(run(ahead) + 1 + run(behind), 5, f"{cid} row {row}: face under 5 px wide")
            a = img.getchannel("A").load()
            head = [y for y in range(32) if y <= gy + 3 and any(a[x, y] for x in range(16))]  # crown to chin
            faced = [y for y in head if any(px(x, y) in skin for x in range(16))]
            self.assertGreaterEqual(len(faced) * 2, len(head), f"{cid} row {row}: face under half the head")

    def test_players_are_not_clones(self):
        self.assertNotEqual(stand("player").tobytes(), stand("player_f").tobytes())


# A child's body sits lower, so on these two the rows measure hair, not arms.
BODY_WIDTH_CAST = [c for c in ROSTER if c["id"] not in ("lass", "twin")]


class Proportions(unittest.TestCase):
    def rows(self, char):
        """Opaque pixel count per row of the stand-down frame."""
        alpha = build_sheet(char).crop((0, 0, 16, 32)).getchannel("A").load()
        return [sum(alpha[x, y] > 0 for x in range(16)) for y in range(32)]

    def height(self, char_id):
        return sum(n > 0 for n in self.rows(BY_ID[char_id]))

    def spans(self, char, sheet_row):
        """Left-to-right extent of each pixel row of a stand frame."""
        alpha = build_sheet(char).crop((0, sheet_row * 32, 16, sheet_row * 32 + 32)).getchannel("A").load()
        rows = [[x for x in range(16) if alpha[x, y] > 0] for y in range(32)]
        return [r[-1] - r[0] + 1 if r else 0 for r in rows]

    def test_arms_hang_close_to_the_body(self):
        for c in BODY_WIDTH_CAST:
            limit = 14 if c.get("build") == "heavy" else 12
            self.assertLessEqual(max(self.spans(c, 0)[24:26]), limit, c["id"])

    def test_legs_are_slimmer_than_the_shoulders(self):
        for c in ROSTER:
            limit = 12 if c.get("build") == "heavy" else 10
            self.assertLessEqual(self.spans(c, 0)[28], limit, c["id"])

    def test_the_base_never_flares_from_the_front(self):
        for c in ROSTER:
            if c["id"] != "old_man":  # the cane stands beside him
                self.assertLessEqual(max(self.spans(c, 0)[29:]), 10, c["id"])

    def test_the_base_never_flares_from_the_side(self):
        for c in ROSTER:
            if c["id"] != "old_man":  # the cane reaches ahead of him
                self.assertLessEqual(max(self.spans(c, 2)[29:]), 9, c["id"])

    def test_coats_and_skirts_hang_straight_from_the_side(self):
        for c in BODY_WIDTH_CAST:
            if c.get("build") != "heavy" and c["id"] != "old_man":
                self.assertLessEqual(max(self.spans(c, 2)[25:29]), 9, c["id"])

    def test_a_coat_is_no_wider_than_the_body_from_the_side(self):
        for name in ("scientist", "professor"):
            coat, plain = self.spans(BY_ID[name], 2), self.spans(BY_ID["player"], 2)
            self.assertLessEqual(max(coat[25:29]), max(plain[25:29]), name)

    def test_slimming_never_touches_the_eyes(self):
        row = list("0123456789abcdef")
        canvas = [list(row) for _ in range(32)]
        self.assertEqual(_slim_head(canvas, "down")[20][4:12], row[4:12])
        self.assertEqual(_slim_head(canvas, "left")[20][:9], row[:9])

    def test_nobody_outgrows_the_bible(self):
        for c in ROSTER:
            self.assertLessEqual(sum(n > 0 for n in self.rows(c)), 26, c["id"])

    def test_adults_have_grown_up(self):
        self.assertGreaterEqual(self.height("rival"), 23)

    def test_children_are_clearly_shorter_than_adults(self):
        self.assertGreaterEqual(self.height("rival") - self.height("youngster"), 3)

    def test_heads_are_not_wider_than_the_shoulders_need(self):
        for name in ("player", "player_f", "rival", "mom", "scientist"):
            self.assertLessEqual(max(self.rows(BY_ID[name])[:18]), 14, name)


LEADERS = ("willow_thornby", "mara_quill", "tavish_rook", "coral_marlowe", "volt_dray", "skye_corvin",
           "sage_ilmara", "cinder_valko", "hollis_rime", "bastian_cairn", "morwen_hallow", "drake_zephyrin",
           "kestrel_vane")


class Leaders(unittest.TestCase):
    def test_every_leader_has_a_sheet_of_their_own(self):
        for cid in LEADERS:
            self.assertIn(cid, BY_ID)

    def test_generic_leaders_are_gone(self):
        self.assertNotIn("leader_m", BY_ID)
        self.assertNotIn("leader_f", BY_ID)

    def test_no_two_leaders_share_a_silhouette(self):
        """Fill every frame black: leaders must differ by outline alone, not by recolour."""
        seen = {}
        for cid in LEADERS:
            shape = stand(cid).getchannel("A").tobytes()
            self.assertNotIn(shape, seen, f"{cid} has the outline of {seen.get(shape)}")
            seen[shape] = cid

    def test_no_two_leaders_share_a_hairstyle_and_hat(self):
        looks = [(tuple(map(repr, BY_ID[c]["heads"]["down"]))) for c in LEADERS]
        self.assertEqual(len(set(looks)), len(looks))

    def test_open_eyed_leaders_wear_the_hero_eye(self):
        """Hand-shaded leaders: two glint-over-iris eyes from the front, one in profile;
        closed eyes stay a line."""
        from .characters import POLISHED
        from .sheets import frame_keys
        closed = {"tavish_rook", "sage_ilmara", "hollis_rime", "morwen_hallow"}
        for cid in POLISHED:
            self.assertEqual(BY_ID[cid].get("shade"), "manual", cid)
            for direction, want in (("down", 2), ("left", 1)):
                g = frame_keys(BY_ID[cid], direction, "stand")
                eyes = [(x, y) for y in range(31) for x in range(16)
                        if g[y][x] == ("i", "hi") and g[y + 1][x] == ("i", "shadow")]
                self.assertEqual(len(eyes), 0 if cid in closed else want, f"{cid} {direction}: {eyes}")

    def test_leaders_stay_inside_the_colour_budget(self):
        for cid in LEADERS:
            colours = {px for _, px in stand(cid).getcolors(4096) if px[3]}
            self.assertLessEqual(len(colours), 15, cid)


class Milestone3(unittest.TestCase):
    """Hue-matched outlines inside the palette budget; FRLG-height heroes."""

    def test_heroes_wear_outlines_matched_to_their_materials(self):
        """The silhouette is drawn in several dark tones, not one plum line."""
        for cid in ("player", "player_f", "rival"):  # crowded sheets (npc) may fall back to fewer
            img = stand(cid)
            a = img.getchannel("A").load()
            ring = {img.getpixel((x, y))[:3] for y in range(32) for x in range(16) if a[x, y] and any(
                not (0 <= x + dx < 16 and 0 <= y + dy < 32) or not a[x + dx, y + dy]
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))}
            self.assertGreaterEqual(len(ring), 3, cid)

    def test_heroes_stand_at_frlg_height(self):
        for cid in ("player", "player_f"):
            self.assertLessEqual(height(stand(cid)), 23, cid)
        self.assertLess(height(stand("player")), height(stand("cooltrainer_m")), "heroes under the adults")
        self.assertLess(height(stand("youngster")), height(stand("player")), "children under the heroes")


if __name__ == "__main__":
    unittest.main()
