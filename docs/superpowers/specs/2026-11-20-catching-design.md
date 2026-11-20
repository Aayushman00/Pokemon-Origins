# Catching wild Pokémon

Status: approved 2026-11-20 (user: "add these first make their plans then verify it and start implementing on native mode"). Fills the never-built catch row of `docs/superpowers/plans/overworld-architecture.md`.

## Intent

The overworld is FireRed-style and its wild-encounter spec says "you catch wild Pokémon", but nothing catches yet: wild battles can only be won (XP) or fled. This adds Poké Balls and a server-rolled catch, so the 84 wild species can be owned.

## Approaches

- **FireRed classic (picked).** Balls are bag items bought at the Mart; the server rolls the Gen 3 formula; odds rise as HP falls and with a status. Familiar, and it makes weakening a Pokémon matter.
- Guaranteed catch / one per route. Simpler, but throws away the "lower its HP first" play and the reason to buy better balls.
- Client-side roll. Cheaper, but anyone could catch anything; the server already owns every battle number, so it owns this too.

## Rules (user's)

- **Balls:** Poké Ball, Great Ball, Ultra Ball are bag items sold at the Mart. A few free Poké Balls come with the starter.
- **Catch action, wild battles only:** the server rolls the Gen 3 formula (catch rate × HP left × status bonus × ball bonus) and returns 0 to 3 shakes plus caught or broke free. The client only plays the animation.
- **On catch:** the Pokémon joins the party, or goes to the PC if the party is full. It keeps its current HP. The battle ends as a win with no XP.
- **Failed throw:** uses your turn; the wild Pokémon gets a free attack.
- **Off-limits:** trainer battles, PvP and gym battles never allow catching, checked on the server.
- **Behind a `CATCH` flag**, gated the same way as `OVERWORLD`.

## Corrections the code forced (my calls)

- **Party cap is 3, not 6.** `partyService.MAX_PARTY = 3`. "Party is full" means 3; the 4th catch goes to the PC.
- **Status is not kept.** Battle status (brn/par/psn/slp/frz) is session-only for every Pokémon in this game (`snapshotPokemon` starts it clean, the DB `status` column is cosmetic). A caught Pokémon is stored "Healthy", like everything else. HP and move PP are kept.
- **Catch rates are not in the repo.** They are fetched once from PokeAPI (`pokemon-species/{1..151}.capture_rate`) into `backend/data/catch_rates.json` and committed; the server never calls PokeAPI during a battle.

## Details (my calls)

- **Gen 3 formula.** `a = floor(((3·maxHP − 2·HP) · rate · ball) / (3·maxHP)) · status`, status ×2 for slp/frz, ×1.5 for par/psn/brn. `a ≥ 255` catches outright (3 shakes). Otherwise `b = floor(1048560 / sqrt(sqrt(16711680 / a)))` and up to four checks `random·65536 < b`; caught when all four pass. Shakes shown = passed checks, capped at 3.
- **Ball bonus:** Poké 1, Great 1.5, Ultra 2. Prices as FireRed: 200, 600, 1200.
- **Item ids** 9, 10, 11, category `"ball"`, `usableInBattle: true`, `usableOverworld: false`.
- **Starter gift:** 5 Poké Balls when the starter is chosen, only while `CATCH` is on. Trainers who chose earlier buy them at the Mart.
- **Flag off:** balls are not sold, not gifted, and a catch action is refused (403). Balls already owned stay in the bag.
- **Session status `"caught"`.** Ends the battle: party HP/PP persist as after any battle; no XP, no coins, no history row (wild battles record none).
- **The ball is spent before the roll.** If saving the caught Pokémon fails, the ball is refunded and the battle continues (error shown).
- **Caught Pokémon:** species name as nickname, its level, battle stats, current HP, its moves with current PP, its rolled gender, experience 0.
- **Messages (FireRed):** 0 shakes "Oh no! The Pokémon broke free!", 1 "Aww! It appeared to be caught!", 2 "Aargh! Almost had it!", 3 "Shoot! It was so close, too!", caught "Gotcha! NAME was caught!" plus "NAME was sent to the PC." when the party was full.
- **Bag screen:** a third pocket, "Balls".

## Non-goals

Nicknaming on catch, special balls (Net, Dusk, Timer…), critical captures, Pokédex caught flags, catching in Move Lab.

## Left to the builder

The ball sprite/wobble look (CSS), exact copy on the result panel beyond the lines above.
