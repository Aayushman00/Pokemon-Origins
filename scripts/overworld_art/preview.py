"""Contact sheet: every character x every direction x every frame at 4x.

Usage: python -m scripts.overworld_art.preview [out.png]
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

from .characters import ROSTER
from .sheets import COLUMNS, ROWS, build_sheet

SCALE = 4
CELL_W, CELL_H = 16 * SCALE, 32 * SCALE
GAP = 6
LABEL_W = 150
GRASS = (124, 188, 104, 255)


def contact_sheet(roster=ROSTER):
    cols = len(ROWS) * len(COLUMNS)
    width = LABEL_W + cols * (CELL_W + GAP) + 3 * GAP * 2
    row_h = CELL_H + GAP * 2
    img = Image.new("RGBA", (width, 24 + row_h * len(roster)), (40, 44, 52, 255))
    d = ImageDraw.Draw(img)
    x = LABEL_W
    for direction in ROWS:
        d.text((x + 2, 6), direction, fill=(230, 230, 230, 255))
        x += len(COLUMNS) * (CELL_W + GAP) + GAP * 2
    for i, char in enumerate(roster):
        sheet = build_sheet(char)
        y = 24 + i * row_h
        d.text((8, y + CELL_H // 2 - 10), char["label"], fill=(255, 255, 255, 255))
        d.text((8, y + CELL_H // 2 + 6), char["gender"], fill=(255, 190, 120, 255) if char["gender"] == "female" else (140, 190, 255, 255))
        x = LABEL_W
        for r in range(len(ROWS)):
            for c in range(len(COLUMNS)):
                cell = sheet.crop((c * 16, r * 32, c * 16 + 16, r * 32 + 32)).resize((CELL_W, CELL_H), Image.NEAREST)
                bg = Image.new("RGBA", (CELL_W, CELL_H), GRASS)
                bg.alpha_composite(cell)
                img.paste(bg, (x, y))
                x += CELL_W + GAP
            x += GAP * 2
    return img


def walk_gif(path, roster=ROSTER):
    """Animated GIF: each character walks in place in all four directions.

    Cycle mirrors the engine: stand, step A, stand, step B, with a blink
    and an alert pose at the end so every column is exercised.
    """
    seq = [0, 1, 0, 2, 0, 1, 0, 2, 3, 0, 4, 4]
    frames = []
    pad = 8
    w = pad + len(ROWS) * (CELL_W + pad)
    h = pad + len(roster) * (CELL_H + pad)
    sheets = [build_sheet(c) for c in roster]
    for col in seq:
        img = Image.new("RGBA", (w, h), GRASS)
        for i, sheet in enumerate(sheets):
            for r in range(len(ROWS)):
                cell = sheet.crop((col * 16, r * 32, col * 16 + 16, r * 32 + 32)).resize((CELL_W, CELL_H), Image.NEAREST)
                img.alpha_composite(cell, (pad + r * (CELL_W + pad), pad + i * (CELL_H + pad)))
        frames.append(img.convert("RGB"))
    durations = [180] * len(seq)
    durations[-1] = durations[-2] = 500
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=durations, loop=0)


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "overworld_preview.png")
    contact_sheet().save(out)
    walk_gif(out.with_suffix(".gif"))
    print(f"wrote {out} and {out.with_suffix('.gif')}")
