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
