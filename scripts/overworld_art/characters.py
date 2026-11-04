"""Character roster: heads per direction, body type, material -> ramp map.

A head layer covers y=9..~25 (long hair and ponytails drape over the
body). `alert_face` optionally replaces the down-facing head for the
"spotted you" frame (open mouth etc.). Eyes are 2px tall `e` so the
blink frame can close them automatically.
"""
from .compose import grid
from .parts import EXTRAS, FACE, FEATURES, HAIR, HATS

# ------------------------------------------------------------ player boy
# Red cap with white front panel, dark spiky hair, red vest over a black
# tee, navy trousers. Silhouette: cap brim + hair tufts at the temples.
PLAYER_BOY = {
    "id": "player",
    "label": "Player (boy)",
    "gender": "male",
    "body": "male",
    "mats": {
        "s": "skin_light", "h": "hair_dark", "c": "red", "x": "red",
        "t": "red", "u": "charcoal:2", "a": "charcoal:2", "f": "skin_light",
        "b": "navy", "l": "navy", "n": "red", "m": "skin_light",
    },
    "heads": {
        "down": grid(10, """
            .....cccccc.....
            ...cccccccccc...
            ..cccwwwwwwccc..
            ..cccwwwwwwccc..
            ..cccccccccccc..
            .hCCCCCCCCCCCCh.
            .hhshsssssshshh.
            .hhssessssesshh.
            .hhssessssesshh.
            ..ssssssssssss..
            ...ssssMMssss...
            .....ssssss.....
        """),
        "up": grid(10, """
            .....cccccc.....
            ...cccccccccc...
            ..cccccccccccc..
            ..cccccccccccc..
            ..cccchhhhcccc..
            .hhcccccccccchh.
            .hhhhhhhhhhhhhh.
            .hhhhhhhhhhhhhh.
            .hhhhhhhhhhhhhh.
            ..hhhhhhhhhhhh..
            ...hh.hhhh.hh...
            ......ssss......
        """),
        "left": grid(10, """
            ......cccccc....
            ....cccccccccc..
            ...cwwwccccccc..
            ...cwwwccccccc..
            ...ccccccccccch.
            .CCCCCChhhhhhhh.
            ...shsshhhhhhhh.
            ...sesssshhhhhh.
            ...sesssShhhhh..
            ...ssssssshhhh..
            ...sMssssshhh...
            ....ssssss......
        """),
    },
}

# ----------------------------------------------------------- player girl
# White sun hat with red band, long brown hair with a high ponytail,
# sky top, red skirt. Silhouette: wide hat brim + ponytail.
PLAYER_GIRL = {
    "id": "player_f",
    "label": "Player (girl)",
    "gender": "female",
    "body": "female",
    "mats": {
        "s": "skin_light", "h": "hair_brown", "c": "white", "x": "red:2",
        "t": "sky", "u": "white", "a": "sky", "f": "skin_light",
        "b": "red:2", "l": "skin_light", "n": "red:2", "m": "skin_light",
    },
    "heads": {
        "down": grid(9, """
            ......cccc......
            ....cccccccc....
            ...cccccccccc...
            ...xxxxxxxxxx...
            .cccccccccccccc.
            .hCCCCCCCCCCCCh.
            .hhhhsssssshhhh.
            .hhhsssssssshhh.
            .hhheessssеehhh.
            .hhhsesssseshhh.
            .hhhsssssssshhh.
            .hhhsssMMssshhh.
            .hhh.ssssss.hhh.
            .hhh........hhh.
            .hHh........hHh.
            ..h..........h..
        """.replace("е", "e")),
        "up": grid(9, """
            ......cccc......
            ....cccccccc....
            ...cccccccccc...
            ...xxxxxxxxxx...
            .cccccccccccccc.
            .CCCCCCCCCCCCCC.
            .hhhhhhxxhhhhhh.
            .hhhhhkhhkhhhhh.
            .hhhhkhhhhkhhhh.
            .hHhhkhhhhkhhHh.
            .hHhkhhhhhhkhHh.
            .hhhkhhhhhhkhhh.
            .hhh.khhhhk.hhh.
            .hhh..khhk..hhh.
            .hHh..khhk..hHh.
            ..h....hh....h..
            .......hh.......
        """),
        "left": grid(9, """
            .......cccc.....
            .....cccccccc...
            ....cccccccccc..
            ....xxxxxxxxxx..
            .cccccccccccccc.
            ..CCCCCCCCCCCC..
            ...hhhhhhhhhhh..
            ...ssshhhhhhxhh.
            ..eessshhhhhhhhh
            ...sesshhhhhhhhh
            ...sssssshhhh.hh
            ...sssssshhh..hh
            ...sMsssshhh..hh
            ....sssss.....hh
            ..............hh
            ...............h
        """),
    },
}

# -------------------------------------------------------------- youngster
# Backwards green cap (no brim over the eyes), messy fringe, big grin,
# white tee, khaki shorts with bare knees. Silhouette: brim sticking
# out the BACK in side view, knees showing.
YOUNGSTER = {
    "id": "youngster",
    "label": "Youngster",
    "gender": "male",
    "body": "male",
    "mats": {
        "s": "skin_tan", "h": "brown", "c": "green", "x": "green",
        "t": "white", "u": "white", "a": "white", "f": "skin_tan",
        "b": "khaki:2", "l": "skin_tan", "n": "brown:2", "m": "brown",
    },
    "heads": {
        "down": grid(10, """
            .....cccccc.....
            ...cccccccccc...
            ..cccccccccccc..
            ..cccccccccccc..
            ..CCCCCCCCCCCC..
            .hhhhhhhhhhhhhh.
            .hhshhsssshhshh.
            .hsssessssesssh.
            ..sssessssesss..
            ..ssssssssssss..
            ...sssmwwmsss...
            .....ssssss.....
        """),
        "up": grid(10, """
            .....cccccc.....
            ...cccccccccc...
            ..cccccccccccc..
            ..cccchhhhcccc..
            .CCCCCCCCCCCCCC.
            .hCCCCCCCCCCCCh.
            .hhhhhhhhhhhhhh.
            .hhhhhhhhhhhhhh.
            .hhhhhhhhhhhhhh.
            ..hhhhhhhhhhhh..
            ...hhhhhhhhhh...
            ......ssss......
        """),
        "left": grid(10, """
            .....cccccc.....
            ....ccccccccc...
            ...cccccccccc...
            ...ccccccccCCCC.
            ..hhhhhhhhhhhh..
            .hhhhhhhhhhhhh..
            ..shshhhhhhhhh..
            ..sesssshhhhhh..
            ..sesssShhhhh...
            ..ssssssshhhh...
            ..smwsssshhh....
            ...ssssss.......
        """),
    },
}



# ---------------------------------------------------------- parts-built cast
# Everyone else is assembled from parts.py. `look` lists hair, hat,
# features and extras; `mats` maps materials to palette ramps. Defaults:
# forearms and mouth use the skin ramp, lower legs follow the bottom.
DIRS = ("down", "up", "left")


def _as_list(part):
    return part if isinstance(part, list) else [part]


def make(id, label, gender, mats, hair, hat=None, features=(), extras=(), body=None):
    mats = {"f": mats["s"], "m": mats["s"], "l": mats.get("b"), "u": mats.get("t"), "a": mats.get("t"), **mats}
    feats = list(features)
    if gender == "female" and "lash" not in feats and "closed" not in feats:
        feats.append("lash")
    if "beard" not in feats and "moustache" not in feats and "grin" not in feats:
        feats.append("mouth")

    def head(direction, alert=False):
        layers = [FACE[direction]] + _as_list(HAIR[hair][direction])
        for f in feats:
            if alert and f in ("mouth", "grin"):
                f = "open"
            layer = FEATURES[f].get(direction)
            if layer:
                layers.append(layer)
        if hat:
            layers += _as_list(HATS[hat][direction])
        return layers

    under, over = {d: [] for d in DIRS}, {d: [] for d in DIRS}
    for name in extras:
        order, by_dir, *special = EXTRAS[name]
        for d in DIRS:
            if d in by_dir:
                which = (special[0].get(d, order) if special else order)
                (under if which == "under" else over)[d] += _as_list(by_dir[d])
    return {
        "id": id, "label": label, "gender": gender, "body": body or gender, "mats": mats,
        "heads": {d: head(d) for d in DIRS},
        "alert_heads": {d: head(d, alert=True) for d in DIRS},
        "under": under, "over": over,
    }


M, F = "male", "female"
CAST = [
    # ------------------------------------------------------------ boys
    make("rival", "Rival", M, {"s": "skin_light", "h": "hair_red", "t": "charcoal", "u": "orange:2",
         "f": "charcoal", "b": "denim", "n": "charcoal"}, "spiky", features=["brows"]),
    make("bug_catcher", "Bug Catcher", M, {"s": "skin_light", "h": "hair_dark", "c": "straw", "x": "green",
         "t": "green", "b": "khaki:2", "l": "skin_light", "n": "khaki:2"}, "short", hat="straw"),
    make("camper", "Camper", M, {"s": "skin_tan", "h": "hair_dark", "c": "red:2", "x": "red:2",
         "t": "olive", "b": "khaki:2", "l": "skin_tan", "n": "red:2"}, "short", hat="bandana", features=["grin"]),
    make("hiker", "Hiker", M, {"s": "skin_tan", "h": "hair_dark", "c": "red", "x": "red", "t": "red",
         "f": "red", "b": "khaki", "n": "brown", "p": "brown"}, "short", hat="beanie",
         features=["beard"], extras=["pack"]),
    make("sailor", "Sailor", M, {"s": "skin_tan", "h": "hair_black", "c": "white", "x": "navy", "t": "white",
         "u": "navy", "b": "navy", "n": "navy"}, "short", hat="sailor", features=["brows"]),
    make("fisherman", "Fisherman", M, {"s": "skin_tan", "h": "hair_dark", "c": "olive", "x": "olive",
         "t": "olive", "u": "white", "a": "white", "b": "denim", "n": "denim"}, "short", hat="bucket",
         features=["moustache"]),
    make("scientist", "Scientist", M, {"s": "skin_light", "h": "hair_black", "g": "hair_black", "t": "white",
         "u": "sky", "f": "white", "b": "gray", "n": "hair_black"}, "messy", features=["glasses"],
         extras=["coat"]),
    make("grunt_m", "Grunt", M, {"s": "skin_light", "h": "hair_dark", "c": "charcoal", "x": "charcoal", "g": "red",
         "t": "charcoal", "f": "charcoal", "b": "charcoal", "n": "white:2"}, "short", hat="beanie",
         features=["brows"], extras=["emblem"]),
    make("black_belt", "Black Belt", M, {"s": "skin_tan", "h": "hair_black", "c": "red", "t": "white",
         "u": "skin_tan", "f": "skin_tan", "b": "white", "n": "skin_tan", "p": "charcoal"}, "spiky",
         hat="headband", features=["brows"], extras=["belt"]),
    make("gentleman", "Gentleman", M, {"s": "skin_light", "h": "hair_gray", "c": "charcoal", "x": "white",
         "t": "charcoal", "u": "white", "f": "charcoal", "b": "charcoal", "n": "charcoal"}, "slick",
         hat="tophat", features=["moustache"]),
    make("old_man", "Old Man", M, {"s": "skin_light", "h": "hair_gray", "t": "brown", "u": "khaki:2",
         "f": "brown", "b": "gray", "n": "brown", "p": "brown"}, "bald", features=["brows", "closed", "moustache"],
         extras=["cane"]),
    make("biker", "Biker", M, {"s": "skin_light", "h": "hair_black", "g": "charcoal", "t": "charcoal",
         "u": "red:2", "a": "skin_light", "b": "denim", "n": "charcoal"}, "pompadour", features=["shades"]),
    make("cooltrainer_m", "Cool Trainer", M, {"s": "skin_light", "h": "hair_blond", "t": "teal",
         "u": "white:2", "f": "teal", "b": "navy", "n": "navy"}, "swept"),
    make("gym_guide", "Gym Guide", M, {"s": "skin_light", "h": "hair_dark", "c": "navy", "x": "yellow",
         "t": "yellow", "b": "navy", "n": "navy"}, "short", hat="cap", features=["grin"]),
    make("leader_m", "Gym Leader Brawn", M, {"s": "skin_deep", "h": "hair_black", "t": "orange", "u": "green",
         "a": "skin_deep", "b": "brown", "n": "brown", "c": "green", "x": "green"}, "bald", hat="bandana",
         features=["closed", "brows"]),
    make("professor", "Professor", M, {"s": "skin_light", "h": "hair_gray", "t": "khaki", "u": "red:2",
         "f": "khaki", "b": "brown", "n": "brown"}, "slick", features=["brows"], extras=["coat"]),
    # ----------------------------------------------------------- girls
    make("lass", "Lass", F, {"s": "skin_light", "h": "hair_brown", "x": "red:2", "t": "white", "u": "red:2",
         "b": "navy", "l": "skin_light", "n": "navy"}, "long", hat="bow"),
    make("picnicker", "Picnicker", F, {"s": "skin_tan", "h": "hair_brown", "t": "green", "b": "orange",
         "l": "skin_tan", "n": "brown:2"}, "buns", features=["grin"]),
    make("beauty", "Beauty", F, {"s": "skin_light", "h": "hair_red", "x": "yellow", "t": "pink", "b": "pink",
         "l": "skin_light", "n": "red:2"}, "long", features=["clip"], extras=["longskirt"]),
    make("nurse", "Nurse", F, {"s": "skin_light", "h": "hair_pink", "c": "white", "x": "red:2", "t": "pink",
         "u": "white", "b": "pink", "l": "white", "n": "white", "p": "white"}, "bob", hat="nurse",
         extras=["apron", "longskirt"]),
    make("old_woman", "Old Woman", F, {"s": "skin_light", "h": "hair_gray", "t": "brown", "b": "brown",
         "l": "brown", "n": "brown", "p": "purple"}, "bun", features=["closed"],
         extras=["shawl", "longskirt"]),
    make("cooltrainer_f", "Cool Trainer", F, {"s": "skin_light", "h": "hair_black", "t": "teal", "u": "white:2",
         "f": "teal", "b": "navy", "l": "navy", "n": "navy"}, "long"),
    make("grunt_f", "Grunt", F, {"s": "skin_light", "h": "hair_purple", "c": "charcoal", "x": "red", "g": "red",
         "t": "charcoal", "f": "charcoal", "b": "charcoal", "l": "charcoal", "n": "white:2"}, "bob",
         hat="cap", extras=["emblem"]),
    make("battle_girl", "Battle Girl", F, {"s": "skin_tan", "h": "hair_black", "c": "red", "x": "red",
         "t": "yellow", "a": "skin_tan", "b": "charcoal", "l": "skin_tan", "n": "red"}, "ponytail",
         hat="headband", features=["brows"], extras=["shorts_f"]),
    make("twin", "Twin", F, {"s": "skin_light", "h": "hair_brown", "x": "red:2", "t": "sky", "u": "white",
         "b": "sky", "l": "skin_light", "n": "red:2"}, "twintails", features=["grin"]),
    make("mom", "Mom", F, {"s": "skin_light", "h": "hair_dark", "t": "purple", "b": "purple",
         "l": "skin_light", "n": "purple", "p": "white"}, "bob", extras=["apron", "longskirt"]),
    make("leader_f", "Gym Leader Marina", F, {"s": "skin_light", "h": "hair_teal", "x": "pink", "t": "white",
         "u": "teal", "a": "teal", "b": "teal", "l": "skin_light", "n": "teal"}, "ponytail", features=["clip"]),
    # ------------------------------------------- generic townsperson ("npc")
    make("npc", "Townsperson", M, {"s": "skin_light", "h": "hair_brown", "t": "green", "u": "white:2",
         "b": "denim", "n": "hair_brown:2"}, "short"),
]

ROSTER = [PLAYER_BOY, PLAYER_GIRL, YOUNGSTER] + CAST
