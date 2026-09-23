"""Fetch real FireRed/LeafGreen Pokemon sprites (dex 1-151) from Bulbagarden
Archives and place them at the app's existing canonical sprite paths.

Idempotent: a dex number whose output files already exist and are valid
64x64 PNGs is skipped on re-run.

Usage: python scripts/fetch_frlg_sprites.py
"""
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from frlg_sprites.resolve import resolve_dex_map, resolve_image_urls
from frlg_sprites.fetch_one import download_and_validate
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
POKEMON_DIR = ROOT / "frontend" / "public" / "sprites" / "pokemon"
BATTLE_DIR = ROOT / "frontend" / "public" / "sprites" / "battle"

FRONT_CATEGORY = "Category:FireRed_and_LeafGreen_sprites"
BACK_CATEGORY = "Category:FireRed_and_LeafGreen_back_sprites"
FRONT_PATTERN = r"^File:Spr (?:3[a-z]) (\d{3})\.png$"
BACK_PATTERN = r"^File:Spr b (?:3[a-z]) (\d{3})\.png$"


def _is_valid_existing(path: Path) -> bool:
    if not path.exists():
        return False
    try:
        with Image.open(path) as img:
            img.load()
            return img.size == (64, 64)
    except Exception:  # noqa: BLE001
        return False


def main() -> None:
    print("Resolving front sprite filenames...")
    front_titles = resolve_dex_map(FRONT_CATEGORY, FRONT_PATTERN)
    print("Resolving back sprite filenames...")
    back_titles = resolve_dex_map(BACK_CATEGORY, BACK_PATTERN)

    print("Resolving front sprite download URLs...")
    front_urls = resolve_image_urls(list(front_titles.values()))
    print("Resolving back sprite download URLs...")
    back_urls = resolve_image_urls(list(back_titles.values()))

    fetched, skipped = 0, 0
    for dex in range(1, 152):
        ddd = f"{dex:03d}"
        front_url = front_urls[front_titles[dex]]
        back_url = back_urls[back_titles[dex]]

        pokemon_front = POKEMON_DIR / ddd / "front.png"
        battle_front = BATTLE_DIR / ddd / "front.png"
        battle_front_b = BATTLE_DIR / ddd / "front-b.png"
        battle_back = BATTLE_DIR / ddd / "back.png"
        battle_back_b = BATTLE_DIR / ddd / "back-b.png"

        if all(
            _is_valid_existing(p)
            for p in (pokemon_front, battle_front, battle_front_b, battle_back, battle_back_b)
        ):
            skipped += 1
            continue

        print(f"[{ddd}] fetching front...")
        download_and_validate(front_url, battle_front)
        shutil.copyfile(battle_front, pokemon_front)
        shutil.copyfile(battle_front, battle_front_b)

        print(f"[{ddd}] fetching back...")
        download_and_validate(back_url, battle_back)
        shutil.copyfile(battle_back, battle_back_b)

        fetched += 1

    print(f"Done. Fetched {fetched} new dex entries, skipped {skipped} already-valid.")


if __name__ == "__main__":
    main()
