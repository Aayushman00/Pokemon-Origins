"""Hand-placed v2 characters: every pixel's tone is chosen by hand.

The v1 cast (parts.py + compose.shade) shades automatically and turns
muddy at 16 px. v2 characters are drawn the way GBA artists worked: one
16-slot palette per sprite and an explicit tone for every pixel. Body
templates are shared (male / female, per direction and pose); heads and
accessories are per character.

Proportions (16x32 cell, feet on row 31):
  head  rows ~4-13 (10 px; hats may rise to row 2)
  torso rows 14-25 (12 px, hips included)
  legs  rows 26-31 (6 px: shins, shoe, sole line, outline)
Boys: shoulders 10 px + 2 px arms each side (16 wide). Girls: shoulders
8 px, 1 px arms, skirt hem flares out (12 wide): gender reads at 1x.

Letter alphabet (one char = one pixel, '.' transparent):
  O  outline (dark brown, never black)
  S s z      skin       hi / base / shadow
  H h y      hair       hi / base / shadow       (hair outline = O)
  C c x X    hat        hi / base / shadow / deep
  T t r R    top        hi / base / shadow / deep (deep = cloth outline)
  A a f      arm        hi / base / shadow       (sleeve or bare skin)
  B b v V    bottom     hi / base / shadow / deep
  P p q      accent     hi / base / shadow       (bag, ribbon, logo)
  n N        shoes      base / shadow
  w W        white      base / shadow
  e i        eye        pupil / iris (the iris is the catch-light)
  m u        mouth, blush
  k          decal mark (a logo pixel; single by design, like eyes)

Right-facing frames are the mirrored left frame plus a per-character
`right` layer for details that do not mirror (a bag worn on one side).
"""
from PIL import Image

from .palette import OUTLINE, V2

W, H = 16, 32

LETTERS = {
    "S": ("skin", 0), "s": ("skin", 1), "z": ("skin", 2),
    "H": ("hair", 0), "h": ("hair", 1), "y": ("hair", 2),
    "C": ("hat", 0), "c": ("hat", 1), "x": ("hat", 2), "X": ("hat", 3),
    "T": ("top", 0), "t": ("top", 1), "r": ("top", 2), "R": ("top", 3),
    "A": ("arm", 0), "a": ("arm", 1), "f": ("arm", 2),
    "B": ("bottom", 0), "b": ("bottom", 1), "v": ("bottom", 2), "V": ("bottom", 3),
    "P": ("acc", 0), "p": ("acc", 1), "q": ("acc", 2),
    "n": ("shoes", 1), "N": ("shoes", 2),
    "w": ("white", 0), "W": ("white", 1),
    "e": ("eye", 0), "i": ("eye", 1),
    "m": ("mouth", 0), "u": ("blush", 0),
    "k": ("acc", 1),
}


def g(top, text):
    """A layer: (top_row, rows). Every row must be exactly 16 wide."""
    rows = [r.strip() for r in text.strip("\n").splitlines() if r.strip()]
    for r in rows:
        if len(r) != W:
            raise ValueError(f"row {r!r} is {len(r)} wide, expected {W}")
        bad = set(r) - set(LETTERS) - set(".O_")
        if bad:
            raise ValueError(f"row {r!r} uses unknown letters {bad}")
    return (top, rows)


def mirror(layer):
    top, rows = layer
    return (top, [r[::-1] for r in rows])


def stack(*layers):
    canvas = [["."] * W for _ in range(H)]
    for layer in layers:
        if layer is None:
            continue
        top, rows = layer
        for dy, row in enumerate(rows):
            for x, ch in enumerate(row):
                if ch != ".":
                    canvas[top + dy][x] = "." if ch == "_" else ch
    return canvas


# =================================================================== bodies
# Each body is rows 14-31. Poses: stand, stepA, stepB, alert.
# Front/back stepB is the mirror of stepA (legs and arms swap sides).

MALE_DOWN = {
    "stand": g(14, """
        ...OOTtwwtrOO...
        OAaRTtwwttrrRafO
        OAaRTtwWttrrRafO
        OaaRttwWttrrRafO
        OaaRttwWttrrRffO
        OafRttwWttrrRffO
        OssRttwWttrrRszO
        OszRtttttrrrRzzO
        .OORRRRRRRRRROO.
        ...OBbbbbbbvO...
        ...OBbbbObbvO...
        ...OBbbvObbvO...
        ...ObbbvObbvO...
        ...ObbvVOvvVO...
        ..OnnnNOOnnnNO..
        ..OnnNNOOnNNNO..
        ..OWWWWOOWWWWO..
        ...OOOO..OOOO...
    """),
    "stepA": g(14, """
        ...OOTtwwtrOO...
        OAaRTtwwttrrRafO
        OAaRTtwWttrrRafO
        OaaRttwWttrrRafO
        OaaRttwWttrrRffO
        OafRttwWttrrRszO
        OaaRttwWttrrRzzO
        OssRtttttrrrROO.
        OszRRRRRRRRRRO..
        .OOOBbbbbbbvO...
        ...OBbbbObbvO...
        ...OBbbvObbvO...
        ...ObbbvObbvO...
        ...ObbvVOnnnNO..
        ..OnnnNOOnNNNO..
        ..OnnNNOOWWWWO..
        ..OWWWWO.OOOO...
        ...OOOO.........
    """),
    "alert": g(14, """
        ...OOTtwwtrOO...
        OAaRTtwwttrrRafO
        OAaRTtwWttrrRafO
        OaaRttwWttrrRffO
        OssRttwWttrrRszO
        OszRttwWttrrRzzO
        .OORttwWttrrROO.
        ...RtttttrrrR...
        ...ORRRRRRRRO...
        ...OBbbbbbbvO...
        ...OBbbbObbvO...
        ...OBbbvObbvO...
        ...ObbbvObbvO...
        ...ObbvVOvvVO...
        ..OnnnNOOnnnNO..
        ..OnnNNOOnNNNO..
        ..OWWWWOOWWWWO..
        ...OOOO..OOOO...
    """),
}

MALE_UP = {
    "stand": g(14, """
        ...OOTttttrOO...
        OAaRTttttttrRafO
        OAaRTttttttrRafO
        OaaRtttttttrRafO
        OaaRtttttttrRffO
        OafRtttttttrRffO
        OssRtttttrrrRszO
        OszRttttrrrrRzzO
        .OORRRRRRRRRROO.
        ...OBbbbbbbvO...
        ...OBbbbObbvO...
        ...OBbbvObbvO...
        ...ObbbvObbvO...
        ...ObbvVOvvVO...
        ..OnnnNOOnnnNO..
        ..OnnNNOOnNNNO..
        ..OWWWWOOWWWWO..
        ...OOOO..OOOO...
    """),
    "stepA": g(14, """
        ...OOTttttrOO...
        OAaRTttttttrRafO
        OAaRTttttttrRafO
        OaaRtttttttrRafO
        OaaRtttttttrRffO
        OafRtttttttrRszO
        OaaRtttttrrrRzzO
        OssRttttrrrrROO.
        OszRRRRRRRRRRO..
        .OOOBbbbbbbvO...
        ...OBbbbObbvO...
        ...OBbbvObbvO...
        ...ObbbvObbvO...
        ...ObbvVOnnnNO..
        ..OnnnNOOnNNNO..
        ..OnnNNOOWWWWO..
        ..OWWWWO.OOOO...
        ...OOOO.........
    """),
    "alert": g(14, """
        ...OOTttttrOO...
        OAaRTttttttrRafO
        OAaRTttttttrRafO
        OaaRtttttttrRffO
        OssRtttttttrRszO
        OszRtttttrrrRzzO
        .OORttttrrrrROO.
        ...RttttrrrrR...
        ...ORRRRRRRRO...
        ...OBbbbbbbvO...
        ...OBbbbObbvO...
        ...OBbbvObbvO...
        ...ObbbvObbvO...
        ...ObbvVOvvVO...
        ..OnnnNOOnnnNO..
        ..OnnNNOOnNNNO..
        ..OWWWWOOWWWWO..
        ...OOOO..OOOO...
    """),
}

MALE_LEFT = {
    "stand": g(14, """
        .....OTttttO....
        ....OTtAaattrO..
        ....OTtAaaftrO..
        ....OttAaaftrO..
        ....OttAaaftrO..
        ....OttaaffrrO..
        ....OttOsszOrO..
        ....OttOszOrrO..
        ....ORRROORRRO..
        .....OBbbbbvO...
        .....OBbbbbvO...
        .....OBbbbvO....
        .....ObbbbvO....
        .....ObbbvVO....
        ...OOnnnnnNO....
        ..OnnnnnnNNO....
        ..OWWWWWWWWO....
        ...OOOOOOOO.....
    """),
    "stepA": g(14, """
        .....OTttttO....
        ....OTttAaarrO..
        ....OTttAaafrO..
        ....OtttAaafrO..
        ....OtttaaffrO..
        ....OtttOsszOO..
        ....OtttOszOrO..
        ....OttttOOrrO..
        ....ORRRRRRRRO..
        .....OBbbbbvO...
        ....OBbbOObbvO..
        ...OBbbO..ObbvO.
        ..OBbbO....ObvO.
        ..ObbvO....OvVO.
        .OnnnnO....ONnO.
        OnnnnNO....OWWO.
        OWWWWWO.....OO..
        .OOOOO..........
    """),
    "stepB": g(14, """
        .....OTttttO....
        ....OTAaattrrO..
        ....OAaaftttrO..
        ....OAaafttrrO..
        ...OAaafOttrrO..
        ...OsszOtttrrO..
        ...OszOttttrrO..
        ....OOtttttrrO..
        ....ORRRRRRRRO..
        .....OBbbbbvO...
        ....OvbbOObbvO..
        ...OvvbO..ObbBO.
        ..OvvbO....ObbO.
        ..OvVVO....ObvO.
        .ONNNNO....OnnO.
        ONNNNNO....OWWO.
        OWWWWWO.....OO..
        .OOOOO..........
    """),
    "alert": g(14, """
        .....OTttttO....
        ....OTtAaattrO..
        ....OTtAaaftrO..
        ....OOsszffrrO..
        ...OsszOttttrO..
        ...OszOtttttrO..
        ....OOtttttrrO..
        ....OttttttrrO..
        ....ORRRRRRRRO..
        .....OBbbbbvO...
        .....OBbbbbvO...
        .....OBbbbvO....
        .....ObbbbvO....
        .....ObbbvVO....
        ...OOnnnnnNO....
        ..OnnnnnnNNO....
        ..OWWWWWWWWO....
        ...OOOOOOOO.....
    """),
}

FEMALE_DOWN = {
    "stand": g(14, """
        ....OOTttrOO....
        ..OaOTttttrOfO..
        ..OaOTttttrOfO..
        ..OaOtttttrOfO..
        ..OaOttttrrOfO..
        ..OsOtttttrOzO..
        ..OzORRRRRROzO..
        ...OOBbbbbvOO...
        ...OBbbbbbvvO...
        ..OBbbbbbbvvvO..
        ..OBbVbbVbbVvO..
        ..OOOOOOOOOOOO..
        ....OszOOszO....
        ....OszOOszO....
        ...OnnnOOnnnO...
        ...OnNNOOnNNO...
        ...OWWWOOWWWO...
        ....OOO..OOO....
    """),
    "stepA": g(14, """
        ....OOTttrOO....
        ..OaOTttttrOfO..
        ..OaOTttttrOfO..
        ..OaOtttttrOfO..
        ..OaOttttrrOfO..
        ..OaOtttttrOsO..
        ..OsORRRRRROzO..
        ..OzOBbbbbvOO...
        ..OOBbbbbbvvO...
        ..OBbbbbbbvvvO..
        ..OBbVbbVbbVvO..
        ..OOOOOOOOOOOO..
        ....OszOOszO....
        ....OszOOnnnO...
        ...OnnnOOnNNO...
        ...OnNNOOWWWO...
        ...OWWWO.OOO....
        ....OOO.........
    """),
    "alert": g(14, """
        ....OOTttrOO....
        ..OaOTttttrOfO..
        ..OaOTttttrOfO..
        ..OsOtttttrOzO..
        ..OzOttttrrOzO..
        ...OOtttttrOO...
        ....ORRRRRRO....
        ...OOBbbbbvOO...
        ...OBbbbbbvvO...
        ..OBbbbbbbvvvO..
        ..OBbVbbVbbVvO..
        ..OOOOOOOOOOOO..
        ....OszOOszO....
        ....OszOOszO....
        ...OnnnOOnnnO...
        ...OnNNOOnNNO...
        ...OWWWOOWWWO...
        ....OOO..OOO....
    """),
}

FEMALE_UP = FEMALE_DOWN  # the female top has no front detail: back = front

FEMALE_LEFT = {
    "stand": g(14, """
        .....OTttrO.....
        .....OTaatrO....
        .....OTaatrO....
        .....OtaafrO....
        .....OtaafrO....
        .....OtsztrO....
        .....ORzRRRO....
        .....OBbbbvO....
        ....OBbbbbvvO...
        ....OBbbbbvvO...
        ...OBbbVbbvvVO..
        ...OOOOOOOOOOO..
        ......OszO......
        ......OszO......
        ....OOnnnO......
        ....OnnnNO......
        ....OWWWWO......
        .....OOOO.......
    """),
    "stepA": g(14, """
        .....OTttrO.....
        .....OTtaafO....
        .....OTtaafO....
        .....OttaafO....
        .....OttaffO....
        .....OttOszO....
        .....ORROzOO....
        .....OBbbbvO....
        ....OBbbbbvvO...
        ....OBbbbbvvO...
        ...OBbbVbbvvVO..
        ...OOOOOOOOOOO..
        .....OszOOszO...
        ....OszO..OzzO..
        ...OnnnO..OnNO..
        ..OnnnNO..OWWO..
        ..OWWWWO...OO...
        ...OOOO.........
    """),
    "stepB": g(14, """
        .....OAttrO.....
        .....OaatrrO....
        ....OaaftrrO....
        ....OaaftrrO....
        ....OafOttrO....
        ....OszOttrO....
        .....OORRRRO....
        .....OBbbbvO....
        ....OBbbbbvvO...
        ....OBbbbbvvO...
        ...OBbbVbbvvVO..
        ...OOOOOOOOOOO..
        .....OzzOOszO...
        ....OzzO..OszO..
        ...ONNNO..OnnO..
        ..ONNNNO..OWWO..
        ..OWWWWO...OO...
        ...OOOO.........
    """),
    "alert": g(14, """
        .....OTttrO.....
        .....OTaatrO....
        .....OTaatrO....
        ....OsszafrO....
        ....OszOtfrO....
        .....OOttttO....
        .....ORRRRRO....
        .....OBbbbvO....
        ....OBbbbbvvO...
        ....OBbbbbvvO...
        ...OBbbVbbvvVO..
        ...OOOOOOOOOOO..
        ......OszO......
        ......OszO......
        ....OOnnnO......
        ....OnnnNO......
        ....OWWWWO......
        .....OOOO.......
    """),
}


def _front_set(d):
    return {"stand": d["stand"], "stepA": d["stepA"], "stepB": mirror(d["stepA"]), "alert": d["alert"]}


BODIES = {
    "male": {"down": _front_set(MALE_DOWN), "up": _front_set(MALE_UP), "left": MALE_LEFT},
    "female": {"down": _front_set(FEMALE_DOWN), "up": _front_set(FEMALE_UP), "left": FEMALE_LEFT},
}


# ================================================================ palettes
# 4-tone ramps (hi, base, shadow, deep). Highlights lean warm, shadows lean
# cool. Characters share colours between materials on purpose (a white
# shirt's shadow is the light tone of the trousers, pupils are the deepest
# cloth tone) so each sheet fits one 15-colour + transparent GBA palette.



R, B, TL, NV, PK, SK = V2["v2_red"], V2["v2_blue"], V2["v2_teal"], V2["v2_navy"], V2["v2_pink"], V2["v2_skin"]
WHITE = V2["v2_white"][0]


# ================================================================== heads
def head_rows(top, text, alert=None):
    return {"layer": g(top, text), "alert": alert}


PLAYER_V2 = {
    "id": "player", "label": "Player (boy)", "gender": "male", "body": "male",
    # cap/shoes red, jacket + sleeves blue, trousers the darker blues,
    # the tee's shadow is the jacket highlight (cool white).
    "mats": {
        "skin": SK, "hair": V2["v2_hair_dark"], "hat": R[:3], "top": B, "arm": B[:3],
        "bottom": [B[1], B[2], B[3], B[3]], "acc": R[:3], "shoes": R[:3],
        "white": [WHITE, B[0]], "eye": [B[3], B[1]], "mouth": [SK[2]], "blush": [SK[2]],
    },
    "heads": {
        "down": g(2, """
            ....OOOOOOOO....
            ...OCCcccccxO...
            ..OCcwwwwwwcxO..
            ..OccwwxxwwcxO..
            ..OccWWWWWWcxO..
            .OCccccccccccxO.
            .OhxxxxxxxxxxhO.
            .OhzzzzzzzzzzhO.
            .OhSsesssseszhO.
            .OhSsissssiszhO.
            ..OSsssmsssszO..
            ...OOzsssszOO...
        """),
        "up": g(2, """
            ....OOOOOOOO....
            ...OCCcccccxO...
            ..OCccccccccxO..
            ..OCccccccccxO..
            ..OcccOhhOccxO..
            .OcccccccccccxO.
            .OHhhhhhhhhhhyO.
            .OHhhhhhhhhhyyO.
            .OhhhhhhhhhhyyO.
            .OhhhhhhhhhyyyO.
            ..OhhyhhyhhyyO..
            ...OOOsssszOO...
        """),
        "left": g(2, """
            .....OOOOOOO....
            ....OCCcccccxO..
            ...OCwwwcccccxO.
            ...OCwkwcccccxO.
            ...OcWWWcccccxO.
            ..OCcccccccccxO.
            OCcccxxxhHHhhyO.
            .OOzzzzshhHhhyO.
            ..OsessszhhhhyO.
            .OSsisssszhhhyO.
            ..OsmssszhhhyO..
            ...OOsssszOOO...
        """),
    },
    "alert": {"down": {12: "..OSssOOssszO..."}},
    "over": {
        "down": g(15, """
            .....c....x.....
            .....c....x.....
            .....c....x.....
            .....x....x.....
        """),
        "up": g(15, """
            ...OOOOOOOOOO...
            ...OCcccccccxO..
            ...OccOOOOcxO...
            ...OccwwWccxO...
            ...OcccccccxO...
            ...OcccccccxO...
            ...OxxxxxxxxO...
            ...OOOOOOOOOO...
        """),
        "left": g(15, """
            ............OOO.
            ............OcxO
            ............OcxO
            ............OcxO
            ............OxxO
            ............OOO.
        """),
    },
}

PLAYER_F_V2 = {
    "id": "player_f", "label": "Player (girl)", "gender": "female", "body": "female",
    # white sun hat with a red band, teal top, red skirt + shoes + bag.
    "mats": {
        "skin": SK, "hair": V2["v2_hair_brown"], "hat": [WHITE, TL[0]], "top": TL, "arm": SK,
        "bottom": [R[0], R[1], R[2], R[2]], "acc": R[:3], "shoes": R[:3],
        "white": [WHITE, TL[0]], "eye": [TL[3], TL[2]], "mouth": [R[2]], "blush": [R[0]],
    },
    "heads": {
        "down": g(2, """
            ....OOOOOOOO....
            ...OwwwwwwwWO...
            ..OwwwwwwwwWWO..
            ..OPpppppppqqO..
            OwwwwwwwwwwwwwWO
            .OWWWWWWWWWWWWO.
            .OHhhhHhhhhhhyO.
            .OhhyssssssyhhO.
            .OhhsyssssyshhO.
            .OhSsesssseszhO.
            .OhsuissssiuzhO.
            .OhhOssmsszOhhO.
            .OyO........OyO.
        """),
        "up": g(2, """
            ....OOOOOOOO....
            ...OwwwwwwwWO...
            ..OwwwwwwwwWWO..
            ..OPpppppppqqO..
            OwwwwwwwwwwwwwWO
            .OWWWWWWWWWWWWO.
            .OHhhhHhhhhhhyO.
            .OHhhhhhhhhhyyO.
            .OhhhhhhhhhyyyO.
            .OhhhhOppOhyyyO.
            .OyhhOHhhyOyyyO.
            .OyyyOhhhyOyyyO.
            .OyO.OhhyO..OyO.
            .....OhhyO......
            ......OyO.......
        """),
        "left": g(2, """
            .....OOOOOOO....
            ....OwwwwwwWO...
            ...OwwwwwwwwWO..
            ...OPppppppppqO.
            OwwwwwwwwwwwwWO.
            .OWWWWWWWWWWWO..
            ..OHhhhhhhhhyO..
            ..OhyhhHHhhhyOO.
            .OsyshhhHhhyyOyO
            .OsesshhhhhyyOyO
            OSsiusszhhhyyOyO
            .OsmssOhhhyyOyO.
            ..OOOO.OyyOOOyO.
            ............OO..
        """),
    },
    "alert": {"down": {9: ".OhhsyssssyshhO.", 10: ".OhhsssssssshhO.", 13: ".OhhOssOOszOhhO."}},
    "over": {
        "down": g(15, """
            ..........p.....
            .........p......
            ........p.......
            .......p........
            ......p.........
            ....OOpO........
            ...OPppqO.......
            ...OppqqO.......
            ...OOOOOOO......
        """),
        "up": g(15, """
            .....p..........
            ......p.........
            .......p........
            ........p.......
            ........p.......
            .......OpOO.....
            ......OPppqO....
            ......OppqqO....
            ......OOOOOOO...
        """),
    },
    # facing right she shows her right side, where the bag hangs
    "right": g(15, """
        ........p.......
        ........p.......
        ........p.......
        .........p......
        .........p......
        ........OpOO....
        .......OPppqO...
        .......OppqqO...
        ........OOOO....
    """),
}

LASS_V2 = {
    "id": "lass", "label": "Lass", "gender": "female", "body": "female",
    # long blue-black hair, pink band, white blouse, navy skirt, pink shoes.
    "mats": {
        "skin": SK, "hair": V2["v2_hair_black"], "hat": PK, "top": [WHITE, WHITE, NV[0], NV[3]],
        "arm": [WHITE, WHITE, NV[0]], "bottom": NV, "acc": PK, "shoes": PK,
        "white": [WHITE, NV[0]], "eye": [NV[3], NV[2]], "mouth": [PK[2]], "blush": [PK[0]],
    },
    "heads": {
        "down": g(3, """
            ....OOOOOOOO....
            ...OHHhhhhhyO...
            ..OHHhhhhhhhyO..
            ..OPPpppppppqO..
            .OHhhhhhhhhhhyO.
            .OhhhHhhhhhhyyO.
            .OhhyssssssyhhO.
            .OhhsyssssyshhO.
            .OhSsesssseszhO.
            .OhsuissssiuzhO.
            .OhhOssmsszOhhO.
            .OhyhOOOOOOhyhO.
            .OhyO......OyhO.
            .OyyO......OyyO.
        """),
        "up": g(3, """
            ....OOOOOOOO....
            ...OHHhhhhhyO...
            ..OHHhhhhhhhyO..
            ..OPPpppppppqO..
            .OHhhhhhhhhhhyO.
            .OHhhhhhhhhhyyO.
            .OhhhhhhhhhhyyO.
            .OhhhhhhhhhyyyO.
            .OhhhhhhhhhyyyO.
            .OhhhhhhhhyyyyO.
            .OhhhhhhhhyyyyO.
            .OhhhhhhhyyyyyO.
            .OyhhhhhhyyyyyO.
            ..OOyyyyyyyyOO..
            ....OOOOOOOO....
        """),
        "left": g(3, """
            .....OOOOOOO....
            ....OHhhhhhyO...
            ...OHhhhhhhhyO..
            ...OPpppppppqqO.
            ..OHhhhhhhhhhyO.
            ..OhhhhhhhhhyyO.
            ..OhyhhHHhhhyyO.
            .OsyshhhHhhhyyyO
            .OsesshhhhhhyyyO
            OSsiusszhhhhyyyO
            .OsmssOhhhhhyyyO
            ..OOOO.OhhhyyyO.
            .......OhhyyyyO.
            .......OyyyyyO..
            ........OOOOO...
        """),
    },
    "alert": {"down": {9: ".OhhsyssssyshhO.", 10: ".OhhsssssssshhO.", 13: ".OhhOssOOszOhhO."}},
    # a long skirt (hem at the knee) and a pink sailor ribbon at the collar
    "over": {
        "down": [g(15, """
            .......Pq.......
            ......Pq.q......
        """), g(25, """
            ..OBbVbbVbbVvO..
            ..OBbVbbVbbVvO..
            ..OOOOOOOOOOOO..
        """)],
        "up": g(25, """
            ..OBbVbbVbbVvO..
            ..OBbVbbVbbVvO..
            ..OOOOOOOOOOOO..
        """),
        "left": g(25, """
            ...OBbbVbbvvVO..
            ...OBbbVbbvvVO..
            ...OOOOOOOOOOO..
        """),
    },
}

CAST_V2 = [PLAYER_V2, PLAYER_F_V2, LASS_V2]
HANDMADE_IDS = {c["id"] for c in CAST_V2}


# ================================================================== sheets
COLUMNS = ["stand", "walkA", "walkB", "runStand", "runA", "runB", "blink", "alert"]
ROWS = ["down", "up", "left", "right"]
_BODY = {"stand": "stand", "walkA": "stepA", "walkB": "stepB", "runStand": "stand",
         "runA": "stepA", "runB": "stepB", "blink": "stand", "alert": "alert"}
TORSO_ROW = 24  # row dropped for the walk bob
CHIN_ROW = {"male": 21, "female": 22}  # second row dropped for the run lean (keeps hands whole)


def _drop(canvas, rows):
    kept = [r for i, r in enumerate(canvas) if i not in rows]
    return [["."] * W for _ in rows] + kept


def _lead(canvas, below, step):
    """Shift rows above `below` one pixel toward the facing (step -1 = left)."""
    out = []
    for i, r in enumerate(canvas):
        if i >= below:
            out.append(r)
        elif step < 0:
            out.append(r[1:] + ["."])
        else:
            out.append(["."] + r[:-1])
    return out


def _blink(canvas):
    out = [r[:] for r in canvas]
    for y in range(H):
        for x in range(W):
            if canvas[y][x] == "e":
                out[y][x] = "s"
            elif canvas[y][x] == "i":
                out[y][x] = "O"
    return out


def _alert_head(char, direction):
    head = char["heads"][direction]
    swaps = char.get("alert", {}).get(direction)
    if not swaps:
        return head
    top, rows = head
    rows = list(rows)
    for y, text in swaps.items():
        rows[y - top] = g(y, text)[1][0]
    return (top, rows)


def frame_letters(char, direction, column):
    """The letter grid for one frame (after pose, bob, blink and lean)."""
    src = "left" if direction == "right" else direction
    pose = _BODY[column]
    body = BODIES[char["body"]][src][pose]
    head = _alert_head(char, src) if column == "alert" else char["heads"][src]
    over = char.get("over", {}).get(src)
    over = over if isinstance(over, list) else [over]
    canvas = stack(body, *over, head)
    if direction == "right":
        canvas = [r[::-1] for r in canvas]
        canvas = stack((0, ["".join(r) for r in canvas]), char.get("right"))
    if column == "blink":
        canvas = _blink(canvas)
    if column in ("walkA", "walkB"):
        canvas = _drop(canvas, {TORSO_ROW})
    elif column.startswith("run"):
        if direction in ("left", "right"):
            canvas = _lead(canvas, CHIN_ROW[char["body"]] + 1, -1 if direction == "left" else 1)
        canvas = _drop(canvas, {CHIN_ROW[char["body"]], TORSO_ROW})
    return canvas


def colour(char, ch):
    if ch == "O":
        return OUTLINE
    mat, idx = LETTERS[ch]
    ramp = char["mats"][mat]
    return ramp[min(idx, len(ramp) - 1)]


def hex_rgba(h):
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)


def render(char, direction, column):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(frame_letters(char, direction, column)):
        for x, ch in enumerate(row):
            if ch != ".":
                px[x, y] = hex_rgba(colour(char, ch))
    return img


def build_sheet(char):
    sheet = Image.new("RGBA", (W * len(COLUMNS), H * len(ROWS)), (0, 0, 0, 0))
    for r, direction in enumerate(ROWS):
        for c, column in enumerate(COLUMNS):
            sheet.paste(render(char, direction, column), (c * W, r * H))
    return sheet


def right_fix_mask(char):
    """Pixels (x, y) the `right` layer may change; the rest mirror left."""
    layer = char.get("right")
    if not layer:
        return set()
    top, rows = layer
    return {(x, top + dy) for dy, row in enumerate(rows) for x, ch in enumerate(row) if ch != "."}
