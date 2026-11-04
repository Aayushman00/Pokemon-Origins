"""One command for every overworld asset.

  python3 -m scripts.overworld_art.build_all

1. character sheets, master palette, UI art      (build_sprites)
2. tileset overworld.png: ids 0-23 + new tiles   (tiles)
3. origin_town.json showcase map                 (origin_town)
4. tileArt.generated.js: pine + flowers for the Playground scenery
"""
import json
from pathlib import Path

from . import build_sprites, origin_town
from .tiles import new_tiles, tileset_image

ROOT = Path(__file__).resolve().parents[2]
MAPS = ROOT / "frontend" / "public" / "maps"
TILE_JS = ROOT / "frontend" / "src" / "v2" / "ui" / "tileArt.generated.js"


def pixel_rows(img):
    """RGBA image -> (rows of palette-index chars, palette)."""
    pal, rows, lookup = [], [], {}
    px = img.load()
    for y in range(img.height):
        line = ""
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                line += "."
                continue
            col = f"#{r:02x}{g:02x}{b:02x}"
            if col not in lookup:
                lookup[col] = len(pal)
                pal.append(col)
            line += "0123456789abcdefghijklmnopqrstuvwxyz"[lookup[col]]
        rows.append(line)
    return {"rows": rows, "pal": pal}


def main():
    build_sprites.main()
    img, total = tileset_image()
    img.save(MAPS / "tilesets" / "overworld.png")
    print(f"wrote overworld.png with {total} tiles")
    data = origin_town.build()
    (MAPS / "origin_town.json").write_text(json.dumps(data, indent=1) + "\n")
    print("wrote origin_town.json")

    # interiors: their own tileset + one map per enterable building
    from . import interiors
    img, total = interiors.tileset_image()
    img.save(MAPS / "tilesets" / "interior.png")
    for map_id, fn in interiors.MAPS.items():
        (MAPS / f"{map_id}.json").write_text(json.dumps(fn(), indent=1) + "\n")
    print(f"wrote interior.png ({total} tiles) and {len(interiors.MAPS)} interior maps")

    tiles = dict(new_tiles())
    from PIL import Image
    pine = Image.new("RGBA", (16, 32))
    pine.alpha_composite(tiles["pine_top"], (0, 0))
    pine.alpha_composite(tiles["pine_base"], (0, 16))
    # scenery wants the tree without its grass square: keep only non-grass pixels
    grass = {tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in ("#78c850", "#b0e070", "#68b848", "#58a840", "#387838")}
    p = pine.load()
    for y in range(32):
        for x in range(16):
            if p[x, y][:3] in grass:
                p[x, y] = (0, 0, 0, 0)
    art = {"pine": pixel_rows(pine), "flowers": pixel_rows(tiles["flowers0"]), "tufts": pixel_rows(tiles["tufts"])}
    TILE_JS.write_text(build_sprites.HEADER + f"export const TILE_ART = {json.dumps(art, separators=(',', ':'))};\n")
    print("wrote tileArt.generated.js")

    # tile-name index for /art-slice.html (preview page only; maps use ids)
    from .tiles import tile_ids
    slice_dir = ROOT / "frontend" / "public" / "art-slice"
    slice_dir.mkdir(parents=True, exist_ok=True)
    (slice_dir / "tiles.json").write_text(json.dumps(tile_ids(), indent=0) + "\n")
    print("wrote art-slice/tiles.json")


if __name__ == "__main__":
    main()
