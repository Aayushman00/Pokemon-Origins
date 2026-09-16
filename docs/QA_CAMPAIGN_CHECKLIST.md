# QA — Campaign Loop Checklist (Phase 11)

How to read the Status column:

- **PASS (auto)** — covered by the backend test suite (`cd backend && npm test`, 115 tests green on this pass) or the production build; the verifying test/tool is named.
- **PASS (sim)** — verified by the balance simulator (`cd backend && node scripts/balance-sim.js`), which replays the whole campaign against the live data files and XP/coin constants.
- **MANUAL** — browser step with the expected result spelled out; run it against a live stack (`docker compose up` + seeded pokedex DB). These steps were code-reviewed this phase but not clicked through in a live browser here.

## 1. Auth → starter → Level 1 → Brock → reward → mart

| # | Step | Expected | Status |
|---|------|----------|--------|
| 1.1 | Register + log in | JWT stored; hub shows starter picker | MANUAL |
| 1.2 | Choose a starter | Party gets the starter at Lv 5; duplicate choice rejected | PASS (auto — `starterService.test.js`) |
| 1.3 | Hub after starter | Party strip shows live species/Lv/HP; Continue points at Level 1 · Battle 1 | MANUAL (new Phase 11 UI) |
| 1.4 | Level 1 road (4 trainers) | Battles start only in progress order; win advances battle | PASS (auto — `battleSessionService` start/win/progress tests) |
| 1.5 | Brock (gym_boss, Geodude+Onix) | Second mon auto-sent on faint; win only after both faint | PASS (auto — "sends the next enemy mon on faint...") |
| 1.6 | Brock win rewards | XP once (6 × sum of enemy levels), 300 coins once, 3-card offer once | PASS (auto — win/XP/coins/offer idempotency tests) |
| 1.7 | Claim a reward card | Only a server option claimable; party < 3 adds, = 3 forces replacement | PASS (auto — `rewardService.test.js`) |
| 1.8 | "Claim later" then re-enter level | Offer resurfaces on next level entry (entry always passes the reward check) | MANUAL (flow rewired this phase) |
| 1.9 | Mart before Brock | CLOSED + server unlock hint, purchase 403 | PASS (auto — mart lock tests) |
| 1.10 | Mart after Brock | Stock listed with prices (incl. Hyper Potion 1200); buy Potion → coins down, inventory up, atomically | PASS (auto — purchase/rollback tests) |

## 2. Levels 2–8 gym path

| # | Step | Expected | Status |
|---|------|----------|--------|
| 2.1 | Level 2 entry via hub Continue | `/level/2` plays after Level 1 done; locked (403 + locked screen) before | PASS (auto — progress lock tests) + MANUAL for the screen |
| 2.2 | Misty → Giovanni | Aces rise 19 → 22 → 27 → 35 → 39 → 45 → 48; roads within ±3 of the carry level | PASS (sim + content test "gym boss aces outlevel...") |
| 2.3 | Reward pools 2–8 | Pool levels ≈ next level's road tier; source `gym_boss` | PASS (auto — content pool test; levels re-tuned this phase) |
| 2.4 | Evolution pacing | Starter hits Lv 16 during Level 2–3 (first evolution); stones buyable after Brock (800c) | PASS (sim ladder) + PASS (auto — evolution threshold tests) |
| 2.5 | Level-up evolution confirm | Pending list on hub; confirm evolves, chain evolutions re-listed; party strip updates | PASS (auto — `evolutionService.test.js`) + MANUAL for hub UI |

## 3. Level 9 — Elite Four + Champion

| # | Step | Expected | Status |
|---|------|----------|--------|
| 3.1 | E4 order | Lorelei → Bruno → Agatha → Lance → Blue, progress-locked | PASS (auto — content test) |
| 3.2 | E4 wins | 300 coins each (Phase 11), **no** reward offers | PASS (auto — "elite_four win creates no offer but pays boss coins") |
| 3.3 | Champion win | 300 coins + 3-card offer from the champion pool (Lapras/Snorlax/... at 58–59) | PASS (auto — champion offer test) |
| 3.4 | Difficulty | Carry enters E4 at ~Lv 48 vs aces 52–58 (+4…+5); Hyper Potions affordable (~6100 coins by then) | PASS (sim) |

## 4. Level 10 — Legendary Gauntlet

| # | Step | Expected | Status |
|---|------|----------|--------|
| 4.1 | Encounters | Articuno 58, Zapdos 60, Moltres 62, Mew 64, Mewtwo 66; wild intro text, Pokémon-only presentation | PASS (auto — content/hydration tests) + MANUAL for the intro text |
| 4.2 | Each legendary win | 300 coins + an offer from the shared legendary pool (claim beaten legendaries) | PASS (auto — legendary offer test) |
| 4.3 | Refresh after a mid-level legendary win | Re-entering `/level/10` surfaces the unclaimed offer before the next battle | MANUAL (flow rewired this phase) |
| 4.4 | Finish Mewtwo | Level complete → "Champion of Kanto"; hub shows campaign complete | MANUAL |

## 5. Battle mechanics regression

| # | Step | Expected | Status |
|---|------|----------|--------|
| 5.1 | Move / switch / item / multi-enemy send-out | Server-authoritative; voluntary switch and item cost the turn; forced switch free | PASS (auto — battle session suite) |
| 5.2 | Item edge cases | Stone in battle 400; item on fainted mon 400; full-HP heal 400; all in-log, no crash | PASS (auto) + MANUAL for the in-log rendering |
| 5.3 | Empty / all-fainted party | Battle start 400 with clear message; error screen offers "Back to hub" | PASS (auto — start rejection tests) + MANUAL for the screen |
| 5.4 | Refresh mid-battle | Same session resumes (in-memory); after a backend restart the battle restarts cleanly at the same progress | PASS (auto — resume test) + MANUAL |
| 5.5 | Losses | No XP, no coins, no progress; "Battle Again" restarts | PASS (auto — loss tests) |
| 5.6 | XP/level-up/evolution events | Rendered in log + win summary; level-ups persist to the next battle snapshot | PASS (auto) + MANUAL for rendering |

## 6. Economy sanity (full run)

- Income over a full first-time clear: 500 start + 32 road × 100 + 13 boss-type × 300 = **9,100 coins** (sim).
- Meaningful sinks: Potion 100 / Super 250 / **Hyper 1200 (new)** / stones 800. Buying 1 stone + ~4 Hypers + assorted potions ≈ 6,500 — heals stay affordable, stones stay a real decision. Stones never come free.

## Known balance soft spots (honest)

1. **Brock (+7) and Misty (+6)** outlevel the deterministic carry. Deliberate FireRed-style early walls: the seeded starter has strong raw stats, Level-1 reward cards include Pikachu (Misty counter), and potions cost 100 with ~1,200 coins banked by Misty. A Charmander pick makes both noticeably harder (authentic, but worth watching).
2. **Claimed reward mons are stat-lean vs the starter**: hydrated stats (`statAtLevel`) grow ~2/level while the starter's seeded base stats + level-up increments compound. Claims are breadth/type coverage, not raw upgrades — pool levels were raised so they stay fieldable, but a starter-carry meta is expected.
3. **XP funnels to the active-at-win mon**: spreading XP across 3 mons drops everyone ~15 levels below the carry ladder late game. Items + claims compensate; a shared-XP rule would be a Phase 12 decision.
4. **Battle-engine Python XP helpers still use the cubic curve** — unused by the campaign win path (backend owns XP), left untouched to avoid engine churn. Divergence documented in `xpService.js` and `backend/data/README.md`.
5. **In-memory battle sessions** — a backend restart mid-battle still drops the session (restart battle path covers it). Future work note, unchanged this phase.
