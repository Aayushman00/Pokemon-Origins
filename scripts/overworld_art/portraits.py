"""64x64 battle portraits for the Gym Leaders and League, drawn from scratch.

Each shape is a polygon: `Art.shape` fills it from a palette ramp, lights the
top-left, shades the bottom-right and rings it with the world's outline colour.
A portrait is then a list of shapes, back to front, on a shared slim figure.

    python -m scripts.overworld_art.portraits      # writes the PNGs
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

from .palette import OUTLINE, RAMPS, WHITE

S = 64
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "frontend" / "public" / "sprites" / "trainers"
GOLD = RAMPS["yellow"]


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def _shift(mask, dx, dy):
    out = Image.new("L", mask.size)
    out.paste(mask, (dx, dy))
    return out


def mirror(pts):
    return [(S - 1 - x, y) for x, y in pts]


class Art:
    def __init__(self):
        self.img = Image.new("RGBA", (S, S))

    def _paint(self, mask, colour):
        self.img.paste(Image.new("RGBA", (S, S), rgb(colour)), (0, 0), mask)

    def _fill(self, mask, ramp, line, shade):
        hi, base, low = (ramp[0], ramp[-2] if len(ramp) > 1 else ramp[0], ramp[-1])
        self._paint(mask, base)
        self._paint(ImageChops.subtract(mask, _shift(mask, 2, 2)), hi)
        self._paint(ImageChops.subtract(mask, _shift(mask, -shade[0], -shade[1])), low)
        if line:
            core = mask
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                core = ImageChops.darker(core, _shift(mask, dx, dy))
            self._paint(ImageChops.subtract(mask, core), OUTLINE)

    def shape(self, pts, ramp, both=False, line=True, shade=(3, 2)):
        for poly in ([pts, mirror(pts)] if both else [pts]):
            mask = Image.new("L", (S, S))
            ImageDraw.Draw(mask).polygon(poly, fill=255)
            self._fill(mask, ramp, line, shade)

    def oval(self, box, ramp, line=True, shade=(2, 2)):
        mask = Image.new("L", (S, S))
        ImageDraw.Draw(mask).ellipse(box, fill=255)
        self._fill(mask, ramp, line, shade)

    def px(self, colour, *points):
        for p in points:
            self.img.putpixel(p, rgb(colour))

    def line(self, colour, *pts):
        ImageDraw.Draw(self.img).line(pts, fill=rgb(colour))


HEAD = [(25, 9), (27, 6), (30, 5), (33, 5), (36, 6), (38, 9), (38, 14), (36, 18), (34, 20), (29, 20), (27, 18), (25, 14)]
TORSO = [(23, 24), (27, 23), (36, 23), (40, 24), (41, 27), (38, 38), (39, 44), (24, 44), (25, 38), (22, 27)]
THICK = [(20, 24), (26, 23), (37, 23), (43, 24), (44, 28), (42, 38), (42, 45), (21, 45), (21, 38), (19, 28)]
LEG = [(25, 43), (31, 43), (31, 58), (27, 58)]
SHOE = [(25, 57), (31, 57), (31, 63), (24, 63), (24, 60)]
ROBE = [(24, 38), (39, 38), (42, 63), (21, 63)]

ARMS = {
    "down": ([(22, 25), (25, 27), (23, 36), (21, 44), (18, 43), (19, 34)], (16, 42, 20, 47)),
    "hip": ([(22, 25), (25, 28), (21, 34), (25, 40), (23, 43), (15, 34)], (22, 39, 26, 43)),
    "raise": ([(22, 25), (24, 28), (16, 24), (14, 13), (18, 12), (20, 21)], (13, 8, 18, 13)),
    "out": ([(22, 25), (24, 30), (13, 33), (6, 31), (6, 27), (14, 28)], (2, 27, 7, 32)),
}


def face(a, skin, look="calm", brow=None):
    """Eyes, brow, nose and mouth on the shared head."""
    low = skin[-1]
    a.px(low, (32, 15), (32, 16))
    brow = brow or OUTLINE
    if look == "closed":
        a.line(OUTLINE, (27, 13), (29, 13))
        a.line(OUTLINE, (34, 13), (36, 13))
    else:
        for x in (27, 35):
            a.line(OUTLINE, (x, 12), (x, 14))
            a.line(OUTLINE, (x + 1, 12), (x + 1, 14))
            a.px(WHITE, (x, 12))
    if look == "stern":
        a.line(brow, (26, 10), (29, 11))
        a.line(brow, (37, 10), (34, 11))
        a.line(low, (30, 18), (33, 18))
    elif look == "grin":
        a.line(brow, (26, 10), (29, 10))
        a.line(brow, (34, 10), (37, 10))
        a.line(OUTLINE, (29, 17), (34, 17))
        a.line(WHITE, (30, 18), (33, 18))
        a.px(OUTLINE, (29, 16), (34, 16))
    else:
        a.line(brow, (26, 10), (29, 10))
        a.line(brow, (34, 10), (37, 10))
        a.line(RAMPS["mouth"][0], (30, 18), (33, 18))


def figure(a, skin, top, bottom, shoes, arm=None, pose=("down", "down"), robe=False, thick=False, sleeve=None, legs=None):
    """Shared slim body. `pose` is (screen-left arm, screen-right arm)."""
    arm = arm or top
    if robe:
        a.shape(ROBE, bottom)
    else:
        a.shape(SHOE, shoes, both=True)
        a.shape(LEG, legs or bottom, both=True)
    a.shape(THICK if thick else TORSO, top)
    a.shape([(29, 18), (34, 18), (34, 24), (29, 24)], skin, line=False)
    for side, kind in zip((False, True), pose):
        if kind is None:
            continue
        pts, hand = ARMS[kind]
        if thick:
            pts = [(x - 3, y) for x, y in pts]
            hand = (hand[0] - 3, hand[1], hand[2] - 3, hand[3])
        if side:
            pts, hand = mirror(pts), (S - 1 - hand[2], hand[1], S - 1 - hand[0], hand[3])
        a.shape(pts, sleeve or arm)
        a.oval(hand, skin)
    a.shape(HEAD, skin)


def folded(a, sleeve, skin):
    """Forearms crossed in front of the chest."""
    a.shape([(21, 26), (25, 25), (42, 32), (41, 36), (23, 33)], sleeve)
    a.shape([(42, 26), (38, 25), (21, 32), (22, 36), (40, 33)], sleeve)
    a.oval((40, 31, 44, 35), skin)
    a.oval((19, 31, 23, 35), skin)


def willow():
    a, skin, hair, leaf = Art(), RAMPS["skin_light"], RAMPS["hair_moss"], RAMPS["green"]
    a.shape([(23, 7), (40, 7), (42, 26), (38, 30), (25, 30), (21, 26)], hair)
    a.shape([(13, 8), (16, 8), (17, 63), (14, 63)], RAMPS["brown"], shade=(1, 1))
    a.oval((9, 3, 15, 9), leaf)
    a.oval((14, 1, 20, 7), leaf)
    figure(a, skin, RAMPS["khaki"], RAMPS["olive"], RAMPS["brown"], pose=("raise", "down"), robe=True)
    a.shape([(18, 13), (15, 13), (14, 20), (17, 21)], RAMPS["khaki"])
    face(a, skin, "calm", hair[-1])
    a.shape([(24, 12), (25, 6), (30, 3), (35, 4), (39, 8), (39, 13), (36, 9), (30, 8), (27, 9)], hair)
    a.shape([(37, 11), (41, 12), (41, 20), (39, 28), (42, 36), (39, 42), (36, 37), (37, 28), (36, 20)], hair)
    a.shape([(23, 8), (28, 3), (35, 3), (40, 8), (39, 10), (32, 6), (24, 10)], leaf)
    for x, y in ((26, 6), (31, 4), (36, 6)):
        a.oval((x - 1, y - 1, x + 1, y + 1), RAMPS["pink"], line=False)
    a.shape([(34, 38), (37, 38), (37, 43), (34, 43)], RAMPS["khaki"], shade=(1, 1))
    return a


def mara():
    a, skin, hair = Art(), RAMPS["skin_light"], RAMPS["hair_red"]
    figure(a, skin, RAMPS["orange"], RAMPS["brown"], RAMPS["brown"], pose=("hip", "raise"), thick=True,
           sleeve=RAMPS["white"])
    a.shape([(26, 26), (38, 26), (41, 50), (23, 50)], RAMPS["white"])
    a.shape([(50, 3), (53, 2), (60, 16), (57, 18)], RAMPS["khaki"], shade=(1, 1))
    a.oval((30, 33, 34, 37), RAMPS["red"], line=False)
    face(a, skin, "grin", hair[-1])
    a.shape([(24, 13), (24, 9), (27, 7), (37, 7), (40, 9), (40, 13), (37, 10), (27, 10)], hair)
    a.shape([(24, 7), (39, 7), (39, 10), (24, 10)], RAMPS["white"])
    a.oval((21, -1, 31, 9), RAMPS["white"])
    a.oval((32, -1, 42, 9), RAMPS["white"])
    a.oval((26, -3, 37, 8), RAMPS["white"])
    return a


def tavish():
    a, skin, hair, gi = Art(), RAMPS["skin_tan"], RAMPS["hair_gray"], RAMPS["white"]
    a.shape([(24, 40), (39, 40), (43, 62), (33, 62), (32, 50), (31, 50), (30, 62), (20, 62)], RAMPS["charcoal"])
    a.shape([(24, 61), (30, 61), (30, 63), (23, 63)], skin, line=False)
    a.shape([(33, 61), (39, 61), (40, 63), (33, 63)], skin, line=False)
    a.shape(TORSO, gi)
    a.shape([(29, 18), (34, 18), (34, 24), (29, 24)], skin, line=False)
    a.shape([(29, 23), (32, 30), (34, 23)], skin, line=False)
    a.line(OUTLINE, (28, 23), (32, 31))
    a.line(OUTLINE, (35, 23), (32, 31))
    a.shape([(24, 38), (39, 38), (39, 42), (24, 42)], RAMPS["red"])
    a.shape([(39, 40), (44, 47), (41, 50), (37, 42)], RAMPS["red"])
    folded(a, gi, skin)
    a.shape(HEAD, skin)
    face(a, skin, "closed", hair[-1])
    a.line(hair[-1], (26, 10), (29, 11))
    a.line(hair[-1], (37, 10), (34, 11))
    a.shape([(24, 11), (25, 6), (30, 4), (35, 4), (38, 6), (39, 11), (36, 8), (27, 8)], hair)
    a.oval((29, 0, 34, 5), hair)
    a.shape([(25, 17), (38, 17), (35, 22), (28, 22)], hair)
    a.line(RAMPS["mouth"][0], (30, 18), (33, 18))
    return a


def coral():
    a, skin, hair, coat = Art(), RAMPS["skin_tan"], RAMPS["hair_pink"], RAMPS["navy"]
    a.shape([(22, 8), (41, 8), (44, 22), (41, 30), (44, 38), (38, 42), (25, 42), (19, 38), (22, 30), (19, 22)], hair)
    figure(a, skin, coat, RAMPS["navy"], RAMPS["charcoal"], pose=("hip", "down"))
    a.shape([(24, 38), (39, 38), (41, 50), (22, 50)], coat)
    for y in (29, 34, 39, 44):
        a.px(GOLD[0], (28, y), (35, y))
    a.shape([(29, 23), (32, 28), (34, 23)], RAMPS["white"], line=False)
    face(a, skin, "grin", hair[-1])
    a.shape([(24, 12), (25, 8), (38, 8), (39, 12), (36, 10), (27, 10)], hair)
    a.shape([(23, 8), (22, 4), (28, 1), (35, 1), (41, 4), (40, 8)], RAMPS["white"])
    a.shape([(23, 7), (40, 7), (40, 10), (23, 10)], coat)
    a.shape([(24, 10), (39, 10), (41, 12), (22, 12)], RAMPS["charcoal"], line=False)
    a.oval((30, 4, 33, 7), GOLD, line=False)
    return a


def volt():
    a, skin, hair = Art(), RAMPS["skin_light"], RAMPS["hair_blond"]
    spikes = [(22, 12), (18, 7), (24, 7), (21, 1), (27, 5), (30, -1), (33, 4), (38, 0), (38, 6), (45, 3), (41, 9), (45, 12), (40, 13), (38, 8), (26, 8), (24, 14)]
    a.shape(spikes, hair)
    figure(a, skin, RAMPS["gray"], RAMPS["charcoal"], RAMPS["charcoal"], pose=("down", "raise"), sleeve=RAMPS["gray"])
    a.shape([(26, 30), (37, 30), (38, 44), (25, 44)], RAMPS["yellow"])
    a.line(RAMPS["yellow"][-1], (27, 24), (27, 30))
    a.line(RAMPS["yellow"][-1], (36, 24), (36, 30))
    a.shape([(33, 31), (29, 37), (32, 37), (30, 42), (35, 35), (32, 35)], RAMPS["white"], line=False)
    a.shape([(46, 4), (51, 3), (52, 6), (50, 7), (51, 13), (48, 13), (47, 7)], RAMPS["gray"], shade=(1, 1))
    face(a, skin, "grin", hair[-1])
    a.shape([(24, 11), (26, 5), (37, 5), (39, 11), (35, 8), (28, 8)], hair)
    a.line(OUTLINE, (24, 8), (39, 8))
    a.oval((26, 5, 31, 10), RAMPS["orange"])
    a.oval((33, 5, 38, 10), RAMPS["orange"])
    return a


def skye():
    a, skin, leather, scarf = Art(), RAMPS["skin_light"], RAMPS["brown"], RAMPS["red"]
    a.shape([(38, 22), (47, 24), (58, 20), (56, 26), (62, 27), (50, 31), (40, 28)], scarf)
    figure(a, skin, RAMPS["sky"], RAMPS["khaki"], RAMPS["brown"], pose=("out", "down"), sleeve=RAMPS["sky"])
    a.shape([(24, 26), (15, 29), (6, 27), (6, 32), (14, 34), (25, 31)], leather)
    a.shape([(25, 22), (38, 22), (38, 27), (25, 27)], scarf)
    # falcon on the glove
    a.shape([(3, 26), (2, 18), (6, 14), (10, 16), (12, 25), (9, 27)], RAMPS["gray"])
    a.oval((3, 11, 10, 18), RAMPS["gray"])
    a.shape([(10, 13), (13, 15), (10, 16)], GOLD, line=False)
    a.px(OUTLINE, (7, 14))
    a.shape([(4, 26), (0, 32), (6, 32), (8, 26)], RAMPS["charcoal"])
    face(a, skin, "calm", leather[-1])
    a.shape([(24, 16), (24, 7), (28, 3), (35, 3), (39, 7), (39, 16), (36, 16), (37, 9), (26, 9), (27, 16)], leather)
    a.shape([(24, 6), (39, 6), (39, 9), (24, 9)], RAMPS["charcoal"])
    a.oval((27, 4, 31, 8), RAMPS["sky"])
    a.oval((32, 4, 36, 8), RAMPS["sky"])
    return a


def sage():
    a, skin, hair, robe = Art(), RAMPS["skin_tan"], RAMPS["hair_gray"], RAMPS["navy"]
    a.shape([(23, 6), (40, 6), (44, 28), (42, 50), (36, 52), (27, 52), (21, 50), (19, 28)], hair)
    figure(a, skin, robe, robe, robe, pose=("hip", "hip"), robe=True)
    a.shape([(29, 23), (32, 46), (34, 23)], RAMPS["purple"], line=False)
    a.oval((27, 31, 36, 40), GOLD)
    a.px(WHITE, (29, 33), (30, 33), (29, 34))
    for x, y in ((25, 48), (37, 52), (29, 57), (35, 44), (24, 56), (39, 59)):
        a.px(GOLD[0], (x, y), (x + 1, y), (x - 1, y), (x, y - 1), (x, y + 1))
    face(a, skin, "closed", hair[-1])
    a.shape([(24, 12), (25, 6), (30, 4), (35, 4), (38, 6), (39, 12), (35, 9), (28, 9)], hair)
    a.line(GOLD[1], (24, 8), (39, 8))
    a.shape([(29, 7), (28, 3), (31, 0), (33, 0), (31, 3), (32, 6), (35, 7), (32, 8)], GOLD)
    return a


def cinder():
    a, skin, hair, plate = Art(), RAMPS["skin_tan"], RAMPS["red"], RAMPS["charcoal"]
    a.shape([(46, 10), (50, 10), (50, 62), (46, 62)], RAMPS["brown"], shade=(1, 1))
    a.shape([(40, 2), (56, 2), (58, 13), (38, 13)], RAMPS["gray"])
    figure(a, skin, plate, plate, RAMPS["red"], pose=("hip", "raise"), thick=True)
    a.shape([(23, 36), (40, 36), (40, 41), (23, 41)], RAMPS["red"])
    a.oval((29, 36, 34, 41), GOLD)
    a.oval((14, 21, 26, 31), GOLD)
    a.oval((37, 21, 49, 31), GOLD)
    face(a, skin, "stern", hair[-1])
    a.shape([(28, 8), (29, 2), (31, 4), (32, -2), (34, 4), (36, 1), (36, 8), (33, 10), (30, 10)], hair)
    return a


def hollis():
    a, skin, hair, coat = Art(), RAMPS["skin_light"], RAMPS["hair_teal"], RAMPS["white"]
    figure(a, skin, coat, coat, RAMPS["sky"], pose=("down", "hip"), legs=RAMPS["navy"])
    a.shape([(23, 28), (31, 28), (31, 61), (21, 61)], coat)
    a.shape([(32, 28), (40, 28), (42, 61), (32, 61)], coat)
    a.oval((21, 20, 42, 28), RAMPS["sky"])
    face(a, skin, "closed", hair[-1])
    a.shape([(24, 13), (24, 6), (29, 2), (40, 1), (37, 4), (40, 8), (39, 13), (36, 9), (31, 7), (26, 10)], hair)
    return a


def bastian():
    a, skin, hair, vest = Art(), RAMPS["skin_tan"], RAMPS["hair_dark"], RAMPS["orange"]
    a.shape([(44, 8), (47, 6), (56, 56), (53, 58)], RAMPS["brown"], shade=(1, 1))
    a.shape([(38, 11), (47, 3), (58, 6), (46, 8), (42, 14)], RAMPS["gray"])
    figure(a, skin, RAMPS["khaki"], RAMPS["brown"], RAMPS["charcoal"], pose=("down", "down"), thick=True, sleeve=skin)
    a.shape([(23, 24), (29, 24), (29, 44), (22, 44)], vest)
    a.shape([(34, 24), (40, 24), (41, 44), (34, 44)], vest)
    a.line(WHITE, (23, 34), (28, 34))
    a.line(WHITE, (35, 34), (40, 34))
    face(a, skin, "stern", hair[-1])
    a.shape([(25, 13), (28, 14), (30, 16), (33, 16), (35, 14), (38, 13), (37, 21), (33, 24), (30, 24), (26, 21)], hair)
    a.line(RAMPS["mouth"][0], (30, 18), (33, 18))
    a.shape([(23, 9), (26, 3), (31, 1), (36, 2), (40, 9)], RAMPS["yellow"])
    a.shape([(20, 9), (43, 9), (43, 11), (20, 11)], RAMPS["yellow"])
    return a


def morwen():
    a, skin, hood = Art(), RAMPS["skin_light"], RAMPS["purple"]
    a.shape([(31, 0), (37, 4), (43, 16), (45, 30), (19, 30), (20, 16), (26, 4)], hood)
    figure(a, skin, hood, hood, hood, pose=("down", "out"), robe=True)
    a.line(RAMPS["charcoal"][1], (58, 31), (58, 36))
    a.shape([(54, 36), (61, 36), (62, 46), (53, 46)], RAMPS["charcoal"])
    a.oval((55, 38, 60, 44), GOLD, line=False)
    a.shape([(21, 12), (26, 3), (37, 3), (42, 12), (40, 22), (23, 22)], hood)
    a.shape([(26, 8), (37, 8), (37, 19), (26, 19)], skin)
    a.shape([(26, 8), (37, 8), (37, 10), (34, 12), (29, 12), (26, 10)], RAMPS["hair_black"], line=False)
    a.line(OUTLINE, (27, 14), (29, 14))
    a.line(OUTLINE, (34, 14), (36, 14))
    a.line(RAMPS["mouth"][0], (30, 17), (33, 17))
    for y in (48, 54, 60):
        a.px(hood[0], (27, y), (36, y))
    return a


def drake():
    a, skin, coat, horn = Art(), RAMPS["skin_tan"], RAMPS["red"], GOLD
    figure(a, skin, coat, RAMPS["charcoal"], RAMPS["charcoal"], pose=(None, None))
    a.shape([(23, 30), (31, 30), (31, 60), (20, 60)], coat)
    a.shape([(32, 30), (40, 30), (43, 60), (32, 60)], coat)
    for y in (40, 46, 52):
        a.line(coat[-1], (23, y), (29, y + 1))
        a.line(coat[-1], (40, y), (34, y + 1))
    a.line(GOLD[1], (31, 30), (31, 59))
    a.line(GOLD[1], (32, 30), (32, 59))
    folded(a, coat, skin)
    a.shape(HEAD, skin)
    face(a, skin, "stern", RAMPS["hair_dark"][-1])
    a.shape([(24, 12), (25, 5), (31, 3), (38, 5), (39, 12), (36, 8), (27, 8)], RAMPS["red"])
    a.shape([(26, 6), (20, 3), (16, 0), (18, 6), (24, 10)], horn)
    a.shape([(37, 6), (43, 3), (47, 0), (45, 6), (39, 10)], horn)
    return a


def kestrel():
    a, skin, hair, coat = Art(), RAMPS["skin_light"], RAMPS["hair_blond"], RAMPS["white"]
    figure(a, skin, coat, RAMPS["navy"], RAMPS["red"], pose=("hip", "out"))
    a.shape([(23, 30), (29, 30), (28, 52), (20, 52)], coat)
    a.shape([(34, 30), (40, 30), (43, 52), (35, 52)], coat)
    a.shape([(28, 24), (35, 24), (35, 40), (28, 40)], RAMPS["navy"], line=False)
    a.line(GOLD[1], (28, 24), (28, 44))
    a.line(GOLD[1], (35, 24), (35, 44))
    a.line(GOLD[1], (20, 51), (28, 51))
    a.line(GOLD[1], (35, 51), (43, 51))
    face(a, skin, "grin", hair[-1])
    a.shape([(24, 14), (23, 7), (28, 2), (36, 2), (46, 4), (40, 8), (42, 12), (39, 14), (36, 9), (30, 11), (26, 9)], hair)
    a.shape([(22, 8), (18, 1), (21, 0), (25, 6)], RAMPS["red"])
    return a


PORTRAITS = {"willow_thornby": willow, "mara_quill": mara, "tavish_rook": tavish, "coral_marlowe": coral,
             "volt_dray": volt, "skye_corvin": skye, "sage_ilmara": sage, "cinder_valko": cinder,
             "hollis_rime": hollis, "bastian_cairn": bastian, "morwen_hallow": morwen,
             "drake_zephyrin": drake, "kestrel_vane": kestrel}


def draw(name):
    return PORTRAITS[name]().img


def main():
    for name in PORTRAITS:
        draw(name).save(OUT / f"{name}.png")


if __name__ == "__main__":
    main()
