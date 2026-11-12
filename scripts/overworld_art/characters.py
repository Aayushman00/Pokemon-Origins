"""Character roster: heads per direction, body type, material -> ramp map.

A head layer covers y=9..~25 (long hair and ponytails drape over the
body). `alert_face` optionally replaces the down-facing head for the
"spotted you" frame (open mouth etc.). Eyes are 2px tall `e` so the
blink frame can close them automatically.
"""
from .compose import grid
from .parts import EXTRAS, FACE, FEATURES, HAIR, HATS
from .leader_heads import HEADS as LEADER_HEADS

# ------------------------------------------------------------ player boy
# Original design: no cap. An asymmetric side-swept fringe and a gold scarf
# carry the silhouette from every side, over a teal jacket. Hair locks: the
# main ridge (the only highlight) sweeps down to one side, a fringe lock hangs
# over one brow, a shorter lock covers the far side, pointed locks at the nape;
# in profile: the front view's swept peak rising over the brow, a smooth
# vertical cheek with a 1px chin tuck onto the scarf (no nose), the eye 2px
# behind the face edge, and back hair curving 2px in to the nape. The right
# view is this one mirrored. Hand-shaded at final size (sheets "shade": "manual"):
# j/h/H hair, y/s/S skin, W glint over I iris, z/u/U scarf. Light is top-left.
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
            .....zuuuUU.....
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
            ....hH....hH....
            .....zuuuUU.....
        """),
        "left": grid(11, """
            ......j.........
            .....jjjhH......
            .....jjjjhhH....
            .....hjjhhhhH...
            .....hhHyshhH...
            .....hyysshhH...
            .....ssWssShH...
            .....ssIssShH...
            .....ssssSSH....
            ......ssSSHU....
            ......zzuuUU....
        """),
    },
}

# ----------------------------------------------------------- player girl
# Same family, own shape: a high ponytail tied in teal, bangs swept the other
# way, face-framing locks, coral jacket, denim skirt. Hand-shaded to the same
# rules as the boy (see PLAYER_BOY); front lashes are 1px outline flicks.
PLAYER_GIRL = {
    "id": "player_f",
    "label": "Player (girl)",
    "gender": "female",
    "body": "heroine",
    "shade": "manual",
    "mats": {
        "s": "skin_hero", "h": "hair_cocoa", "i": "iris_dusk", "t": "orange", "u": "teal_hero",
        "b": "denim:2", "l": "skin_hero", "n": "hair_cocoa",
    },
    "heads": {
        "down": grid(11, """
            .........hhH....
            .....hjjjhhH....
            ....hjjjjhhhH...
            ...hjjhhhhhhhH..
            ...hhhhhhhhHhH..
            ...hhyyyhhhhhH..
            ...hyyyyysshhH..
            ...hseWssWesSH..
            ...hssIssIsSHH..
            ...H.ysssSS.H...
            .....zuuuUU.....
        """),
        "up": grid(11, """
            .......jhh......
            .....hjjuuhH....
            ....hjjhjhhhH...
            ...hjjhHjhHhhH..
            ...hhhhHjhHhhH..
            ...hhhhHjhHhhH..
            ...hhHhHjhHhHH..
            ...hhhhHjhHhHH..
            ....hhhHjhHHH...
            ....hH.HjhH.H...
            .....zuHjhHU....
            ......HjhH......
            .......jH.......
            .......H........
        """),
        "left": grid(11, """
            ......jjh.......
            .....jjjhhHuuj..
            .....jjjjhhhHjh.
            .....hjjhhhhHjH.
            .....hhHyshhHhH.
            .....yyyshhhH.H.
            .....ssWssShH.H.
            .....ssIssShH...
            .....ssssSSH....
            ......ssSSH.....
            ......zuuUU.....
        """),
    },
}

# ----------------------------------------------------------------- rival
# The player's counterpart: red hair flaring up and back in three spikes, an
# open forehead under hard brows (hair-shadow pixels), popped grey collar,
# open charcoal jacket over a pale grey tee, charcoal trousers, dark red belt
# and boots. Wears the hero body (its scarf strip reads as the tee) and follows the
# hero face rules; his eyes share the hair's dark red.
RIVAL = {
    "id": "rival",
    "label": "Rival",
    "gender": "male",
    "body": "hero",
    "shade": "manual",
    "mats": {
        "s": "skin_light", "h": "hair_red", "i": "iris_ember", "t": "charcoal", "u": "gray",
        "l": "charcoal", "n": "hair_red",
    },
    "heads": {
        "down": grid(11, """
            .....h..jh......
            ....jH.jhH..h...
            ...jjhHjhhHhH...
            ..hjjhhhhhhHhH..
            ..hjhhhhhhhhHH..
            ..hhhhHhhhHhhH..
            ...hyHHssHHsSH..
            ...HsyWssWsS....
            ....ssIssIsS....
            .....ysssSS.....
            ....zuuuuUUU....
        """),
        "up": grid(11, """
            .....h..jh......
            ....jH.jhH..h...
            ...jjhHjhhHhH...
            ..hjjhhhhhhHhH..
            ..hjhhhhhhhhHH..
            ..hhhhHhhhhhHH..
            ..hhhhhHhhhHHH..
            ...hhhhHhhhHH...
            ...hhhhhHhhHH...
            ....hH.hH.hH....
            ....zuuuuUUU....
        """),
        "left": grid(11, """
            .......h..h.....
            ......jH.jhH....
            .....jjhjhhhHh..
            .....jhhhhhhhH..
            .....hyyshhhhH..
            .....yHHsshhHH..
            .....ssWssShH...
            .....ssIssShH...
            .....ssssSShH...
            ......ssSSH.....
            .....zuuuUUU....
        """),
    },
}

# ------------------------------------------------------------- professor
# Silver hair combed back off a high forehead, grey brows, khaki coat to the
# knee over a red tie, brown trousers; eyes share the trousers' dark brown.
# Hero face rules; the coat body is bodies.PROF_*.
PROFESSOR = {
    "id": "professor",
    "label": "Professor",
    "gender": "male",
    "body": "professor",
    "shade": "manual",
    "mats": {
        "s": "skin_light", "h": "hair_gray", "i": "iris_brown", "t": "khaki", "u": "red:2",
        "l": "brown", "n": "brown",
    },
    "heads": {
        "down": grid(11, """
            .....jjhhH......
            ....jjhhhhhH....
            ...jjHhhHhhhH...
            ...jhHhhHhhhHH..
            ...hhHhhHhhhHH..
            ...hyyyyyssshH..
            ...hyHHssHHsSH..
            ...HsyWssWsSH...
            ....ssIssIsS....
            .....ysssSS.....
            .....vtuUtT.....
        """),
        "up": grid(11, """
            .....jjhhH......
            ....jjhhhhhH....
            ...jjhhhhhhhH...
            ...jhhhhhhhhHH..
            ...hhhhhhhhhHH..
            ...hhhhhhhhhHH..
            ...hhhhhhhhHHH..
            ...HhhhhhhhHH...
            ....HhhhhhHH....
            .....sssSSS.....
            .....vttttT.....
        """),
        "left": grid(11, """
            ......jjhH......
            .....jjhhhhH....
            .....jHHHhhhH...
            .....yhhhHHHH...
            .....yyyshhhHH..
            .....yHHsshhHH..
            .....ssWssShH...
            .....ssIssShH...
            .....ssssSSH....
            ......ssSSH.....
            ......uvtTT.....
        """),
    },
}

# ------------------------------------------------------------------- mom
# Warm brown bob with a side part framing the face, lashes, a purple dress
# under a pale apron; eyes share the hair's darkest brown. Hero face rules;
# the apron-and-skirt body is bodies.MOM_*.
MOM = {
    "id": "mom",
    "label": "Mom",
    "gender": "female",
    "body": "mom",
    "shade": "manual",
    "mats": {
        "s": "skin_light", "h": "hair_brown", "i": "iris_umber", "t": "purple", "b": "purple",
        "p": "white:2", "n": "hair_brown",
    },
    "heads": {
        "down": grid(11, """
            ......jjhH......
            ....jjjhhhhH....
            ...jjjhhhhhhH...
            ..hjjhhhhhhhHH..
            ..hjhhhhHhhhhH..
            ..hhhyyyyhhhhH..
            ..hhyyyyysshhH..
            ..hhseWssWesSH..
            ..hhssIssIsSHH..
            ..hH.ysssSS.HH..
            .....vtttTT.....
        """),
        "up": grid(11, """
            ......jjhH......
            ....jjjhhhhH....
            ...jjjhhhhhhH...
            ..hjjhhhhhhhHH..
            ..hjhhhhhhhhhH..
            ..hhhhhhhhhhhH..
            ..hhhhhhhhhhHH..
            ..hhhhhhhhhHHH..
            ..hhhhhhhhHHHH..
            ..hHhHHhHHhHHH..
            .....vtttTT.....
        """),
        "left": grid(11, """
            ......jjhH......
            .....jjjhhhH....
            .....jjhhhhhH...
            .....hjhhhhhhH..
            .....hhyyhhhhH..
            .....yyyshhhhH..
            .....ssWssShhH..
            .....ssIssShhH..
            .....ssssSShHH..
            ......ssSShHH...
            ......vttTT.....
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
    RIVAL,
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
    PROFESSOR,
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
    MOM,
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
         "g": "yellow:1", "t": "navy", "u": "white:2", "f": "navy", "b": "navy", "l": "navy", "n": "charcoal"}, "long",
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
    make("kestrel_vane", "Kestrel Vane", F, {"s": "skin_light", "h": "hair_blond", "x": "red:2", "g": "hair_blond:2",
         "t": "white", "u": "navy:2", "f": "white", "b": "navy:2", "l": "navy:2", "n": "red:2"}, "crest", hat="feather",
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

# Gym Leaders and League: parts-built, polished toward the hand-shaded heroes
# (sheets.frame_keys): glint-over-iris eyes, the heroes' head trim, cleaner shading.
POLISHED = ("willow_thornby", "mara_quill", "tavish_rook", "coral_marlowe", "volt_dray", "skye_corvin",
            "sage_ilmara", "cinder_valko", "hollis_rime", "bastian_cairn", "morwen_hallow", "drake_zephyrin",
            "kestrel_vane")
for _c in ROSTER:
    if _c["id"] in POLISHED:
        _c["polish"] = True
        _c["mats"]["i"] = "iris_ink"
    if _c["id"] in LEADER_HEADS:  # hand-shaded head on the parts body (leader_heads.py)
        _h = LEADER_HEADS[_c["id"]]
        _c["shade"] = "manual"
        _c["heads"] = {d: _h[d] for d in DIRS}
        _c.pop("alert_heads", None)
        _c["mats"].update(_h["mats"], i=_h["iris"])

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
