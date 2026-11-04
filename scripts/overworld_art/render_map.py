"""Render a map JSON to a PNG offline (no dev server), the way renderer.js
draws it: ground, decor, objects, y-sorted actors (stand frame), above.

  python3 -m scripts.overworld_art.render_map origin_town out.png --scale 3

Use it to review art at 1x / 3x next to the FireRed references.
"""
import argparse
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MAPS = ROOT / "frontend" / "public" / "maps"
SPRITES = ROOT / "frontend" / "public" / "sprites" / "overworld"
ROW = {"down": 0, "up": 1, "left": 2, "right": 3}


def render(map_id, frame_ms=0):
    m = json.loads((MAPS / f"{map_id}.json").read_text())
    w, h, T = m["width"], m["height"], m["tilewidth"]
    out = Image.new("RGBA", (w * T, h * T), (0, 0, 0, 255))
    sets = sorted((ts for ts in m["tilesets"] if ts.get("image")), key=lambda t: -t["firstgid"])
    imgs = {ts["image"]: Image.open(MAPS / ts["image"]).convert("RGBA") for ts in sets}
    anims = {}
    for ts in sets:
        for tile in ts.get("tiles", []):
            if "animation" in tile:
                anims[(ts["firstgid"], tile["id"])] = tile["animation"]
    layers = {l["name"]: l for l in m["layers"]}

    def tile_img(gid):
        ts = next(t for t in sets if gid >= t["firstgid"])
        local = gid - ts["firstgid"]
        anim = anims.get((ts["firstgid"], local))
        if anim:
            total = sum(f["duration"] for f in anim)
            t = frame_ms % total
            for f in anim:
                if t < f["duration"]:
                    local = f["tileid"]
                    break
                t -= f["duration"]
        cols = ts["columns"]
        return imgs[ts["image"]].crop(((local % cols) * T, (local // cols) * T, (local % cols + 1) * T, (local // cols + 1) * T))

    def draw(name):
        data = layers[name]["data"]
        for i, gid in enumerate(data):
            if gid and gid < 1000:
                out.alpha_composite(tile_img(gid), ((i % w) * T, (i // w) * T))

    for name in ("ground", "decor", "objects"):
        draw(name)
    actors = []
    for o in layers.get("npcs", {}).get("objects", []):
        p = {q["name"]: q["value"] for q in o.get("properties", [])}
        actors.append((o["y"], o["x"], p.get("sprite", "npc"), p.get("facing", "down"), p))
    legend = json.loads((SPRITES / "legendary" / "manifest.json").read_text()) if (SPRITES / "legendary" / "manifest.json").exists() else None
    for y, x, sprite, facing, p in sorted(actors, key=lambda a: (a[0], a[1])):
        if p.get("kind") == "legendary":
            entry = next(l for l in legend["legendaries"] if l["dex"] == p["dex"])
            cell = Image.open(SPRITES / "legendary" / f"{p['dex']}.png").convert("RGBA").crop((0, 0, 32, 32))
            if p.get("shiny"):  # same palette swap the game does at load time
                lut = {tuple(int(k[i:i + 2], 16) for i in (1, 3, 5)): tuple(int(v[i:i + 2], 16) for i in (1, 3, 5))
                       for k, v in entry["shiny"].items()}
                px = cell.load()
                for yy in range(32):
                    for xx in range(32):
                        c = px[xx, yy]
                        if c[3] and c[:3] in lut:
                            px[xx, yy] = (*lut[c[:3]], 255)
            out.alpha_composite(cell, (int(x) - 8, int(y) - T))
            continue
        sheet = Image.open(SPRITES / f"{sprite}.png").convert("RGBA")
        cell = sheet.crop((0, ROW[facing] * 32, 16, ROW[facing] * 32 + 32))
        out.alpha_composite(cell, (int(x), int(y) - T))
    draw("above")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("map_id")
    ap.add_argument("out")
    ap.add_argument("--scale", type=int, default=1)
    a = ap.parse_args()
    img = render(a.map_id)
    if a.scale > 1:
        img = img.resize((img.width * a.scale, img.height * a.scale), Image.NEAREST)
    img.save(a.out)
    print(f"wrote {a.out} ({img.width}x{img.height})")


if __name__ == "__main__":
    main()
