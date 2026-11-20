# Playground: Mart stall, park wild Pokémon by time of day, battle stands

Status: approved 2026-11-20. User: "A, go with your defaults and make the plan"; "legendaries stay out … there should be rarity such that last level of evolutions appear very rarely".

## Intent

The Playground is where trainers meet. Give them reasons to stay: buy Poké Balls without leaving, catch the Pokémon the overworld holds back, and watch each other's PvP battles. What appears, and how the park looks, follows a real clock instead of the site's dark theme.

## Approaches (wild Pokémon)

- **A. Tall-grass patch, per player (picked).** Walking in the park's grass can start a wild battle for that trainer alone, like a route. Reuses wild battles and catching; only a time-of-day table is new.
- B. Shared visible spawns. More social, about twice the work (spawn manager, sync, races), and it turns a rare final into a race.

## Rules (user's)

- **Park species:** the 62 the overworld never offers: starter bases 1/4/7, starter middles 2/5/8, and the 56 final evolutions. **Legendaries (144, 145, 146, 150, 151) stay out.**
- **Final evolutions are very rare.**
- **Time of day decides what appears**, not a UI setting.
- **Mart in the Playground** that sells Poké Balls and the rest of the catching kit.
- **Watch other trainers battle;** **at most 5 battles at once per room.**

## Decisions (my defaults, approved)

### Time of day
- The server clock decides, so the whole room shares one sky: **day 06:00–17:59, night 18:00–05:59, server local time.**
- `room:init` carries `time`; the server broadcasts `world:time` when it flips (checked once a minute).
- The park's night tint follows that, not `data-theme`. The overworld keeps its fixed per-map time (2026-11-04 ruling).

### Park wild table (`backend/data/encounters/park.json`)
- Two tables, `day` and `night`. Each has all six starter-line species plus its own set of finals.
- **Night finals (13):** 20 Raticate, 24 Arbok, 36 Clefable, 40 Wigglytuff, 42 Golbat, 49 Venomoth, 53 Persian, 65 Alakazam, 89 Muk, 94 Gengar, 97 Hypno, 105 Marowak, 110 Weezing.
- **Day finals (43):** the other 43 of the 56.
- **Shares per table:** starter bases 60%, starter middles 30%, finals 10% split evenly. With N finals in a table: base weight 2N each, middle weight N each, final weight 1 each (day totals 430, night 130). One encounter in ten is some final; any one day final is about 0.23%. The weights are data, tunable without code.
- **Levels follow the trainer (user picked option B, 2026-11-20).** T = the highest level in the trainer's party.
  - Finals: Lv max(10, T) to max(10, T) + 3, capped at 100.
  - Bases: T−3 to T−1, clamped to 2–15, so they stay below their evolution at 16.
  - Middles: T−3 to T−1, clamped to 2–31, so they stay below Ivysaur's 32.
  - A rare final is a strong teammate, not a free win. There is no obedience system, so this is the guard.
- `park.json` slots carry `stage` ("base" | "middle" | "final"), not levels. The server works out the levels per battle once it has loaded the party.
- **Encounter chance per grass step:** the overworld's `WILD_CHANCE` (0.1).
- **Gating:** park battles need the `CATCH` flag and a signed-in trainer. They don't need `OVERWORLD`, and campaign progress doesn't matter. The client sends `wild: "playground"`; the server picks `day` or `night` from its own clock.
- **Grass patch:** the `g` patch already drawn at x 29–34, y 16–19. The map build adds `encounters` zones over its runs with `table: "playground"`.
- **Flag on the client:** `room:init` carries `catch` (the server's `CATCH` flag); guests and flag-off rooms never roll encounters.

### Mart stall
- The barrel and crate at (32, 9)–(32, 10) become a "Mart stall" spot. Facing it and pressing A opens the existing Mart screen in a modal.
- Same stock, prices and coins as the town Mart; balls show only while `CATCH` is on.
- Leaving the Playground page would drop the socket, so the Mart opens over it, never as a navigation.

### Battle stands
- The two benches become "stands". Facing one and pressing A lists live matches: names and round.
- Pick one to watch it turn by turn in the battle screen, read-only. Leave any time; the match ends on its own.
- **Spectators see:** both active Pokémon (species, level, HP, status) and every event as it happens. They don't see either side's moves or reserve HP until used, the same hiding as the opponent view.
- **Cap:** at most 5 matches per room. A challenge (or an accept) past that gets "The stadium is full — wait for a battle to finish".
- Guests may watch.

### While in a park battle
- An incoming PvP challenge is declined automatically by the client; the challenger sees the usual decline notice.

## Non-goals

More than one room, shared spawns, shinies, betting, chat inside the stands, spectating the overworld.

## Left to the builder

Copy for the stands list and the spectator header, how the watch list refreshes (live push is fine), and CSS.
