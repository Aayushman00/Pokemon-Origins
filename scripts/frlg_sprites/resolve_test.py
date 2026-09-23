"""Live-network tests against the real Bulbagarden API (this pipeline IS
network-dependent by design — there is nothing to fake here without
losing the point of the test)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from frlg_sprites.resolve import resolve_dex_map, resolve_image_urls

FRONT_CATEGORY = "Category:FireRed_and_LeafGreen_sprites"
BACK_CATEGORY = "Category:FireRed_and_LeafGreen_back_sprites"
FRONT_PATTERN = r"^File:Spr (?:3[a-z]) (\d{3})\.png$"
BACK_PATTERN = r"^File:Spr b (?:3[a-z]) (\d{3})\.png$"


def test_front_map_covers_all_151_no_ambiguity():
    mapping = resolve_dex_map(FRONT_CATEGORY, FRONT_PATTERN)
    assert len(mapping) == 151, f"expected 151 entries, got {len(mapping)}"
    assert mapping[1] == "File:Spr 3f 001.png"
    assert mapping[25] == "File:Spr 3r 025.png"  # Pikachu: verified non-standard prefix
    assert mapping[151] == "File:Spr 3f 151.png"


def test_back_map_covers_all_151_no_ambiguity():
    mapping = resolve_dex_map(BACK_CATEGORY, BACK_PATTERN)
    assert len(mapping) == 151, f"expected 151 entries, got {len(mapping)}"
    assert mapping[1] == "File:Spr b 3f 001.png"


def test_resolve_image_urls_matches_known_url():
    urls = resolve_image_urls(["File:Spr 3f 001.png"])
    assert urls["File:Spr 3f 001.png"] == "https://archives.bulbagarden.net/media/upload/c/c0/Spr_3f_001.png"


if __name__ == "__main__":
    test_front_map_covers_all_151_no_ambiguity()
    print("test_front_map_covers_all_151_no_ambiguity: PASS")
    test_back_map_covers_all_151_no_ambiguity()
    print("test_back_map_covers_all_151_no_ambiguity: PASS")
    test_resolve_image_urls_matches_known_url()
    print("test_resolve_image_urls_matches_known_url: PASS")
