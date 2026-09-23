"""Download one Bulbagarden sprite PNG and validate it before writing to disk."""
import io
import time
import urllib.request
from pathlib import Path

from PIL import Image

USER_AGENT = "PokemonOriginsAssetPipeline/1.0 (one-time build script)"
EXPECTED_SIZE = (64, 64)


def download_and_validate(url: str, dest_path: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()

    if len(raw) == 0:
        raise SystemExit(f"download_and_validate({url}): empty response body")

    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception as exc:  # noqa: BLE001 - re-raised as SystemExit with context
        raise SystemExit(f"download_and_validate({url}): not a valid image ({exc})") from exc

    if img.format != "PNG":
        raise SystemExit(f"download_and_validate({url}): expected PNG, got {img.format}")
    if img.size != EXPECTED_SIZE:
        raise SystemExit(f"download_and_validate({url}): expected size {EXPECTED_SIZE}, got {img.size}")
    if img.mode not in ("RGBA", "LA", "PA") and "transparency" not in img.info:
        raise SystemExit(f"download_and_validate({url}): no alpha channel (mode={img.mode})")

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    dest_path.write_bytes(raw)
    time.sleep(0.3)
