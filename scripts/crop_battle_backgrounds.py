"""Crop the 10 usable battle backgrounds out of the uploaded FRLG battle-BG
sheet, excluding the 3px grid border and the row-4 credit-text cell.

Source sheet is NOT in this git repo -- see plan Ruling 1.
"""
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = REPO_ROOT.parent / "Game Boy Advance - Pokemon FireRed _ LeafGreen - Battle Effects - Battle Backgrounds.png"
DEST_DIR = REPO_ROOT / "frontend" / "public" / "backgrounds"

COLS = [(6, 246), (249, 489), (492, 732)]  # (x0, x1) inside the border, per plan Ruling 5
ROWS = [(6, 118), (121, 233), (235, 347), (349, 461)]  # (y0, y1)

# name each populated cell, row-major, skipping row 4's columns 2-3 (credit box)
NAMES = [
    ["plain", "grass", "water"],
    ["dirt", "pond", "ice"],
    ["sand", "purple", "forest"],
    ["route"],  # row 4, column 1 only
]


def main() -> None:
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    img = Image.open(SOURCE_PATH).convert("RGB")
    written = 0
    for row_idx, (y0, y1) in enumerate(ROWS):
        row_names = NAMES[row_idx]
        for col_idx, name in enumerate(row_names):
            x0, x1 = COLS[col_idx]
            cell = img.crop((x0, y0, x1, y1))
            dest_path = DEST_DIR / f"{name}.png"
            cell.save(dest_path)
            print(f"wrote {dest_path} ({cell.size[0]}x{cell.size[1]})")
            written += 1
    print(f"Done. Wrote {written} backgrounds.")


if __name__ == "__main__":
    main()
