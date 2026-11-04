"""World palette for the art overhaul. Rules: docs/design/ART_BIBLE.md.

Ground ramps are pale and quiet so objects carry the contrast. Ramps run
highlight -> shadow, leaning warm at the top and cool at the bottom.
"""
LINE = "#26223a"  # object outline, a cool plum, never pure black
SHADOW = ("#2e4a4a", 0.35)  # contact shadow: colour, opacity

WORLD = {
    "meadow": ["#c0e29e", "#aed68e", "#9cc97f"],
    "lawn": ["#93c476", "#82b868", "#72a85c"],
    "trail": ["#ecd9a8", "#e0c890", "#cbb07c", "#b6966c"],
    "leaf": ["#b4d878", "#7cb85c", "#4e9450", "#35704c", "#265244"],
    "bark": ["#b08858", "#84603f", "#5c4038", "#40303a"],
    "roof_clay": ["#f0a878", "#d97c54", "#b85a46", "#8c4044", "#6c3044"],
    "roof_slate": ["#a8bcd0", "#7c94b0", "#5e7694", "#465a78", "#344460"],
    "roof_moss": ["#b8d88c", "#86b468", "#64945a", "#4a7450", "#365a48"],
    "roof_rose": ["#f8b0a8", "#e8786c", "#c8505a", "#9c3c50", "#782e48"],
    "roof_sky": ["#a8d4f4", "#6ca8e4", "#4c84c8", "#3a64a4", "#2e4c84"],
    "wall": ["#fbf2dc", "#ecdfc4", "#d2c2aa", "#ab9c94"],
    "glass": ["#dff0f4", "#a8d4e4", "#6ca4cc", "#4a78a8"],
    "stone": ["#d4d2d4", "#aeacb8", "#88869c", "#64627e"],
    "cap": ["#f09078", "#d85a48", "#a83c38"],
    "soil": ["#9a7652", "#7e5c42", "#604634"],
    "reed": ["#8ab060", "#5e8a50", "#a8703c"],
    "lily": ["#7ec088", "#4e9a70", "#f4b4c4"],
    "ledge": ["#c8a878", "#9c7a58", "#6e5444"],
    "wood": ["#d09a60", "#a87044", "#7e5038", "#5a3a38"],
    "water": ["#e4f6f6", "#a4dcea", "#74bce2", "#4e92c8"],
    "bank": ["#c4a97c", "#957a5c"],
    "tall": ["#c8ec98", "#86c86c", "#58a860", "#3e8458"],
    "fence": ["#f4ecdc", "#d8ccb8", "#aea298", "#807a84"],
}
