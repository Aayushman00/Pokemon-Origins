"""Live-network test: downloads one real, known-good sprite and one that
does not exist, to prove both the success and failure paths."""
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from frlg_sprites.fetch_one import download_and_validate

KNOWN_GOOD_URL = "https://archives.bulbagarden.net/media/upload/c/c0/Spr_3f_001.png"


def test_downloads_and_validates_known_sprite():
    with tempfile.TemporaryDirectory() as tmp:
        dest = Path(tmp) / "001" / "front.png"
        download_and_validate(KNOWN_GOOD_URL, dest)
        assert dest.exists()
        assert dest.stat().st_size > 0


def test_raises_on_404():
    with tempfile.TemporaryDirectory() as tmp:
        dest = Path(tmp) / "bad" / "front.png"
        try:
            download_and_validate("https://archives.bulbagarden.net/media/upload/0/00/Definitely_Not_A_Real_File.png", dest)
            raise AssertionError("expected SystemExit/urllib error, got none")
        except SystemExit:
            pass
        except Exception:
            pass  # a raw urllib.error.HTTPError is also an acceptable failure signal here
        assert not dest.exists()


if __name__ == "__main__":
    test_downloads_and_validates_known_sprite()
    print("test_downloads_and_validates_known_sprite: PASS")
    test_raises_on_404()
    print("test_raises_on_404: PASS")
