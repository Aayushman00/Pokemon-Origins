"""Character roster: heads per direction, body type, material -> ramp map.

A head layer covers y=9..~25 (long hair and ponytails drape over the
body). `alert_face` optionally replaces the down-facing head for the
"spotted you" frame (open mouth etc.). Eyes are 2px tall `e` so the
blink frame can close them automatically.
"""
from .compose import grid

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
        "t": "red", "u": "charcoal", "a": "charcoal", "f": "skin_light",
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
            ..sssssssshhhh..
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
            ..ssssssshhh..hh
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
        "b": "khaki:2", "l": "skin_tan", "n": "brown:2", "m": "#55361f",
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
            .sssssssshhhh...
            ..smwsssshhh....
            ...ssssss.......
        """),
    },
}

ROSTER = [PLAYER_BOY, PLAYER_GIRL, YOUNGSTER]
