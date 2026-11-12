# Wild encounters: what appears where

Status: approved 2026-11-12, with trade evolutions changed to Lv 37. Nothing built yet.

## Intent

The game is becoming a FireRed-style overworld where you catch wild Pokémon. Every patch of grass should feel different from the last one, most of the Pokédex should be catchable, and no wild Pokémon should be a fully evolved powerhouse. Final stages are earned by raising and evolving your own.

## Rules (user's, then mine)

- **No final stages in the wild** (user). The 56 Pokémon that are the last stage of a chain (Raticate, Fearow, Golbat, Alakazam, ...) never appear in grass or water.
- **Use most of the Pokédex** (user). The dex is Gen 1 (151). Every species that may appear in the wild under these rules appears at least once: **84 of 84**. The 56 final stages come from evolving, so 146 of 151 can be owned. The 5 legendaries stay in the legendary cave and lair plans.
- **Variety** (user). Each route has its own cast, 7 to 14 species per table. No species takes more than 30% of a table. Repeats only happen when a species makes sense on a later route too (mostly middle stages and rare single-stage Pokémon on Routes 8 and 9).
- *My call:* **starter lines (Bulbasaur, Charmander, Squirtle and their middle stages) are not wild**, as in FireRed. They come only from the professor.
- *My call:* **Pokémon with no evolution can appear** (Farfetch'd, Onix, Scyther, Tauros, Lapras, Snorlax, ...). They are not "final stages", but the strong ones (base stat total 490 and up) are rare (1 to 6%) and only on later routes.
- **Trade evolutions become level evolutions** (user). Kadabra, Machoke, Graveler and Haunter evolve at **Lv 37** (level is my call: one number, reached around Gyms 6-7, where trainers are Lv 34-41) into Alakazam, Machamp, Golem and Gengar.
- *My call:* **a wild Pokémon is always below the level at which it would evolve by levelling.** No Lv 44 Rattata. Pokémon that evolve by stone have no cap. Because of the Lv 37 change, Kadabra, Machoke, Graveler and Haunter are wild only up to Lv 36 (Routes 5-7). Late routes lean on stone evolvers (Gloom, Weepinbell, Poliwhirl, Nidorina, Nidorino, Growlithe, Vulpix, Shellder) and rare single-stage Pokémon.
- *My call:* **levels stay in the bands the routes already use**, which sit a few levels under that route's trainers.

## Route by route

Each route sits between two towns. The table leans on the route's look (from its map ambience) and always offers at least one good pick against the next Gym.

| Route | From → to | Look | Next Gym | Counters on offer |
|---|---|---|---|---|
| 1 | Dawnbrook → Mossgate | forest | Grass | Pidgey, Caterpie, Weedle |
| 2 | Mossgate → Hearthfield | meadow, pond | Normal | Mankey |
| 3 | Hearthfield → Ironbrook | wooded hills | Fighting | Spearow, Zubat, Abra |
| 4 | Ironbrook → Saltmere | dusty coast | Water | Exeggcute, Pikachu, Tangela |
| 5 | Saltmere → Dynamo | rubble canyon | Electric | Diglett, Cubone, Rhyhorn, Graveler, Onix |
| 6 | Dynamo → Gale Spire | wooded slopes | Flying | (Route 5's rock and electric picks), Pidgeotto |
| 7 | Gale Spire → Starfall | night marsh | Psychic | Haunter, Scyther, Pinsir |
| 8 | Starfall → Emberhold | volcanic | Fire | Rhyhorn, Onix, Poliwhirl |
| 9 | Emberhold → Zenith | snowy summit | League | Shellder, Jynx, Dragonair, rare single-stage |

Notes on the flavour:
- Route 1 is the classic opener: Pidgey and Rattata common, bug catchers, Nidoran pair uncommon, a 2% Pikachu.
- Route 2's meadow has the grass-poison pair, cocoons, Jigglypuff and a rare Clefairy. Its pond holds the first water Pokémon.
- Route 3 is the widest early mix (11 species): birds, Zubat, rock and ground types, Machop on the way to the Fighting town, rare Abra and a 1% Eevee.
- Route 4's shore has the harbour's water Pokémon and the rare finds: Omanyte and Kabuto (3% each) and Dratini (2%).
- Route 5 is the ground-type canyon before the Electric Gym, plus Magnemite and Voltorb from the power station.
- Route 6 has Ponyta, Grimer and Koffing near the city, Machoke (6%), and the rare normal types (Chansey, Kangaskhan, Porygon).
- Route 7 is night-themed: Haunter and Kadabra (up to Lv 36), Slowpoke, Clefairy near the observatory (Moon Stones), and Scyther and Pinsir. Its marsh holds Lapras at 5%.
- Route 8 is the fire route, with Growlithe and Vulpix, Magmar, Poliwhirl in the hot springs, and 2% Aerodactyl and Snorlax.
- Route 9 is a Victory Road-style mix: Shellder and Jynx in the snow, Dragonair, the grass and poison middle stages, and the rarest single-stage Pokémon again.

## What the builder changes

1. **Table format.** Today a table is `{ minLevel, levels, species[] }` and the server picks a species uniformly. It becomes weighted slots, each with an optional level range of its own:
   ```json
   "route_5": { "minLevel": 5, "levels": [24, 29], "slots": [
     { "id": 81, "weight": 18 },
     { "id": 104, "weight": 15, "levels": [24, 27] }
   ] }
   ```
   `defaultGetWildBattle` in `backend/src/services/battleSessionService.js` rolls by weight, then a level inside the slot's range (or the table's). Keep `minLevel` and the "road is not open yet" check as they are.
2. **Three new water tables**: `route_2_pond`, `route_4_shore`, `route_7_marsh`. Each needs encounter zones in that route's map, placed on the shore or reed tiles beside water, with `table` set to the new id. FireRed uses Surf and fishing for these. Grass-like reeds at the shoreline get water Pokémon in now; fishing rods can take them over later.
3. **A check that keeps the rules true** (a test next to the content tests): table weights sum to 100, no final stage, no legendary or starter line, no wild level at or above the species' level evolution, every eligible species appears somewhere.
4. **Trade evolutions to Lv 37.** The four `Evolution` rows with method `trade` (64→65, 67→68, 75→76, 93→94) become `level-up` / `Level 37`, through a new database migration, also added to the MySQL init list in `docker-compose.yml`. The level-up evolution check in the backend then offers them like any other. Gym leaders and trainers who already use Alakazam, Machamp, Golem or Gengar stay as they are.

## Left open (not part of this design)

- **Evolution stones.** Many species here rely on stones (Eevee, Vulpix, Growlithe, Clefairy, Nidorina, Gloom, ...). Stones need to be buyable or findable before these evolutions mean anything.
- **Lapras and Snorlax** could instead be one-off encounters you see standing in the world, as in FireRed. That would take them out of these tables.
- Catching (Poké Balls, throw animations) and the bag are a separate design.

## Tables

Odds are the chance per encounter in that table. Levels are inclusive.

### Route 1 grass (Lv 2-5)
| Pokémon | Type | Odds | Levels |
|---|---|---|---|
| #016 pidgey | Normal,Flying | 30% | 2-5 |
| #019 rattata | Normal | 30% | 2-5 |
| #010 caterpie | Bug | 14% | 2-5 |
| #013 weedle | Poison,Bug | 14% | 2-5 |
| #029 nidoran-f | Poison | 5% | 2-5 |
| #032 nidoran-m | Poison | 5% | 2-5 |
| #025 pikachu | Electric | 2% | 2-5 |

### Route 2 grass (Lv 8-12)
| Pokémon | Type | Odds | Levels |
|---|---|---|---|
| #043 oddish | Grass,Poison | 20% | 8-12 |
| #069 bellsprout | Grass,Poison | 20% | 8-12 |
| #011 metapod | Bug | 12% | 8-9 |
| #014 kakuna | Poison,Bug | 12% | 8-9 |
| #056 mankey | Fighting | 12% | 8-12 |
| #039 jigglypuff | Normal,Fairy | 10% | 8-12 |
| #046 paras | Grass,Bug | 8% | 8-12 |
| #052 meowth | Normal | 4% | 8-12 |
| #035 clefairy | Fairy | 2% | 8-12 |

### Route 2 pond (Lv 8-12)
| Pokémon | Type | Odds | Levels |
|---|---|---|---|
| #129 magikarp | Water | 50% | 8-12 |
| #060 poliwag | Water | 30% | 8-12 |
| #118 goldeen | Water | 20% | 8-12 |

### Route 3 grass (Lv 13-17)
| Pokémon | Type | Odds | Levels |
|---|---|---|---|
| #021 spearow | Normal,Flying | 15% | 13-17 |
| #041 zubat | Poison,Flying | 15% | 13-17 |
| #023 ekans | Poison | 12% | 13-17 |
| #027 sandshrew | Ground | 12% | 13-17 |
| #074 geodude | Ground,Rock | 12% | 13-17 |
| #066 machop | Fighting | 12% | 13-17 |
| #063 abra | Psychic | 8% | 13-15 |
| #030 nidorina | Poison | 5% | 13-17 |
| #033 nidorino | Poison | 5% | 13-17 |
| #083 farfetchd | Normal,Flying | 3% | 13-17 |
| #133 eevee | Normal | 1% | 13-17 |

### Route 4 grass (Lv 18-23)
| Pokémon | Type | Odds | Levels |
|---|---|---|---|
| #084 doduo | Normal,Flying | 23% | 18-23 |
| #096 drowzee | Psychic | 20% | 18-23 |
| #048 venonat | Poison,Bug | 18% | 18-23 |
| #102 exeggcute | Grass,Psychic | 12% | 18-23 |
| #092 gastly | Poison,Ghost | 10% | 18-23 |
| #025 pikachu | Electric | 8% | 18-23 |
| #114 tangela | Grass | 5% | 18-23 |
| #106 hitmonlee | Fighting | 2% | 18-23 |
| #107 hitmonchan | Fighting | 2% | 18-23 |

### Route 4 shore (Lv 18-23)
| Pokémon | Type | Odds | Levels |
|---|---|---|---|
| #072 tentacool | Water,Poison | 28% | 18-23 |
| #098 krabby | Water | 22% | 18-23 |
| #116 horsea | Water | 18% | 18-23 |
| #090 shellder | Water | 14% | 18-23 |
| #120 staryu | Water | 10% | 18-23 |
| #138 omanyte | Water,Rock | 3% | 18-23 |
| #140 kabuto | Water,Rock | 3% | 18-23 |
| #147 dratini | Dragon | 2% | 18-23 |

### Route 5 grass (Lv 24-29)
| Pokémon | Type | Odds | Levels |
|---|---|---|---|
| #081 magnemite | Electric,Steel | 18% | 24-29 |
| #100 voltorb | Electric | 18% | 24-29 |
| #104 cubone | Ground | 15% | 24-27 |
| #111 rhyhorn | Ground,Rock | 14% | 24-29 |
| #075 graveler | Ground,Rock | 12% | 24-29 |
| #095 onix | Ground,Rock | 10% | 24-29 |
| #050 diglett | Ground | 8% | 24-25 |
| #058 growlithe | Fire | 3% | 24-29 |
| #125 electabuzz | Electric | 2% | 24-29 |

### Route 6 grass (Lv 28-33)
| Pokémon | Type | Odds | Levels |
|---|---|---|---|
| #017 pidgeotto | Normal,Flying | 17% | 28-33 |
| #077 ponyta | Fire | 15% | 28-33 |
| #088 grimer | Poison | 12% | 28-33 |
| #109 koffing | Poison | 12% | 28-33 |
| #044 gloom | Grass,Poison | 10% | 28-33 |
| #070 weepinbell | Grass,Poison | 10% | 28-33 |
| #108 lickitung | Normal | 8% | 28-33 |
| #067 machoke | Fighting | 6% | 28-33 |
| #113 chansey | Normal | 4% | 28-33 |
| #115 kangaskhan | Normal | 4% | 28-33 |
| #137 porygon | Normal | 2% | 28-33 |

### Route 7 grass (Lv 33-38)
| Pokémon | Type | Odds | Levels |
|---|---|---|---|
| #093 haunter | Poison,Ghost | 18% | 33-36 |
| #064 kadabra | Psychic | 12% | 33-36 |
| #079 slowpoke | Water,Psychic | 14% | 33-36 |
| #102 exeggcute | Grass,Psychic | 12% | 33-38 |
| #035 clefairy | Fairy | 10% | 33-38 |
| #123 scyther | Flying,Bug | 6% | 33-38 |
| #127 pinsir | Bug | 6% | 33-38 |
| #124 jynx | Ice,Psychic | 5% | 33-38 |
| #132 ditto | Normal | 5% | 33-38 |
| #122 mr-mime | Psychic,Fairy | 12% | 33-38 |

### Route 7 marsh (Lv 30-34)
| Pokémon | Type | Odds | Levels |
|---|---|---|---|
| #061 poliwhirl | Water | 35% | 30-34 |
| #054 psyduck | Water | 30% | 30-32 |
| #086 seel | Water | 30% | 30-33 |
| #131 lapras | Water,Ice | 5% | 30-34 |

### Route 8 grass (Lv 38-42)
| Pokémon | Type | Odds | Levels |
|---|---|---|---|
| #058 growlithe | Fire | 16% | 38-42 |
| #037 vulpix | Fire | 16% | 38-42 |
| #111 rhyhorn | Ground,Rock | 15% | 38-41 |
| #095 onix | Ground,Rock | 14% | 38-42 |
| #061 poliwhirl | Water | 12% | 38-42 |
| #126 magmar | Fire | 6% | 38-42 |
| #132 ditto | Normal | 6% | 38-42 |
| #115 kangaskhan | Normal | 6% | 38-42 |
| #128 tauros | Normal | 5% | 38-42 |
| #142 aerodactyl | Flying,Rock | 2% | 38-42 |
| #143 snorlax | Normal | 2% | 38-42 |

### Route 9 grass (Lv 44-48)
| Pokémon | Type | Odds | Levels |
|---|---|---|---|
| #090 shellder | Water | 12% | 44-48 |
| #124 jynx | Ice,Psychic | 12% | 44-48 |
| #128 tauros | Normal | 10% | 44-48 |
| #044 gloom | Grass,Poison | 8% | 44-48 |
| #070 weepinbell | Grass,Poison | 8% | 44-48 |
| #030 nidorina | Poison | 6% | 44-48 |
| #033 nidorino | Poison | 6% | 44-48 |
| #113 chansey | Normal | 5% | 44-48 |
| #125 electabuzz | Electric | 5% | 44-48 |
| #123 scyther | Flying,Bug | 5% | 44-48 |
| #127 pinsir | Bug | 5% | 44-48 |
| #148 dragonair | Dragon | 4% | 44-48 |
| #122 mr-mime | Psychic,Fairy | 4% | 44-48 |
| #137 porygon | Normal | 4% | 44-48 |
| #131 lapras | Water,Ice | 2% | 44-48 |
| #142 aerodactyl | Flying,Rock | 2% | 44-48 |
| #143 snorlax | Normal | 2% | 44-48 |
