"""Master palette for overworld characters.

Every colour a sprite may use lives here as a named ramp ordered
highlight -> base -> shadow. Characters pick ramps per material; the
compositor picks the tone from the pixel's position (top-left light).
Keeping all ramps in one file keeps the cast looking like one game.
"""

OUTLINE = "#262030"  # warm near-black, softer than pure black
WHITE = "#f8f8f0"

RAMPS = {
    # skin
    "skin_light": ["#fde3c6", "#f4bd92", "#cf8a62"],
    "skin_tan": ["#f2c79c", "#d89a6b", "#a5683f"],
    "skin_deep": ["#c98a5c", "#9a6038", "#6c3e24"],
    # hair
    "hair_black": ["#5c5468", "#3c3646"],
    "hair_dark": ["#6e4a3a", "#4a3028"],
    "hair_brown": ["#c6844e", "#975a32", "#64381f"],
    "hair_blond": ["#fbe39a", "#e3b65a", "#a87a34"],
    # cloth
    "red": ["#ff7f6b", "#e0423a", "#a02430"],
    "navy": ["#7090dc", "#4560b0", "#2b3c76"],
    "charcoal": ["#56536a", "#34323f"],
    "white": [WHITE, "#d6d8e4", "#9fa3b8"],
    "sky": ["#b2e0fa", "#6eb0ea", "#3d74bc"],
    "yellow": ["#ffe57a", "#f2b832", "#b37a16"],
    "green": ["#9ad874", "#52a448", "#2d6a36"],
    "khaki": ["#ecd4a2", "#c9a86e", "#8f7040"],
    "brown": ["#b88456", "#7e5434", "#55361f"],
}
