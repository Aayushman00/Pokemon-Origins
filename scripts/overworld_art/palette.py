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

OUTLINE = "#26223a"  # world_palette.LINE: one outline for people and places
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
    "hair_moss": ["#d6e68c", "#86ac4c", "#44703e"],
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
    # ---- the player boy (hand-shaded): peach light, rose-violet shade;
    # midnight-blue hair with a silver streak, shared by his trousers and eyes
    "skin_hero": ["#ffdcb4", "#eaa878", "#b0686e"],
    "hair_midnight": ["#b0bae6", "#44529c", "#262a60"],
    "iris_midnight": [WHITE, "#44529c", "#262a60"],
    # ---- the player girl: cocoa hair with a cool mauve sheen (stays apart
    # from the coral jacket); a teal neckerchief shading into her skirt's
    # navy, which her eyes share, so the lit scarf fits the 15-colour budget
    "hair_cocoa": ["#b08a92", "#62404a", "#36222f"],
    "teal_hero": ["#8cecd8", "#34aea6", "#34407e"],
    "iris_dusk": [WHITE, "#34aea6", "#34407e"],
    # ---- the rival: eyes share his red hair's darkest tone
    "iris_ember": [WHITE, "#da563c", "#8e2e44"],
    # ---- the professor and mom: eyes share their trousers' / hair's darkest brown
    "iris_brown": [WHITE, "#8c5634", "#553044"],
    "iris_umber": [WHITE, "#9a5a32", "#5e3434"],
    # ---- polished majors: the heroes' eye on the cast's line colour
    "iris_ink": [WHITE, OUTLINE],
    # ---- single colours
    "mouth": ["#8a3442"],
    "blush": ["#f69a9a"],
}
