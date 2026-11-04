"""World palette for the art overhaul. Rules: docs/design/ART_BIBLE.md.

Ground ramps are pale and quiet so objects carry the contrast. Ramps run
highlight -> shadow, leaning warm at the top and cool at the bottom.
"""
LINE = "#26223a"  # object outline, a cool plum, never pure black
SHADOW = ("#2e4a4a", 0.35)  # contact shadow: colour, opacity

WORLD = {
    "meadow": ["#cfe3b4", "#bfd8a6", "#aecb98"],
    "lawn": ["#9cc084", "#8ab376", "#78a268"],
    "trail": ["#e6d8b4", "#d8c79e", "#c4b088", "#b09a76"],
    "leaf": ["#b4d878", "#7cb85c", "#4e9450", "#35704c", "#265244"],
    "bark": ["#b08858", "#84603f", "#5c4038", "#40303a"],
    "roof_clay": ["#f0a878", "#d97c54", "#b85a46", "#8c4044", "#6c3044"],
    "wall": ["#fbf2dc", "#ecdfc4", "#d2c2aa", "#ab9c94"],
    "glass": ["#dff0f4", "#a8d4e4", "#6ca4cc", "#4a78a8"],
    "stone": ["#d4d2d4", "#aeacb8", "#88869c", "#64627e"],
    "wood": ["#d09a60", "#a87044", "#7e5038", "#5a3a38"],
    "fence": ["#f4ecdc", "#d8ccb8", "#aea298", "#807a84"],
}
