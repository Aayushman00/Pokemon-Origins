# GBA/FRLG Redesign — Phase 2: Asset Pipeline (Pokémon Front/Back Sprites) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder Pokémon sprite files at the app's existing, already-wired sprite paths with real, authentic Generation III (FireRed/LeafGreen) sprites fetched once at build time from Bulbagarden Archives, via a reusable, idempotent script — never hotlinked at runtime.

**Architecture:** No architecture change to the frontend. `frontend/src/sprites/pokemonSprites.js` and `frontend/src/sprites/battleSprites.js` (the resolver modules) and every component that calls them (`PokemonSprite.jsx`, `BattlePokemonSprite.jsx`) are untouched — this phase only replaces the *content* of the PNG files already sitting at the paths those resolvers already read: `frontend/public/sprites/pokemon/{ddd}/front.png` and `frontend/public/sprites/battle/{ddd}/{front,front-b,back,back-b}.png`. The design spec (Section 4) proposed a different flat naming scheme (`pokemon/front/{dex3}.png`); this plan deviates from that literal text — see Ruling 1 below — in favor of the paths the app actually reads today, to avoid a second, riskier change to resolver code that nothing in this phase requires.

**Tech Stack:** Plain Python 3 (stdlib `urllib.request`, `json`, `re`, `pathlib`) plus Pillow (already installed this session) for PNG validation. No new Node dependency. Matches the existing `scripts/*.py` style (no CLI framework, hardcoded paths, plain `print`/`sys.exit`).

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 4 ("Asset pipeline") and Section 9, Phase 2.

## Rulings (made during planning, binding on this plan)

1. **Output paths.** The spec's Section 4 proposed `assets/pokemon/front/{dex3}.png` / `back/{dex3}.png`. The actual, already-wired app paths (confirmed by reading `frontend/src/sprites/pokemonSprites.js`, `battleSprites.js`, and the files on disk) are `frontend/public/sprites/pokemon/{ddd}/front.png` (Pokédex/evolution-chain front sprite) and `frontend/public/sprites/battle/{ddd}/front.png|front-b.png|back.png|back-b.png` (battle scene). This plan writes to the real paths, not the spec's proposed ones. Cost if wrong: none — the spec's proposed path was aspirational text written before the resolver code was read line-by-line; writing to the real paths is what actually fixes what players see.
2. **Source identification method.** The spec said "identify the exact asset individually, not scraped from category-listing HTML at runtime." This plan uses the Bulbagarden **MediaWiki API** (`action=query&list=categorymembers` and `action=query&prop=imageinfo`) — a documented, stable JSON API, not HTML scraping — to build a dex-number → exact-filename map once, at build/commit time (not runtime). This was necessary because filenames are not uniformly predictable: dex 025 (Pikachu) and 201 (Unown) are filed as `Spr 3r {ddd}.png`, not the `Spr 3f {ddd}.png` pattern most species use, and only the category listing reveals this. **Verified live on 2026-09-18:** both categories (`Category:FireRed_and_LeafGreen_sprites`, `Category:FireRed_and_LeafGreen_back_sprites`) contain exactly one match per dex 1–151 for the regex in Task 1 — zero missing, zero ambiguous/duplicate matches.
3. **No cropping needed.** The spec assumed cropping would be required ("CROPPING IS EXTREMELY IMPORTANT... detect actual sprite bounds"). Verified live: every Bulbagarden Gen3 front/back sprite checked (dex 001, 003, 025, 095, 130, 151 — smallest to largest, front and back) is already a uniform, pre-cropped **64×64 canvas** — the authentic in-game canvas size, with each Pokémon's art already scaled correctly within it (this is what preserves real relative scale between species, e.g. Onix vs Diglett). Re-cropping to a per-sprite bounding box would *destroy* that relative scale (this exact mistake was caught and reverted during an earlier Pokédex review this session — see memory/session history). This task therefore validates dimensions (must be exactly 64×64) rather than computing and applying a crop.
4. **Second idle-animation frame (`front-b.png`/`back-b.png`).** Generation III battle sprites have no official second animation frame (unlike Gen V+). The current placeholder files at these paths have distinct pixel content (verified: different MD5 hashes from their `front.png`/`back.png` siblings), but that content is old placeholder art, not authentic data. This plan writes `front-b.png` = byte-identical copy of the new authentic `front.png` (same for `back-b.png`/`back.png`) rather than fabricating a second frame. `ponytail: single real frame duplicated for both idle-alternation slots; a real second frame doesn't exist for Gen3 — if Phase 11's animation state machine wants visible idle motion, it needs a CSS-driven effect (e.g., a 1-2px translateY), not a second sprite frame.`
5. **`icon.png`/`back.png` under `pokemon/{ddd}/`** are required by `scripts/validate-sprites.js`'s full mode but are not fetched by this plan (icon sprites are a different, unrelated Bulbagarden asset category — overworld/menu icons, not battle front/back sprites — and nothing in the current UI reads `pokemon/{ddd}/back.png` or `icon.png` per the Section 0 audit). This plan's Task 5 validates with the script's existing `--front-only` flag, which was clearly built for exactly this kind of partial pipeline.

## Global Constraints

- Do not touch `frontend/src/sprites/pokemonSprites.js`, `frontend/src/sprites/battleSprites.js`, `frontend/src/components/PokemonSprite/*.jsx`, or any battle UI component — this phase is asset-content-only.
- Do not touch the battle scene coordinate system, backgrounds, shadows, or trainer sprites — those are later phases.
- Every downloaded file must be verified as a valid PNG, exactly 64×64 pixels, with an alpha channel, before being written to its canonical destination. A file that fails verification for any dex number stops the run for that dex number with a clear error naming the dex number and reason — never silently skipped, never a placeholder substituted.
- The fetch script must be safely re-runnable: on a second run, any dex number whose canonical output files already exist and pass validation is skipped (not re-downloaded), so an interrupted run can resume without re-fetching everything.
- Space out HTTP requests to Bulbagarden (a `time.sleep(0.3)` between downloads) — this is a one-time build script, not a runtime dependency, and Bulbagarden's servers are not this project's infrastructure.
- Deleting `assets/battle_sprites/` and `assets/sprites_cropped/` (repo root) happens only in Task 6, only after Task 5's validation of the new set passes, and is its own commit — never bundled with the fetch script's commit.

---

### Task 1: Dex → filename resolver (`scripts/frlg_sprites/resolve.py`)

**Files:**
- Create: `scripts/frlg_sprites/__init__.py` (empty, makes this a package)
- Create: `scripts/frlg_sprites/resolve.py`
- Test: `scripts/frlg_sprites/resolve_test.py`

**Interfaces:**
- Consumes: nothing (network only).
- Produces: `resolve_dex_map(category_title: str, filename_pattern: str) -> dict[int, str]` — maps dex number (1-151) to the exact `File:...` title string for that category. Also `resolve_image_urls(titles: list[str]) -> dict[str, str]` — maps a `File:...` title to its current download URL, batching up to 50 titles per API call. Task 2 imports both of these by name.

- [ ] **Step 1: Write `resolve.py`**

```python
"""Resolve Bulbagarden Archives file titles and URLs via the MediaWiki API.

Read-only, network-dependent by design (this IS the asset-acquisition step).
No HTML scraping: only the documented action=query API.
"""
import json
import re
import time
import urllib.parse
import urllib.request

API = "https://archives.bulbagarden.net/w/api.php"
USER_AGENT = "PokemonOriginsAssetPipeline/1.0 (one-time build script)"


def _get_json(params: dict) -> dict:
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _fetch_all_category_members(category_title: str) -> list[str]:
    titles = []
    cmcontinue = None
    while True:
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": category_title,
            "cmlimit": 500,
            "format": "json",
        }
        if cmcontinue:
            params["cmcontinue"] = cmcontinue
        data = _get_json(params)
        titles.extend(m["title"] for m in data["query"]["categorymembers"])
        if "continue" in data:
            cmcontinue = data["continue"]["cmcontinue"]
        else:
            break
    return titles


def resolve_dex_map(category_title: str, filename_pattern: str) -> dict:
    """dex number (1-151) -> exact 'File:...' title, or raises if any of 1-151 is missing/ambiguous."""
    pattern = re.compile(filename_pattern)
    titles = _fetch_all_category_members(category_title)
    mapping: dict[int, list[str]] = {}
    for title in titles:
        m = pattern.match(title)
        if not m:
            continue
        dex = int(m.group(1))
        if 1 <= dex <= 151:
            mapping.setdefault(dex, []).append(title)

    missing = [d for d in range(1, 152) if d not in mapping]
    if missing:
        raise SystemExit(f"resolve_dex_map({category_title}): missing dex numbers {missing}")
    ambiguous = {d: v for d, v in mapping.items() if len(v) > 1}
    if ambiguous:
        raise SystemExit(f"resolve_dex_map({category_title}): ambiguous matches {ambiguous}")

    return {d: v[0] for d, v in mapping.items()}


def resolve_image_urls(titles: list) -> dict:
    """'File:...' title -> current download URL, batched 50 titles per request."""
    result = {}
    for i in range(0, len(titles), 50):
        batch = titles[i : i + 50]
        data = _get_json(
            {
                "action": "query",
                "titles": "|".join(batch),
                "prop": "imageinfo",
                "iiprop": "url|size|mime",
                "format": "json",
            }
        )
        pages = data["query"]["pages"]
        # Map back by normalized title, since the API may report a 'normalized' list.
        norm = {n["from"]: n["to"] for n in data["query"].get("normalized", [])}
        by_title = {}
        for page in pages.values():
            title = page["title"]
            infos = page.get("imageinfo")
            if not infos:
                raise SystemExit(f"resolve_image_urls: no imageinfo for {title!r}")
            by_title[title] = infos[0]
        for original in batch:
            resolved_title = norm.get(original, original)
            info = by_title.get(resolved_title)
            if info is None:
                raise SystemExit(f"resolve_image_urls: could not resolve {original!r}")
            result[original] = info["url"]
        time.sleep(0.3)
    return result
```

- [ ] **Step 2: Write the test**

```python
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
```

- [ ] **Step 3: Run the test**

Run: `touch scripts/frlg_sprites/__init__.py && python scripts/frlg_sprites/resolve_test.py`

Expected: all three `PASS` lines print, no exceptions. This hits the real network — if Bulbagarden is unreachable, the test will fail with a `urllib.error` and that's a legitimate environment blocker, not a code bug; retry once before treating it as BLOCKED.

- [ ] **Step 4: Commit**

```bash
git add scripts/frlg_sprites/__init__.py scripts/frlg_sprites/resolve.py scripts/frlg_sprites/resolve_test.py
git commit -m "feat: resolve Bulbagarden FRLG sprite filenames via MediaWiki API"
```

---

### Task 2: Download + validate one sprite (`scripts/frlg_sprites/fetch_one.py`)

**Files:**
- Create: `scripts/frlg_sprites/fetch_one.py`
- Test: `scripts/frlg_sprites/fetch_one_test.py`

**Interfaces:**
- Consumes: nothing from Task 1 directly (takes a URL, not a title — Task 3 wires Task 1's output into this).
- Produces: `download_and_validate(url: str, dest_path: Path) -> None` — downloads `url`, verifies it is a PNG exactly 64×64 with an alpha channel, and writes it to `dest_path` (creating parent directories). Raises `SystemExit` with a message naming the URL and the specific validation failure if anything is wrong. Task 3 imports this by name.

- [ ] **Step 1: Write `fetch_one.py`**

```python
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
```

- [ ] **Step 2: Write the test**

```python
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
```

- [ ] **Step 3: Run the test**

Run: `python scripts/frlg_sprites/fetch_one_test.py`

Expected: both `PASS` lines print.

- [ ] **Step 4: Commit**

```bash
git add scripts/frlg_sprites/fetch_one.py scripts/frlg_sprites/fetch_one_test.py
git commit -m "feat: add sprite download+validation helper"
```

---

### Task 3: CLI driver (`scripts/fetch_frlg_sprites.py`)

**Files:**
- Create: `scripts/fetch_frlg_sprites.py`

**Interfaces:**
- Consumes: `resolve_dex_map`, `resolve_image_urls` from Task 1; `download_and_validate` from Task 2.
- Produces: a runnable script, `python scripts/fetch_frlg_sprites.py`, that populates all output paths for dex 1-151. No other task depends on this script's internals — only on the files it produces (checked in Task 5).

- [ ] **Step 1: Write the driver**

```python
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
```

- [ ] **Step 2: Verify it parses and dry-imports correctly**

Run: `python -c "import ast; ast.parse(open('scripts/fetch_frlg_sprites.py').read())"`

Expected: no output, exit 0 (proves no syntax error before the real 151-species run in Task 4, which takes several minutes).

- [ ] **Step 3: Commit**

```bash
git add scripts/fetch_frlg_sprites.py
git commit -m "feat: add CLI driver for fetching FRLG Pokemon sprites"
```

---

### Task 4: Run the full fetch and validate

**Files:** none created/modified by this task except the sprite PNGs themselves under `frontend/public/sprites/pokemon/*/front.png` and `frontend/public/sprites/battle/*/{front,front-b,back,back-b}.png` (151 dex directories, up to 5 files touched each — these are binary asset files, not source).

**Interfaces:** none — this task only runs Task 3's script and Task 5's pre-existing validator.

- [ ] **Step 1: Run the fetch**

Run: `python scripts/fetch_frlg_sprites.py`

Expected: prints `[001] fetching front...` through `[151] fetching back...` (or `skipped` lines on a re-run), ending in `Done. Fetched 151 new dex entries, skipped 0 already-valid.` on a first run. This takes several minutes (302 downloads at ~0.3s spacing plus network latency — budget 5-10 minutes). If it exits early with a `SystemExit` naming a specific dex number, that dex's Bulbagarden asset needs manual investigation before re-running (do not retry blindly more than twice).

- [ ] **Step 2: Validate with the existing validator**

Run: `node scripts/validate-sprites.js --front-only`

Expected: `validate-sprites: 151 front sprites + fallbacks OK (--front-only)`. If it reports missing files, the fetch in Step 1 did not complete for those dex numbers — re-run Step 1 (it's idempotent, safe to re-run).

- [ ] **Step 3: Spot-check 5 sprites visually**

Read these 5 files with the Read tool (image support) and visually confirm each looks like the correct, recognizable Pokémon, is not stretched/blurred, and has a clean transparent background (no leftover color-key halo):
- `frontend/public/sprites/battle/001/front.png` (Bulbasaur — small, dual-color)
- `frontend/public/sprites/battle/025/front.png` (Pikachu — the non-standard "3r" filename case from Ruling 2)
- `frontend/public/sprites/battle/095/front.png` (Onix — large, serpentine, tests the shared-canvas relative-scale claim in Ruling 3)
- `frontend/public/sprites/battle/130/back.png` (Gyarados — large, back-facing)
- `frontend/public/sprites/battle/151/front.png` (Mew — legendary)

- [ ] **Step 4: Commit the fetched assets**

```bash
git add frontend/public/sprites/pokemon frontend/public/sprites/battle
git commit -m "feat: replace placeholder sprites with real FRLG Pokemon sprites (dex 1-151)"
```

---

### Task 5: Delete superseded placeholder asset stores

**Files:**
- Delete: `assets/battle_sprites/` (repo root, directories `001`-`151`)
- Delete: `assets/sprites_cropped/` (repo root, 151 PNG files)

**Interfaces:** none.

- [ ] **Step 1: Confirm nothing references these directories**

Run: `grep -rl "battle_sprites\|sprites_cropped" --include=*.js --include=*.jsx --include=*.py --include=*.json frontend backend scripts Pokemon-Origins 2>/dev/null`

Expected: no output (these were already confirmed disconnected/unreferenced during the original repo audit — this is a final check before deleting, not new research).

- [ ] **Step 2: Delete both directories**

```bash
git rm -r assets/battle_sprites assets/sprites_cropped
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove superseded placeholder sprite stores (assets/battle_sprites, assets/sprites_cropped)"
```

---

## Phase Completion

After Task 5's review is clean, Phase 2 is done. Next phase per the spec is **Phase 3 — Trainer sprites + battle background crop** (uploaded `Main Character Male.gif`/`Main Character Female.gif` and the battle-background sheet), a separate plan written and reviewed on its own.
