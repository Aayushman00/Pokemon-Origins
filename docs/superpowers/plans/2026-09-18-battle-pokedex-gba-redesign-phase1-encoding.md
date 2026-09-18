# GBA/FRLG Redesign — Phase 1: Encoding + DB Config — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the mojibake regression risk at its documented root cause (MySQL Workbench UTF-16 exports) with a defense-in-depth DB charset pin, an explicit re-export procedure in the docs, and a standalone, committed verification script so a future corrupted dump is caught before it ships — not a string replace in the UI.

**Architecture:** No architecture change. This phase only touches `backend/src/config/db.js` (add an explicit `charset` to the existing `mysql2.createPool()` config) and `database/README.md` (make the already-documented UTF-16→UTF-8 fact into an actionable "when you re-export, do this" instruction), plus one new standalone Python script (`scripts/check_encoding.py`) that greps `database/pokedex_data.sql` for known mojibake byte sequences and exits non-zero if any are found, matching the existing `scripts/reorder-sql-dump.py` style (no CLI framework, hardcoded path, plain `print`/`SystemExit`).

**Tech Stack:** Node.js (`mysql2`) for the pool config; plain Python 3 (stdlib only — `pathlib`, `re`, `sys`) for the verification script, matching `scripts/reorder-sql-dump.py`.

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 5 ("Encoding fix").

## Global Constraints

- Do not touch the battle system, the Pokédex UI, or any sprite/asset pipeline code — this phase is DB/encoding-only (per spec Section 9, Phase 1 scope).
- Do not rewrite or "fix" `database/pokedex_data.sql` itself — the file is already UTF-8-clean (verified 2026-09-18); this phase adds prevention/detection, not a data patch. Task 3's Step 3 is a narrow, explicit exception: it corrupts the file on disk to prove detection works, then restores it byte-exact and verifies the restore with `git diff` before any commit — the file is never left corrupted at a commit boundary.
- Do not remove or alter the existing `createLoggingPool()` wrapper in `backend/src/config/db.js` (lines 56-91) — it changes live query-logging behavior and is out of scope for an encoding fix.
- `charset` must be the exact string `"utf8mb4"` (matches the dump's declared `SET NAMES utf8mb4` / `utf8mb4_0900_ai_ci` collation — verified in `database/pokedex_data.sql`).
- The verification script must exit with status `0` when the dump is clean and non-zero when any of these byte sequences are found: `Pok├⌐mon`, `PokÃ©mon`, the raw UTF-8 bytes for `Ã©`, and the Unicode replacement character `\ufffd`.

---

### Task 1: Pin `utf8mb4` charset on the MySQL pool

**Files:**
- Modify: `backend/src/config/db.js:29-39`

**Interfaces:**
- Consumes: nothing new — `mysql2`'s `createPool()` accepts a `charset` key already; no other module needs to change to pick this up (every caller already imports the pool as `require("../config/db")` and gets `module.exports` from this file unchanged).
- Produces: nothing new for later tasks — this is a leaf config change.

- [ ] **Step 1: Add the `charset` key to the pool config**

Edit `backend/src/config/db.js`, in the `mysql.createPool({...})` call that starts at line 29:

```js
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "myuser",
  password: process.env.DB_PASSWORD || "mypassword",
  database: process.env.DB_NAME || "pokedex", // Change to "trainer" if needed
  port: process.env.DB_PORT || 3306,
  charset: "utf8mb4",
  connectTimeout: 10000, // 10 seconds timeout
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

Only the `charset: "utf8mb4",` line is new — every other line stays byte-for-byte identical, including the two comments on `database` and `connectTimeout`. Do not touch anything above line 29 (the commented-out old pool block) or below line 52 (the `createLoggingPool` wrapper) — both are out of scope per Global Constraints.

- [ ] **Step 2: Verify the change is syntactically valid**

Run: `node -e "require('./backend/src/config/db.js')"` from the repo root (`C:\Users\ayush\Desktop\Coding\Pokemon Origins\Pokemon-Origins`).

Expected: the process either exits 0, or prints `Database Connection Failed: ...ECONNREFUSED...` to the console (expected when no local MySQL is running) — either outcome proves the file parses and the pool constructs without a syntax or config error. A `SyntaxError` or `TypeError` referencing `db.js` means the edit broke the file; fix before continuing.

- [ ] **Step 3: Grep to confirm exactly one new line**

Run: `git diff backend/src/config/db.js`

Expected: a single-line addition (`+  charset: "utf8mb4",`) inside the `createPool` call, nothing else changed.

- [ ] **Step 4: Commit**

```bash
git add backend/src/config/db.js
git commit -m "fix: pin utf8mb4 charset on the MySQL connection pool"
```

---

### Task 2: Document the Workbench re-export procedure

**Files:**
- Modify: `database/README.md:163-166` (the existing `## Notes` section)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing for later tasks — documentation only.

- [ ] **Step 1: Replace the terse encoding note with an actionable procedure**

The current `## Notes` section (lines 163-166) reads:

```markdown
## Notes

- Dump encoding is UTF-8 (converted from UTF-16 for reliable MySQL client/Docker init).
- Reorder helper: `python scripts/reorder-sql-dump.py` (idempotent only if current order matches expected parents/children).
```

Replace it with:

```markdown
## Notes

- Dump encoding is UTF-8 (converted from UTF-16 for reliable MySQL client/Docker init).
- Reorder helper: `python scripts/reorder-sql-dump.py` (idempotent only if current order matches expected parents/children).

### Re-exporting `pokedex_data.sql` from MySQL Workbench

MySQL Workbench on Windows defaults to **UTF-16LE** when exporting a dump via
"Table Data Export Wizard" / "Export Results", not UTF-8. A UTF-16LE dump
fed into a UTF-8-assuming import path corrupts every accented character
(e.g. `Pokémon` becomes `Pok├⌐mon`) — this has happened before with this
exact dump.

**Whenever you re-export `pokedex_data.sql` from Workbench:**

1. Run `python scripts/reorder-sql-dump.py` — it detects a UTF-16LE/BE BOM
   and rewrites the file as UTF-8. Run it once per fresh export only: it
   also reorders `pokemon_genders`/`pokemon_species` and the `trainer`
   tables, and asserts the *pre-reorder* order on entry — running it a
   second time on a file it already reordered will raise
   `SystemExit("unexpected pokedex table order")`, not silently no-op.
2. Run `python scripts/check_encoding.py` — it exits non-zero if any
   mojibake byte sequence is still present, so a broken export is caught
   before it's committed.
3. Only commit `database/pokedex_data.sql` after both scripts report
   success.
```

- [ ] **Step 2: Verify the doc renders sensibly**

Run: `git diff database/README.md` and read it back — confirm the new subsection sits under `## Notes`, above nothing else, and the two existing bullet points are unchanged.

- [ ] **Step 3: Commit**

```bash
git add database/README.md
git commit -m "docs: document the Workbench UTF-16 re-export procedure"
```

---

### Task 3: Standalone mojibake verification script

**Files:**
- Create: `scripts/check_encoding.py`

**Interfaces:**
- Consumes: `database/pokedex_data.sql` (read-only, as raw bytes).
- Produces: a CLI script other tasks/docs reference as `python scripts/check_encoding.py` (already referenced by name in Task 2's doc edit — the filename here must match exactly: `check_encoding.py`, not `check-encoding.py`, to match what Task 2 wrote into the README).

- [ ] **Step 1: Write the script**

Create `scripts/check_encoding.py`:

```python
"""Verify database/pokedex_data.sql has no mojibake from a bad encoding round-trip.

Run after any re-export from MySQL Workbench (see database/README.md).
Exits 0 when clean, 1 when any known-corrupted byte sequence is found.
"""
from pathlib import Path
import sys

path = Path(__file__).resolve().parents[1] / "database" / "pokedex_data.sql"
raw = path.read_bytes()

# Each pattern is checked as raw bytes so this never depends on how the
# *current* Python process's default encoding would decode the file --
# mojibake is a byte-level defect, not a decoding-choice defect.
PATTERNS = [
    ("Pok├⌐mon", "Pok├⌐mon".encode("utf-8")),
    ("PokÃ©mon", "PokÃ©mon".encode("utf-8")),
    ("Ã© (mis-encoded e-acute)", "Ã©".encode("utf-8")),
    ("U+FFFD replacement character", "\ufffd".encode("utf-8")),
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
```

- [ ] **Step 2: Run it against the current (clean) dump — expect PASS**

Run: `python scripts/check_encoding.py` from the repo root.

Expected: exit code `0`, output ending in `is clean (... bytes, no known mojibake patterns).`

Check the exit code explicitly (bash): `python scripts/check_encoding.py; echo "exit=$?"` — expect `exit=0`.

- [ ] **Step 3: Prove it actually detects corruption — expect FAIL when the real file is corrupted**

`check_encoding.py` has one hardcoded target (`database/pokedex_data.sql`), matching `reorder-sql-dump.py`'s existing style — so proving detection means temporarily corrupting that exact file, with a guaranteed restore. Run this as one shell block so the restore always happens:

```bash
cp database/pokedex_data.sql database/pokedex_data.sql.bak
python -c "
from pathlib import Path
p = Path('database/pokedex_data.sql')
data = p.read_bytes().replace('Pokémon'.encode('utf-8'), 'Pok├⌐mon'.encode('utf-8'), 1)
p.write_bytes(data)
"
python scripts/check_encoding.py; echo "exit=$?"
mv database/pokedex_data.sql.bak database/pokedex_data.sql
```

Expected: the `check_encoding.py` run prints `MOJIBAKE FOUND in ...` listing `Pok├⌐mon`, and `exit=1`. If the `mv` restore step does not run for any reason, re-run it manually before continuing — do not proceed to Step 4 or commit with the dump still corrupted. Confirm restoration with `git status database/pokedex_data.sql` (expect no changes reported).

- [ ] **Step 4: Confirm the real dump still passes after restore**

Run: `python scripts/check_encoding.py; echo "exit=$?"` — expect `exit=0`. Also run `git diff database/pokedex_data.sql` — expect no output (proves the restore in Step 3 was byte-exact).

- [ ] **Step 5: Commit**

```bash
git add scripts/check_encoding.py
git commit -m "feat: add standalone mojibake verification script for pokedex_data.sql"
```

- [ ] **Step 6: One-time repo-wide grep across all encoding-sensitive file types**

`check_encoding.py` only ever checks `database/pokedex_data.sql` — the one
file with a documented history of corruption. Spec Section 5, item 3 also
asks for a one-time confirm-and-document pass across the rest of the repo's
text file types, so run it now and record the result in this task's commit:

```bash
grep -rlP 'Pok\x{251c}\x{2510}mon|Pok\xc3\x83\xc2\xa9mon|\xc3\x83\xc2\xa9|\x{FFFD}' \
  --include='*.sql' --include='*.js' --include='*.jsx' --include='*.json' \
  --include='*.md' --include='*.py' --include='*.env' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist \
  --exclude-dir=.venv --exclude-dir=__pycache__ .
```

Expected: no output (no matching files). This matches the repo audit
already performed on 2026-09-18 (see the design spec's Section 1 problem
statement, which found none present). If this grep finds any match, stop —
that file is a real, uninvestigated instance of the bug and needs its own
task before Phase 1 can be called complete; do not silently patch the
matched string.

- [ ] **Step 7: Record the result**

Append one line to this task's commit message via `git commit --amend` (or
note it in the PR/ledger if amending is inconvenient):

```
verify: repo-wide grep for mojibake patterns across .sql/.js/.jsx/.json/.md/.py/.env — none found (2026-09-18)
```

---

## Phase Completion

After Task 3's review is clean, Phase 1 of the Core batch (spec Section 9) is done. Next phase per the spec is **Phase 2 — Asset pipeline: Pokémon sprites** (`scripts/fetch_frlg_sprites.py`), which is a separate plan file written and reviewed on its own before implementation starts, per the approved "core-first, one phase at a time" sequencing.
