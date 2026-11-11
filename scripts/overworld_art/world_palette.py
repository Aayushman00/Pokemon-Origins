"""World palette for the art overhaul. Rules: docs/design/ART_BIBLE.md.

Ground ramps are pale and quiet so objects carry the contrast. Ramps run
highlight -> shadow, leaning warm at the top and cool at the bottom.
"""
import colorsys
LINE = "#26223a"  # object outline, a cool plum, never pure black
SHADOW = ("#2e4a4a", 0.35)  # contact shadow: colour, opacity

WORLD = {
    "meadow": ["#c0e29e", "#aed68e", "#9cc97f"],
    "lawn": ["#a2cf84", "#92c476", "#82b66a"],  # one step under meadow: a patch, not a box
    "trail": ["#ecd9a8", "#e0c890", "#cbb07c", "#b6966c"],
    "leaf": ["#b4d878", "#7cb85c", "#4e9450", "#35704c", "#265244"],
    "bark": ["#b08858", "#84603f", "#5c4038", "#40303a"],
    "roof_clay": ["#f0a878", "#d97c54", "#b85a46", "#8c4044", "#6c3044"],
    "roof_slate": ["#a8bcd0", "#7c94b0", "#5e7694", "#465a78", "#344460"],
    "roof_moss": ["#b8d88c", "#86b468", "#64945a", "#4a7450", "#365a48"],
    "roof_rose": ["#f8b0a8", "#e8786c", "#c8505a", "#9c3c50", "#782e48"],
    "roof_sky": ["#a8d4f4", "#6ca8e4", "#4c84c8", "#3a64a4", "#2e4c84"],
    "wall": ["#fbf2dc", "#ecdfc4", "#d2c2aa", "#ab9c94"],  # Centers, Marts, the Lab: cream everywhere
    "sage_wall": ["#e4ecd2", "#c8d6b0", "#a2b48c", "#7a8c6a"],  # Dawnbrook homes: painted boards
    "log_wall": ["#c09468", "#9e7450", "#7a573c", "#583e2e"],  # Mossgate homes: log courses
    "glass": ["#dff0f4", "#a8d4e4", "#6ca4cc", "#4a78a8"],
    "stone": ["#d4d2d4", "#aeacb8", "#88869c", "#64627e"],
    "leaf_sun": ["#c4e080", "#9cc860", "#6ea858", "#4a8850", "#265244"],
    "leaf_deep": ["#7cb85c", "#5ea060", "#3f8458", "#2c6450", "#265244"],
    "leaf_amber": ["#f0d080", "#d8b860", "#b88c48", "#8a6a44", "#265244"],
    "cap": ["#f09078", "#d85a48", "#a83c38"],
    "soil": ["#9a7652", "#7e5c42", "#604634"],
    "reed": ["#8ab060", "#5e8a50", "#a8703c"],
    "lily": ["#7ec088", "#4e9a70", "#f4b4c4"],
    "ledge": ["#b89a78", "#8c7260", "#5e4c48"],
    "wood": ["#d09a60", "#a87044", "#7e5038", "#5a3a38"],
    "water": ["#e4f6f6", "#a4dcea", "#74bce2", "#4e92c8"],
    "bank": ["#c4a97c", "#957a5c"],
    "tall": ["#c8ec98", "#86c86c", "#58a860", "#3e8458"],
    "fence": ["#f4ecdc", "#d8ccb8", "#aea298", "#807a84"],
}

# Tall grass per biome: tip, lit blade, shaded blade, the dark between tufts.
TALL = {
    "meadow": WORLD["tall"],
    "hills": ["#e8e098", "#b0b860", "#809850", "#5c7444"],
    "sand": ["#e0eca4", "#a4c474", "#6ca064", "#4c7c5c"],
    "concrete": ["#bce094", "#80b474", "#548e64", "#3c6c5c"],
    "cliff": ["#d4f0c4", "#98d0a0", "#68ac8c", "#4a8a7c"],
    "slate": ["#a8dcc4", "#6cb4a4", "#488c90", "#345c74"],
    "basalt": ["#e4b474", "#b8804c", "#885a40", "#5a3c38"],
    "marble": ["#ecf0d4", "#b4d4b4", "#84b09c", "#5e8c84"],
}


def outline_for(ramp):
    """Hue-matched outline: the ramp's darkest step, 15% of the way round to
    blue and down in value. Dark like LINE but tied to the material."""
    r, g, b = (int(ramp[-1][i:i + 2], 16) / 255 for i in (1, 3, 5))
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    h += ((2 / 3 - h + .5) % 1 - .5) * .15
    rgb = colorsys.hsv_to_rgb(h % 1, min(1, s * 1.15), v * .72)
    return "#%02x%02x%02x" % tuple(round(c * 255) for c in rgb)


def sel_out(ramp):
    """Edge tone on the lit (top/left) side: the ramp's second-darkest step,
    so the rim softens toward the light instead of a hard dark line."""
    return ramp[-2]


# colour -> the ramp it belongs to, so an outline pass can tell materials apart
RAMP_OF = {}
for _ramp in WORLD.values():
    for _c in _ramp:
        RAMP_OF.setdefault(_c, _ramp)
