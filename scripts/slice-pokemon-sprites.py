#!/usr/bin/env python3
"""
One-time Gen 1 sprite-sheet slicer.

Never import this from the API or the running app.

Source (required):
  assets/sprites/source/gen1-sheet.png

Output:
  frontend/public/sprites/pokemon/{ddd}/{front,front-b,back,back-b,icon}.png
  plus optional *-female.png and shiny/ when those regions exist.

Layout (documented; calibrate with --inspect when the sheet is added):
  10 columns × 16 rows. Dex 1 occupies cell 0 (row-major). Cells 151–159 unused.

Install: pip install -r scripts/requirements-sprites.txt
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = REPO_ROOT / "assets" / "sprites" / "source" / "gen1-sheet.png"
OUTPUT_DIR = REPO_ROOT / "frontend" / "public" / "sprites" / "pokemon"

COLS = 10
ROWS = 16
DEX_MAX = 151

# Fractions of a cell (left, top, right, bottom). Tuned from the provided sheet
# description; re-measure with --inspect if crops are off after adding the file.
REGIONS = {
    "front": (0.02, 0.14, 0.36, 0.52),
    "front-b": (0.36, 0.14, 0.50, 0.52),
    "back": (0.50, 0.14, 0.78, 0.52),
    "back-b": (0.78, 0.14, 0.98, 0.52),
    "icon": (0.78, 0.52, 0.98, 0.72),
}

CHROMA_KEYS = (
    (0, 255, 0),  # typical sheet green
    (0, 162, 232),  # typical sheet blue (shiny band)
    (48, 96, 48),
)
CHROMA_TOLERANCE = 48


def fail(message: str, code: int = 1) -> None:
    print(f"slice-pokemon-sprites: {message}", file=sys.stderr)
    sys.exit(code)


def chroma_to_alpha(im, keys=CHROMA_KEYS, tolerance=CHROMA_TOLERANCE):
    from PIL import Image

    rgba = im.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            for kr, kg, kb in keys:
                if (
                    abs(r - kr) <= tolerance
                    and abs(g - kg) <= tolerance
                    and abs(b - kb) <= tolerance
                ):
                    pixels[x, y] = (r, g, b, 0)
                    break
    return rgba


def crop_frac(cell, box):
    w, h = cell.size
    l, t, r, b = box
    return cell.crop(
        (
            int(l * w),
            int(t * h),
            int(r * w),
            int(b * h),
        )
    )


def trim_transparent(im):
    bbox = im.getbbox()
    if not bbox:
        return im
    return im.crop(bbox)


def inspect(im) -> None:
    w, h = im.size
    print(f"source: {SOURCE_PATH}")
    print(f"size: {w}x{h} mode={im.mode}")
    print(f"grid: {COLS} cols × {ROWS} rows")
    if w % COLS or h % ROWS:
        print(
            f"WARNING: size not evenly divisible by grid "
            f"(cell would be {w / COLS:.2f} x {h / ROWS:.2f})"
        )
    else:
        print(f"cell: {w // COLS}x{h // ROWS} (uniform)")
    print(f"dex mapping: cell index 0 → #001 … cell {DEX_MAX - 1} → #{DEX_MAX:03d}")
    print(f"unused cells: {COLS * ROWS - DEX_MAX} (indices {DEX_MAX}–{COLS * ROWS - 1})")
    print("regions (fractions of cell):")
    for name, box in REGIONS.items():
        print(f"  {name}: {box}")


def slice_sheet(im, output: Path) -> int:
    w, h = im.size
    if w < COLS or h < ROWS:
        fail(f"image too small for {COLS}x{ROWS} grid: {w}x{h}")
    cell_w = w // COLS
    cell_h = h // ROWS
    if cell_w < 8 or cell_h < 8:
        fail(f"cell size too small: {cell_w}x{cell_h}")

    written = 0
    for dex in range(1, DEX_MAX + 1):
        idx = dex - 1
        col = idx % COLS
        row = idx // COLS
        if row >= ROWS:
            fail(f"dex {dex} falls outside grid")
        left = col * cell_w
        top = row * cell_h
        cell = im.crop((left, top, left + cell_w, top + cell_h))
        dest = output / f"{dex:03d}"
        dest.mkdir(parents=True, exist_ok=True)
        for name, box in REGIONS.items():
            sprite = chroma_to_alpha(crop_frac(cell, box))
            sprite = trim_transparent(sprite)
            path = dest / f"{name}.png"
            sprite.save(path, "PNG", optimize=True)
            written += 1
    return written


def main() -> None:
    parser = argparse.ArgumentParser(description="Slice Gen 1 Pokémon sprite sheet")
    parser.add_argument(
        "--inspect",
        action="store_true",
        help="Print layout info and exit without writing files",
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=SOURCE_PATH,
        help="Path to gen1-sheet.png",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_DIR,
        help="Output directory",
    )
    args = parser.parse_args()

    if not args.source.is_file():
        fail(
            f"source sheet not found: {args.source}\n"
            "Place the high-resolution Gen 1 sheet at:\n"
            f"  {SOURCE_PATH}\n"
            "Do not download a substitute. Until then, run: npm run sprites:bootstrap"
        )

    try:
        from PIL import Image
    except ImportError:
        fail(
            "Pillow is required. Install with:\n"
            "  pip install -r scripts/requirements-sprites.txt"
        )

    im = Image.open(args.source)
    if args.inspect:
        inspect(im)
        return

    inspect(im)
    written = slice_sheet(im, args.output)
    print(f"wrote {written} files under {args.output}")


if __name__ == "__main__":
    main()
