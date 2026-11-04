"""Master palette for overworld characters.

Every colour a sprite may use lives here as a named ramp ordered
highlight -> base -> shadow. Ramps are hue-shifted the way GBA artists
did it, only cleaner: highlights lean warm (toward yellow), shadows lean
cool (toward blue/purple) instead of just getting darker. Characters pick
ramps per material; the compositor picks the tone from the pixel's
position (light from the top-left).

A ramp written "name:2" in a character keeps only base + shadow, which is
how a busy outfit stays inside the 15-colour (+ transparent) budget.
"""

OUTLINE = "#3a2426"  # dark brown, never pure black
WHITE = "#fffcf0"

RAMPS = {
    # ---- skin
    "skin_light": ["#ffe6c8", "#f6be92", "#c98572"],
    "skin_tan": ["#f8cf9c", "#d99a68", "#a0604e"],
    "skin_deep": ["#cf9264", "#975a3c", "#5f3438"],
    # ---- hair
    "hair_black": ["#5f5c7c", "#3a3550"],
    "hair_dark": ["#7c5244", "#4c2e36"],
    "hair_brown": ["#d6955a", "#9a5a32", "#5e3434"],
    "hair_blond": ["#fff2a2", "#eabc54", "#a87442"],
    "hair_red": ["#ffa060", "#da563c", "#8e2e44"],
    "hair_gray": ["#f2f0ea", "#bab6c4", "#7a7690"],
    "hair_purple": ["#c49cf0", "#8460b8", "#4c347c"],
    "hair_pink": ["#ffc8d6", "#f08cac", "#ae4e80"],
    "hair_teal": ["#9cf0e0", "#3eb4ac", "#22667c"],
    # ---- cloth
    "red": ["#ff8c6a", "#e2443c", "#9a2442"],
    "orange": ["#ffbc66", "#f07c2e", "#a6422e"],
    "yellow": ["#fff28c", "#f2b832", "#b06e2a"],
    "olive": ["#d4d47a", "#929442", "#535a36"],
    "green": ["#b6e472", "#58a84a", "#2a6650"],
    "teal": ["#8cecd8", "#34aea6", "#1c6478"],
    "sky": ["#c2ecff", "#6eb0ea", "#3c62b0"],
    "navy": ["#7aa2ea", "#4560b0", "#2a2e6c"],
    "purple": ["#d0a4f4", "#8c62c8", "#4e3890"],
    "pink": ["#ffc6da", "#f08aac", "#ac4c82"],
    "white": [WHITE, "#d8dcea", "#9aa0be"],
    "gray": ["#e6e6ee", "#a8aac0", "#6c6e8c"],
    "charcoal": ["#7a7694", "#4e4a66", "#2e2a44"],
    "khaki": ["#f4dea8", "#caa86c", "#866c52"],
    "brown": ["#cc925a", "#8c5634", "#553044"],
    "straw": ["#fff0a6", "#e8c868", "#a88848"],
    "denim": ["#9cc0f0", "#5a80c8", "#34407e"],
    # ---- single colours
    "mouth": ["#8a3442"],
    "blush": ["#f69a9a"],
}


# v2 4-tone ramps (hi, base, shadow, deep) for the hand-placed cast in
# handmade.py. Hue-shifted the same way; the deep tone doubles as the
# outline of that material (navy on blue cloth, wine on red).
V2 = {
    "v2_skin": ["#fff0d8", "#f8c8a0", "#d8907c"],
    "v2_hair_dark": ["#a06850", "#6a3c3c", "#462838"],
    "v2_hair_brown": ["#eeac6a", "#b46c42", "#7a3c38"],
    "v2_hair_black": ["#6a6c9c", "#3c3a62", "#262440"],
    "v2_red": ["#ffa084", "#e84a3c", "#a82c44", "#5c1830"],
    "v2_blue": ["#94c4ff", "#4c78e0", "#3048a0", "#1c2458"],
    "v2_teal": ["#a4f0e0", "#40b8b0", "#24788c", "#184058"],
    "v2_navy": ["#6c84d8", "#3c4ca0", "#283070", "#1a1a48"],
    "v2_pink": ["#ffc4da", "#f07ca8", "#b04880"],
    "v2_white": ["#fffcf0"],
}
RAMPS.update(V2)
