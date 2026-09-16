# Gen 1 sprite sheet (source)

Place the canonical high-resolution sprite sheet here:

```
assets/sprites/source/gen1-sheet.png
```

This file is **not** in the repository yet. Do not download a substitute from the internet.

Documented layout (from the provided sheet / campaign plan):

- Grid: **10 columns × 16 rows** (160 cells; dex **001–151** occupy the first 151; remaining cells unused)
- Each cell labeled `#NNN NAME` in a header bar
- Inside a typical cell: front (left), back (center/right), menu icon, 2-frame idle, shiny on a second color band, female columns when the species has gender differences
- No trainer artwork on this sheet

## Commands

```bash
# Inspect / slice (requires Pillow: pip install -r scripts/requirements-sprites.txt)
python scripts/slice-pokemon-sprites.py --inspect
python scripts/slice-pokemon-sprites.py

# Until the sheet is present, bootstrap fronts from existing local battle sprites:
npm run sprites:bootstrap

# Validate required variants for dex 001–151
npm run validate:sprites
```

Slicing is a **one-time development step**. It is never invoked by the API or the running app.

Until `gen1-sheet.png` is sliced, only `front.png` may exist (copied from `frontend/public/things/pokemonOpp/{id}.png`). Missing `back` / `icon` files are **not faked**; the UI falls back to same-dex `front`, then `_fallback`.
