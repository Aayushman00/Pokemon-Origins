"""Reorder database/pokedex_data.sql so parent tables precede FK children."""
from pathlib import Path
import re

path = Path(__file__).resolve().parents[1] / "database" / "pokedex_data.sql"
raw_bytes = path.read_bytes()
# Dump is UTF-16 LE (BOM ff fe)
if raw_bytes.startswith(b"\xff\xfe"):
    text = raw_bytes.decode("utf-16")
    out_encoding = "utf-16"
elif raw_bytes.startswith(b"\xfe\xff"):
    text = raw_bytes.decode("utf-16-be")
    out_encoding = "utf-16-be"
else:
    text = raw_bytes.decode("utf-8", errors="replace")
    out_encoding = "utf-8"

text = text.replace("\r\n", "\n").replace("\r", "\n")


def extract_block(src: str, table: str):
    pattern = rf"(?m)^--\n-- Table structure for table `{re.escape(table)}`\n"
    match = re.search(pattern, src)
    if not match:
        raise SystemExit(f"missing {table}")
    start = match.start()
    rest = src[start + 10 :]
    next_table = re.search(r"(?m)^--\n-- Table structure for table `", rest)
    next_db = re.search(r"(?m)^--\n-- Current Database:", rest)
    next_tz = re.search(r"(?m)^/\*!40103 SET TIME_ZONE=@OLD_TIME_ZONE", rest)
    candidates = []
    if next_table:
        candidates.append(start + 10 + next_table.start())
    if next_db:
        candidates.append(start + 10 + next_db.start())
    if next_tz:
        candidates.append(start + 10 + next_tz.start())
    if not candidates:
        raise SystemExit(f"no end for {table}")
    end = min(candidates)
    return start, end, src[start:end]


g0, g1, genders = extract_block(text, "pokemon_genders")
s0, s1, species = extract_block(text, "pokemon_species")
if g0 >= s0:
    raise SystemExit("unexpected pokedex table order")
text = text[:g0] + species + genders + text[s1:]

order = [
    "trainers",
    "trainer_pokemon",
    "trainer_pokemon_moves",
    "badges",
    "battles",
    "forgotten_moves",
    "inventory",
]
blocks = {t: extract_block(text, t)[2] for t in order}
use_idx = text.find("USE `trainer`;")
if use_idx < 0:
    raise SystemExit("no trainer use")
section_start = None
for m in re.finditer(r"(?m)^--\n-- Table structure for table `", text):
    if m.start() > use_idx:
        section_start = m.start()
        break
section_end = text.find("\n/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE", use_idx)
if section_start is None or section_end < 0:
    raise SystemExit("trainer section bounds not found")
ordered = "".join(blocks[t] for t in order)
text = text[:section_start] + ordered + text[section_end:]

# Prefer UTF-8 for MySQL docker init (UTF-16 can break mysql client)
path.write_text(text, encoding="utf-8", newline="\n")
print(f"rewrote {path} as utf-8 ({path.stat().st_size} bytes)")
for m in re.finditer(r"(?m)^-- Table structure for table `([^`]+)`", text):
    print(m.group(1))
