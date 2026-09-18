"""Verify database/pokedex_data.sql has no mojibake from a bad encoding round-trip.

Run after any re-export from MySQL Workbench (see database/README.md).
Exits 0 when clean, 1 when any known-corrupted byte sequence is found.
"""
from pathlib import Path
import sys

path = Path(__file__).resolve().parents[1] / "database" / "pokedex_data.sql"
try:
    raw = path.read_bytes()
except FileNotFoundError:
    print(f"ERROR: {path} not found. Restore the database dump first (see database/README.md).")
    sys.exit(1)

# Each pattern is checked as raw bytes so this never depends on how the
# *current* Python process's default encoding would decode the file --
# mojibake is a byte-level defect, not a decoding-choice defect.
PATTERNS = [
    ("Pok├⌐mon", "Pok├⌐mon".encode("utf-8")),
    ("PokÃ©mon", "PokÃ©mon".encode("utf-8")),
    ("Ã© (mis-encoded e-acute)", "Ã©".encode("utf-8")),
    ("U+FFFD replacement character", "�".encode("utf-8")),
]

found = [label for label, needle in PATTERNS if needle in raw]

if found:
    print(f"MOJIBAKE FOUND in {path}:")
    for label in found:
        print(f"  - {label}")
    print("Run `python scripts/reorder-sql-dump.py` to re-normalize, then re-run this check.")
    sys.exit(1)

print(f"{path} is clean ({len(raw)} bytes, no known mojibake patterns).")
sys.exit(0)
