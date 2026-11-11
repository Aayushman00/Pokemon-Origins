"""Character roster: heads per direction, body type, material -> ramp map.

A head layer covers y=9..~25 (long hair and ponytails drape over the
body). `alert_face` optionally replaces the down-facing head for the
"spotted you" frame (open mouth etc.). Eyes are 2px tall `e` so the
blink frame can close them automatically.
"""
from .compose import grid
from .parts import EXTRAS, FACE, FEATURES, HAIR, HATS

# ------------------------------------------------------------ player boy
# Original design: no cap. An asymmetric side-swept fringe and a gold scarf
# carry the silhouette from every side, over a teal jacket. Hair locks: the
# main ridge (the only highlight) sweeps down to one side, a fringe lock hangs
# over one brow, a shorter lock covers the far side, pointed locks at the nape;
# in profile it is a wedge swept back from a straight brow line, so the face
# sits over the chest. Hand-shaded at final size (sheets "shade": "manual"):
# j/h/H hair, y/s/S skin, W glint over I iris, z/u/U scarf. Light is top-left
# in all four views.
PLAYER_BOY = {
    "id": "player",
    "label": "Player (boy)",
    "gender": "male",
    "body": "hero",
    "shade": "manual",
    "mats": {
        "s": "skin_hero", "h": "hair_midnight", "i": "iris_midnight", "t": "teal", "u": "yellow",
        "l": "hair_midnight", "n": "yellow",
    },
    "heads": {
        "down": grid(11, """
            ........hH......
            ......jjjhH.....
            ....hjjjjhhH....
            ...jjjhhhHhhH...
            ..jhhhHhhHhhH...
            ...hhhhHyysHH...
            ...hhHyyyssSH...
            ...HsyWssWsS....
            ....ssIssIsS....
            .....ysssSS.....
            ....zzuuuuUU....
        """),
        "up": grid(11, """
            .......hH.......
            .....jjjhH......
            ....jjjjhhH.....
            ...hjjjhhhhHh...
            ...hhhhhhHhhhH..
            ...hhhhhHhhhH...
            ...hhHhhhhHhH...
            ....hhHhhhhHH...
            ....hhhHhhhHH...
            ....hH.hhH.H....
            ....zzuuuuUU....
        """),
        "left": grid(11, """
            ..........hH....
            .......jjjhhH...
            ......jjjjhhHh..
            ......hhjjjhHHh.
            ......HhhhHhhH..
            ......hhHhhhH...
            ......yyshhHH...
            ......yWShhH....
            ......sIShH.....
            ......sSSH......
            .....zzuuUU.....
        """),
        "right": grid(11, """
            ....jh..........
            ...jjjhhH.......
            ..hjjjjhhH......
            .hHjjjhhhH......
            ..HhhHhhhH......
            ...HhhhHhh......
            ...hhhHssS......
            ....hhHsWS......
            .....hHsIS......
            ......HsSS......
            .....zzuuUU.....
        """),
    },
}

# ----------------------------------------------------------- player girl
# Same family, own shape: a high ponytail instead of the tuft, coral jacket.
PLAYER_GIRL = {
    "id": "player_f",
    "label": "Player (girl)",
    "gender": "female",
    "body": "female",
    "mats": {
        "s": "skin_light", "h": "hair_dark", "t": "orange", "u": "teal:2", "a": "orange", "f": "orange",
        "b": "denim:2", "l": "denim:2", "n": "brown:2", "m": "skin_light",
    },
    "heads": {
        "down": grid(9, """
            ................
            .....hhhhhh.....
            ....hhhhhhhh....
            ...hhhhhhhhhh...
            ..hhhhhhhhhhhh..
            ..hhhhhhhhhhhh..
            ..hhsssshssshh..
            .hhssssssssshhh.
            .hhsseSsseSsshh.
            .hhsseSsseSsshh.
            .h.ssssMMssss.h.
            ....ssssssss....
            .....uuuuuu.....
        """),
        "up": grid(9, """
            ................
            .....hhhhhh.....
            ....hhhhhhhh....
            ...hhhhhhhhhh...
            ..hhhhhhhhhhhh..
            ..hhhhhhhhhhhh..
            ..hhhhhhhhhhhh..
            .hhhhhhhhhhhhhh.
            .hhhhhhhhhhhhhh.
            .hhhhhhhhhhhhhh.
            .h.hhhhhhhhhh.h.
            ....hhhhhhhh....
            .....uuhhuu.....
        """),
        "left": grid(9, """
            ...........hh...
            .....hhhhhhhhh..
            ....hhhhhhhhhhh.
            ...hhhhhhhhhhhh.
            ...hhhhhhhhhhhh.
            ...hhhhhhhhhhhhh
            ...sshhhhhhhhhhh
            ..ssssshhhhhhhhh
            ..sessssshhhhh.h
            ..sessssshhhhh.h
            ..sssMsssshhh...
            ...sssssss......
            ....uuuuuuuu....
        """),
    },
}

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
            ......tttt......
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
         "u": "sky", "f": "white", "b": "charcoal", "n": "hair_black"}, "messy", features=["glasses"],
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
    make("clerk", "Mart Clerk", M, {"s": "skin_light", "h": "hair_brown", "c": "sky", "x": "sky",
         "t": "sky", "u": "white:2", "b": "navy", "n": "navy", "p": "white:2"}, "short", hat="cap",
         extras=["apron"]),
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
    # ------------------------------------------------- Gym Leaders and League
    make("willow_thornby", "Willow Thornby", F, {"s": "skin_light", "h": "hair_moss:2", "c": "green:2", "x": "pink:2",
         "t": "khaki:2", "u": "khaki:2", "f": "khaki:2", "b": "olive:2", "l": "olive:2", "n": "olive:2"}, "braid",
         hat="wreath", extras=["longskirt"]),
    make("mara_quill", "Mara Quill", F, {"s": "skin_light", "h": "hair_red", "c": "white", "x": "white",
         "t": "orange", "u": "white:2", "f": "skin_light", "a": "orange", "b": "orange", "l": "skin_light",
         "n": "brown:2", "p": "white"}, "bob", hat="toque", features=["grin"], extras=["apron"]),
    make("tavish_rook", "Tavish Rook", M, {"s": "skin_tan", "h": "hair_gray", "x": "red:2", "t": "white",
         "u": "skin_tan", "f": "white", "b": "charcoal", "l": "charcoal", "n": "charcoal", "p": "red:2"}, "topknot",
         features=["brows", "closed"], extras=["sash", "hakama"]),
    make("coral_marlowe", "Coral Marlowe", F, {"s": "skin_tan", "h": "hair_pink", "c": "white", "x": "navy",
         "g": "yellow", "t": "navy", "u": "white:2", "f": "navy", "b": "navy", "l": "navy", "n": "charcoal"}, "long",
         hat="captain", features=["grin"], extras=["peacoat"]),
    make("volt_dray", "Volt Dray", M, {"s": "skin_light", "h": "hair_blond:2", "g": "yellow:2", "t": "gray:2",
         "u": "gray:2", "f": "skin_light", "a": "gray:2", "b": "charcoal", "n": "charcoal", "p": "yellow"}, "bolt",
         hat="goggles", features=["grin"], extras=["bib"]),
    make("skye_corvin", "Skye Corvin", F, {"s": "skin_light", "h": "brown:2", "c": "brown:2", "g": "gray:2",
         "x": "red:2", "t": "sky:2", "u": "sky:2", "f": "brown:2", "b": "khaki:2", "l": "khaki:2", "n": "brown:2",
         "p": "khaki:2"}, "short", hat="aviator", extras=["scarf", "falcon"]),
    make("sage_ilmara", "Sage Ilmara", F, {"s": "skin_tan", "h": "hair_gray", "c": "yellow", "x": "yellow",
         "g": "yellow", "t": "navy", "u": "purple", "f": "navy", "b": "navy", "l": "navy", "n": "purple:2"}, "long",
         hat="circlet", features=["closed"], extras=["robe"]),
    make("cinder_valko", "Cinder Valko", M, {"s": "skin_tan", "h": "red", "g": "yellow", "t": "charcoal",
         "u": "red", "f": "charcoal", "b": "charcoal", "n": "red:2"}, "mohawk", features=["brows"],
         extras=["pauldrons"]),
    make("hollis_rime", "Hollis Rime", M, {"s": "skin_light", "h": "hair_teal", "t": "white", "u": "sky",
         "f": "white", "b": "white", "l": "white", "n": "sky:2", "p": "sky"}, "swept", features=["closed"],
         extras=["longcoat", "fur"]),
    make("bastian_cairn", "Bastian Cairn", M, {"s": "skin_tan", "h": "brown:2", "c": "yellow:2", "x": "orange:2",
         "g": "white:2", "t": "khaki:2", "u": "khaki:2", "f": "skin_tan", "a": "khaki:2", "b": "brown:2", "n": "brown:2",
         "p": "orange:2"}, "short", hat="hardhat", features=["beard"], extras=["vest"]),
    make("morwen_hallow", "Morwen Hallow", F, {"s": "skin_light", "h": "hair_black", "c": "purple", "g": "hair_pink",
         "t": "purple", "u": "charcoal", "f": "purple", "b": "purple", "l": "purple", "n": "charcoal"}, "bob",
         hat="cowl", features=["closed"], extras=["robe"]),
    make("drake_zephyrin", "Drake Zephyrin", M, {"s": "skin_tan", "h": "hair_dark", "c": "red", "x": "yellow",
         "t": "red", "u": "yellow", "f": "red", "b": "charcoal", "l": "charcoal", "n": "charcoal"}, "slick",
         hat="horns", features=["brows"], extras=["longcoat"]),
    make("kestrel_vane", "Kestrel Vane", F, {"s": "skin_light", "h": "hair_blond", "x": "red", "g": "yellow",
         "t": "white", "u": "navy", "f": "white", "b": "navy", "l": "navy", "n": "red:2"}, "crest", hat="feather",
         features=["grin"], extras=["longcoat", "trim"]),
    # ------------------------------------------------- road trainers, routes 2-8
    make("swimmer", "Swimmer", M, {"s": "skin_tan", "h": "hair_dark", "c": "sky:2", "x": "sky:2", "t": "skin_tan",
         "f": "skin_tan", "b": "navy", "l": "skin_tan", "n": "skin_tan"}, "spiky", hat="headband", features=["grin"]),
    make("swimmer_f", "Swimmer", F, {"s": "skin_tan", "h": "hair_red", "x": "white:2", "t": "sky", "u": "white:2", "f": "skin_tan",
         "b": "sky", "l": "skin_tan", "n": "skin_tan"}, "ponytail", features=["grin"]),
    make("engineer", "Engineer", M, {"s": "skin_tan", "h": "brown:2", "c": "yellow:2", "x": "yellow:2", "t": "orange",
         "f": "orange", "b": "denim", "n": "brown:2", "p": "brown:2"}, "short", hat="hardhat", features=["moustache"],
         extras=["belt"]),
    make("rocker", "Rocker", M, {"s": "skin_light", "h": "hair_red", "t": "charcoal", "u": "hair_red", "f": "skin_light",
         "b": "charcoal", "n": "charcoal", "p": "hair_red", "g": "charcoal"}, "mohawk", features=["shades"], extras=["vest"]),
    make("juggler", "Juggler", M, {"s": "skin_light", "h": "hair_dark", "c": "purple", "x": "yellow:2", "t": "purple",
         "u": "yellow:2", "f": "yellow:2", "b": "purple", "n": "charcoal"}, "short", hat="tophat", features=["grin"]),
    make("tamer", "Tamer", M, {"s": "skin_tan", "h": "hair_gray", "c": "brown", "x": "brown", "t": "red", "f": "skin_tan",
         "b": "brown:2", "n": "charcoal", "p": "brown"}, "short", hat="bucket", features=["beard"], extras=["belt"]),
    make("bird_keeper", "Bird Keeper", M, {"s": "skin_light", "h": "hair_blond", "x": "brown", "t": "teal", "u": "teal",
         "f": "teal", "b": "brown", "n": "brown", "p": "brown", "g": "white:2"}, "swept", features=["brows"], extras=["falcon"]),
    make("psychic", "Psychic", M, {"s": "skin_light", "h": "hair_purple", "t": "purple", "u": "pink:2", "f": "purple",
         "b": "charcoal", "n": "charcoal", "g": "pink:2"}, "swept", features=["closed"], extras=["longcoat", "trim"]),
    make("burglar", "Burglar", M, {"s": "skin_light", "h": "hair_black", "g": "charcoal", "c": "charcoal", "x": "charcoal", "t": "white",
         "u": "charcoal", "f": "white", "b": "charcoal", "n": "charcoal"}, "short", hat="beanie",
         features=["shades", "moustache"]),
    make("super_nerd", "Super Nerd", M, {"s": "skin_light", "h": "hair_brown", "g": "hair_brown", "t": "green", "u": "green", "f": "green",
         "b": "brown", "n": "brown"}, "messy", features=["glasses"]),
    make("channeler", "Channeler", F, {"s": "skin_light", "h": "hair_gray", "c": "purple", "x": "purple", "t": "white",
         "u": "purple", "f": "white", "b": "white", "l": "white", "n": "purple:2", "p": "purple"}, "long", hat="circlet",
         features=["closed"], extras=["shawl", "longskirt"]),
    # ------------------------------------------- generic townsperson ("npc")
    make("npc", "Townsperson", M, {"s": "skin_light", "h": "hair_brown", "t": "green", "u": "white:2",
         "b": "denim", "n": "hair_brown:2"}, "short"),
]

ROSTER = [PLAYER_BOY, PLAYER_GIRL, YOUNGSTER] + CAST

# Body builds on top of the adult templates (sheets._build).
BUILDS = {
    "child": ("youngster", "bug_catcher", "twin", "lass", "picnicker"),
    "heavy": ("hiker", "biker", "black_belt", "fisherman", "sailor", "mara_quill", "cinder_valko", "bastian_cairn", "engineer", "tamer", "rocker"),
    "elder": ("old_man", "old_woman"),
    "teen": ("player", "player_f", "rival"),  # FRLG-height heroes: ~23 rows, head ~10
}
for _build_name, _ids in BUILDS.items():
    for _c in ROSTER:
        if _c["id"] in _ids:
            _c["build"] = _build_name
