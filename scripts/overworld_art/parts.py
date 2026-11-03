"""Reusable head and body parts: faces, features, hair styles, hats, extras.

Every part is {direction: layer} for down / up / left (right is mirrored
from left at sheet time). Front and back parts are symmetric, so they are
written as their left 8 columns and mirrored with `sym` - half the typing
and guaranteed symmetry.

Head geometry (shared with the hand-drawn player heads): skull y=10..21,
eyes are 2px tall at x=5 and x=10 on y=17-18 (side view: x=4), mouth on
y=20, chin y=21. Hats sit on y<=15, long hair may drape to y=25.
"""
from .compose import grid

W = 16


def sym(top, text):
    rows = [r.strip() for r in text.strip("\n").splitlines() if r.strip()]
    for r in rows:
        if len(r) != W // 2:
            raise ValueError(f"half-row {r!r} is {len(r)} wide, expected 8")
    return (top, [r + r[::-1] for r in rows])


def row(top, *rows):
    """A layer from full-width rows given inline (for 1-3 row features)."""
    return grid(top, "\n".join(rows))


# ------------------------------------------------------------------ faces
FACE = {
    "down": sym(10, """
        .....sss
        ...sssss
        ..ssssss
        ..ssssss
        ..ssssss
        .sssssss
        .sssssss
        .ssssess
        .ssssess
        ..ssssss
        ...sssss
        .....sss
    """),
    "up": sym(10, """
        .....sss
        ...sssss
        ..ssssss
        ..ssssss
        ..ssssss
        .sssssss
        .sssssss
        .sssssss
        .sssssss
        ..ssssss
        ...sssss
        ......ss
    """),
    "left": grid(10, """
        ......ssssss....
        ....ssssssssss..
        ...sssssssssss..
        ...ssssssssssss.
        ...ssssssssssss.
        ...ssssssssssss.
        ...ssssssssssss.
        ...sesssssSssss.
        ...sesssssSssss.
        ..sssssssssssss.
        ...ssssssssss...
        ....ssssss......
    """),
}

# --------------------------------------------------------------- features
FEATURES = {
    "mouth": {"down": row(20, ".......MM......."), "left": row(20, "....M...........")},
    "open": {"down": row(20, ".......MM.......", "........M......."), "left": row(20, "...MM...........")},
    "grin": {"down": row(20, "......MwwM......"), "left": row(20, "...Mw...........")},
    "lash": {"down": row(17, "....e......e...."), "left": row(17, "...e............")},
    "brows": {"down": row(16, "....hh....hh...."), "left": row(16, "...hh...........")},
    "closed": {
        "down": row(17, ".....s....s.....", "....ee....ee...."),
        "left": row(17, "....s...........", "...ee..........."),
    },
    "glasses": {
        "down": row(17, "...gweggggesg...", "...gseg..gesg...", "....gg....gg...."),
        "left": row(17, "..gweggggg......", "..gseg..........", "...gg..........."),
    },
    "shades": {
        "down": row(17, "...gggggggggg...", "...gwgg..gwgg...", "....gg....gg...."),
        "left": row(17, "..gggggggg......", "..gwgg..........", "...gg..........."),
    },
    "moustache": {"down": row(20, ".....hhhhhh....."), "left": row(20, "..hhhh..........")},
    "beard": {
        "down": sym(19, """
            ..hhssss
            ...hhhhM
            ....hhhh
            .....hhh
            ......hh
        """),
        "left": grid(19, """
            ...hhhhhs.......
            ...Mhhhhhh......
            ...hhhhhhh......
            ....hhhhh.......
            .....hh.........
        """),
    },
    "clip": {"down": row(14, "...........xx...", "...........xw...", "............x..."),
             "up": row(14, "...xx...........", "...xx..........."),
             "left": row(14, "........xx......", "........xw......")},
}

# ------------------------------------------------------------------- hair
HAIR = {}

HAIR["short"] = {
    "down": sym(10, """
        .....hhh
        ...hhhhh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhh..hh
        .h......
        .h......
    """),
    "up": sym(10, """
        .....hhh
        ...hhhhh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hHhhhhh
        .hHhhhhh
        ..hhhhhh
        ...hhHhh
    """),
    "left": grid(10, """
        ......hhhhhh....
        ....hhhhhhhhhh..
        ...hhhhhhhhhhh..
        ..hhhhhhhhhhhhh.
        ..hhhhhhhhhhhhh.
        ..hhhhhhhhhhhhh.
        ...h.hhhhhhhhhh.
        ...........hhhh.
        ...........hHhh.
        ...........hhh..
    """),
}

HAIR["slick"] = {**HAIR["short"], "down": sym(10, """
        .....hhh
        ...hhhhh
        ..hhhhhh
        .hhhhhhh
        .hhhHhhh
        .hhhhhhh
        .hh.....
        .h......
        .h......
    """)}

HAIR["messy"] = {
    "down": sym(9, """
        ....h.h.
        ...hhhhh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhh.hh.
        .h......
        .h......
    """),
    "up": sym(9, """
        ....h.h.
        ...hhhhh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hHhhhhh
        .hhhhhhh
        ..hhhhhh
        ...hhhhh
    """),
    "left": grid(9, """
        ......h.h.h.....
        .....hhhhhhhh...
        ....hhhhhhhhhh..
        ...hhhhhhhhhhhh.
        ..hhhhhhhhhhhhh.
        ..hhhhhhhhhhhhh.
        ..hhhhhhhhhhhhh.
        ...hh.hhhhhhhhh.
        ...........hhhh.
        ...........hHhh.
        ...........hhh..
    """),
}

HAIR["spiky"] = {
    "down": sym(8, """
        ....h..h
        ...hh.hh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhshhsh
        .h......
        .h......
    """),
    "up": sym(8, """
        ....h..h
        ...hh.hh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhHhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhHhhh
        .hhhhhhh
        .hhhhhhh
        ..hhhhhh
        ...hh.hh
    """),
    "left": grid(8, """
        ........h.h.....
        .......hhhhh.h..
        .....hhhhhhhhhh.
        ...hhhhhhhhhhhh.
        ..hhhhhhhhhhhhh.
        .hhhhhhhhhhhhhh.
        ..hhhhhhhhhhhhh.
        .hhhhhhhhhhhhhh.
        ...hh.hhhhhhhhh.
        ...........hhhh.
        ...........hhhhh
        ............hh..
    """),
}

# cool trainer: long fringe swept across one eye, flicked up at the back
HAIR["swept"] = {
    "down": grid(8, """
        .........hhh....
        ......hhhhhhh...
        ....hhhhhhhhhh..
        ...hhhhhhhhhhhh.
        ..hhhhhhhhhhhhh.
        .hhhhhhhhhhhhhh.
        .hhhhhhhhhhhhhh.
        .hhhhhhhhhhhhhh.
        .hh.hhhhhhhhhhh.
        .h......hhhhhhh.
        .h..........hhh.
        .............hh.
    """),
    "up": sym(8, """
        ........
        ......hh
        ....hhhh
        ...hhhhh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhHhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        ..hhhhhh
        ..hh.hhh
    """),
    "left": grid(8, """
        ................
        ......hhhhhh....
        ....hhhhhhhhhhh.
        ...hhhhhhhhhhhhh
        ..hhhhhhhhhhhhh.
        .hhhhhhhhhhhhhh.
        hhhhhhhhhhhhhhh.
        .hhhhhhhhhhhhhh.
        .hhhh.hhhhhhhhh.
        ..h........hhhh.
        ...........hhhhh
        ............hh..
    """),
}

HAIR["bald"] = {
    "down": sym(15, """
        .hh.....
        .hh.....
        .h......
    """),
    "up": sym(15, """
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        ..hhhhhh
    """),
    "left": grid(14, """
        ..........hhhh..
        .........hhhhhh.
        ...........hhhh.
        ...........hhhh.
        ...........hhh..
    """),
}

HAIR["pompadour"] = {
    "down": sym(7, """
        ....hhhh
        ...hhhhh
        ..hhhhhh
        ..hhhHhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hh.....
        .hh.....
        .h......
    """),
    "up": sym(7, """
        ....hhhh
        ...hhhhh
        ..hhhhhh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        ..hhhhhh
        ...hhhhh
    """),
    "left": grid(6, """
        ...hhhhhh.......
        .hhhhhhhhhh.....
        .hhhhhHhhhhhh...
        ..hhhhhhhhhhhh..
        ....hhhhhhhhhh..
        ....hhhhhhhhhhh.
        ......hhhhhhhhh.
        ........hhhhhhh.
        .........hhhhhh.
        ..........hhhhh.
        ..........hhhhh.
        ...........hhhh.
        ...........hhh..
    """),
}

HAIR["long"] = {
    "down": sym(9, """
        .....hhh
        ...hhhhh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhh.
        .hhh....
        .hhh....
        .hhh....
        .hhh....
        .hHh....
        .hHh....
        .hhh....
        .hhh....
        .hh.....
    """),
    "up": sym(9, """
        .....hhh
        ...hhhhh
        ..hjjhhh
        .hjjhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhHhhh
        .hhhHhhh
        .hhHhhhh
        .hhHhhhh
        .hhHhhHh
        .hhHhhHh
        .hhhhhHh
        .hhhhhhh
        ..hhhhhh
        ...hhHhh
    """),
    "left": grid(9, """
        .......hhhh.....
        .....hhhhhhhh...
        ....hhhhhhhhhh..
        ...hhhhhhhhhhhh.
        ...hhhhhhhhhhhh.
        ..hhhhhhhhhhhhh.
        ..hhhhhhhhhhhhh.
        ...hhh.hhhhhhhh.
        ........hhhhhhh.
        ........hhhhhhh.
        .........hhhhhh.
        .........hhHhhh.
        .........hhhhhh.
        ........hhhhhhh.
        ........hhhhHh..
        .........hhhh...
        ..........hh....
    """),
}

HAIR["bob"] = {
    "down": sym(9, """
        .....hhh
        ...hhhhh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhh..
        .hhh....
        .hhh....
        .hhh....
        .hhh....
        ..hh....
    """),
    "up": sym(9, """
        .....hhh
        ...hhhhh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hHhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        ..hhhhhh
    """),
    "left": grid(9, """
        .......hhhh.....
        .....hhhhhhhh...
        ....hhhhhhhhhh..
        ...hhhhhhhhhhhh.
        ...hhhhhhhhhhhh.
        ..hhhhhhhhhhhhh.
        ..hhhhhhhhhhhhh.
        ..hhhhhhhhhhhhh.
        .......hhhhhhhh.
        .......hhhHhhhh.
        ........hhhhhhh.
        ........hhhhhh..
        .........hhhh...
    """),
}

# picnicker: bob with two round buns on top
HAIR["buns"] = {
    "down": [sym(6, """
        ..hhh...
        .hhhhh..
        .hhhhh..
        ..hhh...
    """), HAIR["bob"]["down"]],
    "up": [sym(6, """
        ..hhh...
        .hhhhh..
        .hhhhh..
        ..hhh...
    """), HAIR["bob"]["up"]],
    "left": [grid(6, """
        .........hhh....
        ........hhhhh...
        ........hhhhh...
        .........hhh....
    """), HAIR["bob"]["left"]],
}

# old woman: neat hair pulled into a bun on top
HAIR["bun"] = {
    "down": [sym(7, """
        ......hh
        .....hhh
        ......hh
    """), sym(10, """
        .....hhh
        ...hhhhh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhh...
        .hh.....
        .hh.....
        .h......
    """)],
    "up": [sym(7, """
        ......hh
        .....hhh
        ......hh
    """), HAIR["short"]["up"]],
    "left": [grid(7, """
        ..........hhh...
        .........hhhhh..
        ..........hhh...
    """), HAIR["short"]["left"]],
}

# battle girl: hair tied up into a high ponytail
HAIR["ponytail"] = {
    "down": sym(9, """
        .....hhh
        ...hhhhh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhh.h.
        .hh.....
        .hh.....
        .h......
    """),
    "up": [sym(9, """
        .....hhh
        ...hhhhh
        ..hhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hhhhhhh
        .hHhhhhh
        ..hhhhhh
        ...hhhhh
    """), grid(11, """
        ......xxxx......
        ......khhk......
        .....khhhhk.....
        .....khhhhk.....
        .....khhhhk.....
        .....khhhhk.....
        .....khHhhk.....
        ......khhk......
        ......khhk......
        ......khhk......
        .......hh.......
        .......hh.......
    """)],
    "left": [HAIR["short"]["left"], grid(10, """
        ...........xx...
        ...........hhh..
        ...........hhhh.
        ............hhh.
        ............hhh.
        ............hhh.
        ............hHh.
        ............hhh.
        .............hh.
        .............hh.
        .............h..
    """)],
}

# twin: twin-tails tied low either side
HAIR["twintails"] = {
    "down": [HAIR["bob"]["down"], sym(16, """
        .x......
        .hh.....
        hhh.....
        hhh.....
        hhh.....
        hHh.....
        .hh.....
        .h......
    """)],
    "up": [HAIR["bob"]["up"], sym(16, """
        .x......
        .hh.....
        hhh.....
        hhh.....
        hhh.....
        hHh.....
        .hh.....
        .h......
    """)],
    "left": [HAIR["bob"]["left"], grid(17, """
        ...........xx...
        ...........hhh..
        ...........hhh..
        ...........hhh..
        ...........hHh..
        ...........hhh..
        ............h...
    """)],
}

# ------------------------------------------------------------------- hats
HATS = {}

HATS["cap"] = {
    "down": sym(10, """
        .....ccc
        ...ccccc
        ..cccxxx
        ..cccxxx
        ..cccccc
        ..CCCCCC
    """),
    "up": sym(10, """
        .....ccc
        ...ccccc
        ..cccccc
        ..cccccc
        ..cccc..
        ...ccccc
    """),
    "left": grid(10, """
        ......cccccc....
        ....cccccccccc..
        ...cxxxccccccc..
        ...cxxxccccccc..
        ...ccccccccccc..
        .CCCCCC.........
    """),
}

HATS["sailor"] = {
    "down": sym(9, """
        ....cccc
        ...ccccc
        ..cccccc
        ..xxxxxx
        ..CCCCCC
    """),
    "up": sym(9, """
        ....cccc
        ...ccccc
        ..cccccc
        ..xxxxxx
        ..CCCCCC
    """),
    "left": grid(9, """
        .....cccccccc...
        ....cccccccccc..
        ...cccccccccccc.
        ...xxxxxxxxxxxx.
        ...CCCCCCCCCCCC.
    """),
}

HATS["straw"] = {
    "down": sym(8, """
        ......cc
        ....cccc
        ...ccccc
        ...xxxxx
        .ccccccc
        ..CCCCCC
    """),
    "up": sym(8, """
        ......cc
        ....cccc
        ...ccccc
        ...xxxxx
        .ccccccc
        .CCCCCCC
    """),
    "left": grid(8, """
        .......cccc.....
        .....cccccccc...
        ....cccccccccc..
        ....xxxxxxxxxx..
        .cccccccccccccc.
        ..CCCCCCCCCCCC..
    """),
}

HATS["bucket"] = {
    "down": sym(9, """
        .....ccc
        ...ccccc
        ..cccccc
        ..xxxxxx
        .ccccccc
        .CCCCCCC
    """),
    "up": sym(9, """
        .....ccc
        ...ccccc
        ..cccccc
        ..xxxxxx
        .ccccccc
        .CCCCCCC
    """),
    "left": grid(9, """
        .......ccccc....
        .....cccccccc...
        ....cccccccccc..
        ....xxxxxxxxxx..
        ..ccccccccccccc.
        .CCCCCCCCCCCCCC.
    """),
}

HATS["tophat"] = {
    "down": sym(4, """
        ....cccc
        ....cccc
        ....cccc
        ....cccc
        ....cccc
        ....cccc
        ....xxxx
        .ccccccc
        ..CCCCCC
    """),
    "up": sym(4, """
        ....cccc
        ....cccc
        ....cccc
        ....cccc
        ....cccc
        ....cccc
        ....xxxx
        .ccccccc
        ..CCCCCC
    """),
    "left": grid(4, """
        .....cccccccc...
        .....cccccccc...
        .....cccccccc...
        .....cccccccc...
        .....cccccccc...
        .....cccccccc...
        .....xxxxxxxx...
        ..cccccccccccc..
        ...CCCCCCCCCC...
    """),
}

HATS["nurse"] = {
    "down": sym(9, """
        .....ccc
        ....cccx
        ...ccccc
    """),
    "up": sym(9, """
        .....ccc
        ....cccc
        ...ccccc
    """),
    "left": grid(9, """
        ......cccccc....
        .....cccxcccc...
        ....cccccccccc..
    """),
}

HATS["bandana"] = {
    "down": sym(10, """
        .....ccc
        ...ccccc
        ..ccxccc
        .ccccccc
        .CCCCCCC
    """),
    "up": [sym(10, """
        .....ccc
        ...ccccc
        ..ccxccc
        .ccccccc
        .CCCCCCC
    """), sym(15, """
        ......cc
        ......c.
        .....cc.
    """)],
    "left": grid(10, """
        ......cccccc....
        ....ccxccccccc..
        ...ccccccxccccc.
        ..ccccccccccccc.
        ..CCCCCCCCCCCCCc
        .............cc.
        ..............c.
    """),
}

HATS["headband"] = {
    "down": sym(13, """
        .ccccccc
        .CCCCCCC
    """),
    "up": [sym(13, """
        .ccccccc
        .CCCCCCC
    """), sym(15, """
        ......c.
        .....cc.
        .....c..
    """)],
    "left": grid(13, """
        ..ccccccccccccc.
        ..CCCCCCCCCCCCcc
        ..............cc
        .............cc.
    """),
}

HATS["beanie"] = {
    "down": sym(8, """
        ......cc
        ....cccc
        ...ccccc
        ..cccccc
        ..cccccc
        .xxxxxxx
        .XXXXXXX
    """),
    "up": sym(8, """
        ......cc
        ....cccc
        ...ccccc
        ..cccccc
        ..cccccc
        .xxxxxxx
        .XXXXXXX
    """),
    "left": grid(8, """
        ........cc......
        ......cccccc....
        ....cccccccccc..
        ...ccccccccccc..
        ...cccccccccccc.
        ..xxxxxxxxxxxxx.
        ..XXXXXXXXXXXXX.
    """),
}

HATS["bow"] = {
    "down": grid(8, """
        .........xx.xx..
        .........xxxxx..
        .........xx.xx..
    """),
    "up": grid(8, """
        ..xx.xx.........
        ..xxxxx.........
        ..xx.xx.........
    """),
    "left": grid(7, """
        ........xx.xx...
        ........xxxxx...
        ........xx.xx...
    """),
}

# ----------------------------------------------------------------- extras
# (order, {direction: layer}[, {direction: order}]): "under" extras sit
# between body and head, "over" extras go on top of the head.
EXTRAS = {}

EXTRAS["coat"] = ("over", {
    "down": sym(26, """
        ...tt...
        ...tt...
        ...tT...
    """),
    "up": sym(26, """
        ....tttt
        ....tttt
        ....tTtt
    """),
    "left": grid(26, """
        ....tttttttt....
        ....ttttttttt...
        .....tttttTtt...
    """),
})

EXTRAS["pack"] = ("under", {
    "down": sym(22, """
        .....p..
        .....p..
        .....p..
    """),
    "up": sym(17, """
        ....pppp
        ...ppppp
        ...pPppp
        ...ppppp
        ...ppxxx
        ...ppxxx
        ...ppppp
        ...ppppp
        ...pPppp
        ...ppppp
        ....pppp
    """),
    "left": grid(17, """
        ..........ppp...
        .........ppppp..
        .........pppppp.
        .........pPpppp.
        .........pppppp.
        .........pxxppp.
        .........pppppp.
        .........pPpppp.
        .........pppppp.
        ..........pppp..
    """),
}, {"down": "over", "up": "over"})

EXTRAS["cane"] = ("over", {
    "down": grid(26, """
        ............pp..
        .............p..
        .............p..
        .............p..
        .............p..
    """),
    "left": grid(25, """
        ..pp............
        ..p.............
        ..p.............
        ..p.............
        ..p.............
        ..p.............
    """),
})

EXTRAS["shawl"] = ("over", {
    "down": sym(22, """
        ..pppppp
        ..pppppp
        ...ppppp
        .....ppp
    """),
    "up": sym(22, """
        ..pppppp
        ..pppppp
        ...ppppp
        ....pppp
    """),
    "left": grid(22, """
        ....pppppppp....
        ....pppppppp....
        .....pppppp.....
    """),
})

EXTRAS["apron"] = ("over", {
    "down": sym(24, """
        .....ppp
        .....ppp
        .....ppp
        .....ppp
        ......pp
    """),
    "up": row(25, "......pppp......", ".......pp......."),
    "left": grid(24, """
        ....pp..........
        ....pp..........
        ...ppp..........
        ...ppp..........
    """),
})

EXTRAS["longskirt"] = ("over", {
    "down": row(29, "...bbbbbbbbbb..."),
    "up": row(29, "...bbbbbbbbbb..."),
    "left": row(29, "...bbbbbbbbb...."),
})

EXTRAS["shorts_f"] = ("over", {
    "down": row(27, "..._bbb__bbb_...", "...__ll__ll__..."),
    "up": row(27, "..._bbb__bbb_...", "...__ll__ll__..."),
    "left": row(27, "..._bbbbbbb_....", "...___ll____...."),
})

EXTRAS["emblem"] = ("over", {
    "down": row(23, ".......gg.......", ".......gg......."),
    "left": row(23, "....g...........", "....g..........."),
})

EXTRAS["belt"] = ("over", {
    "down": row(26, "....pppppppp....", ".....p....p....."),
    "up": row(26, "....pppppppp...."),
    "left": row(26, "....pppppppp....", "...pp..........."),
})
