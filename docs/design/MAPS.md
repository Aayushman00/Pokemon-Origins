# Maps: authoring guide

How a map gets from source to the running game. Everything here is enforced by `npm run validate:maps` unless marked otherwise.

## Pipeline

```
scripts/overworld_art/*.py  or  Tiled
        │  writes
        ▼
frontend/public/maps/<id>.json        Tiled JSON, the single source of truth
        │
        ├─ client: mapStore.js → parseTiledMap() → engine
        │
        └─ npm run maps:index → backend/data/world/maps.index.json → backend/src/world/maps.js
```

The server index exists because `backend/` is its own Docker build context and cannot read `frontend/public`. It holds only what the server checks: size, collision, connections and warps. Never edit it by hand.

After changing any map:

```bash
npm run maps:index      # validate, then rewrite the server index
npm run validate:maps   # validate, and fail if the index is stale
```

Commit the map and the index together. A stale index also fails `frontend` tests.

Maps built by a Python script are overwritten by `python3 -m scripts.overworld_art.build_all`, so change the script, not the JSON. `scripts/overworld_art/README.md` lists which script owns which map.

## File format

Tiled JSON: orthogonal, finite, 16x16 tiles, embedded tilesets, uncompressed layer data. Tile flips are not supported.

Every map needs a tileset named `collision` as well as its art tileset.

### Tile layers

| Layer | Purpose |
|---|---|
| `ground` | Required. Base terrain |
| `decor` | Flat detail on the ground |
| `objects` | Things at actor level, such as building walls |
| `above` | Drawn over actors, such as roofs and tree tops |
| `collision` | Not drawn. See below |

Tile properties in the tileset: `animation` (standard Tiled frames) and `cover` (int: the pixel row from which the tile is drawn again over an actor standing on it, used by tall grass).

### Collision layer

Tile order in the `collision` tileset gives the value used by the engine and the server index:

| Tileset tile | Value | Meaning |
|---:|---:|---|
| none | 0 | Free |
| 0 | 1 | Solid |
| 1 | 2 | Ledge, hop down |
| 2 | 3 | Ledge, hop left |
| 3 | 4 | Ledge, hop right |
| 4 | 5 | Ledge, hop up |

### Object layers

All objects must sit inside the map.

| Layer | Properties |
|---|---|
| `warps` | Required: `targetMap`, `targetX`, `targetY`. Optional: `kind` (`door`), `facing`, `enterDir` (only fires when moving this way), `transition` (`iris`, `fade`, `none`). Must land on a free tile |
| `npcs` | Point object. `script` required. `sprite` must be a sheet in `render/sheets.generated.js` (default `npc`), `facing` a direction. `kind: legendary` needs `dex` instead of a sheet. The tile must be blocked in `collision`. A trainer also has `trainer` (campaign id), `order` (1, 2, 3... along the road) and `sight` (tiles) |
| `signs` | `text` or `script` |
| `triggers` | `when`: `step`, `enter` or `flag` (`flag` needs a `flag` property). `script` required. Optional: `requires` (flag), `once` |
| `encounters` | `table` required |

### Scripts

A `script` is a JSON array of ops, stored as a string property: `say`, `give`, `setFlag`, `requireFlag`, `heal`, `battle`, `cry`, `warp`, `shop`, `cutsceneMove`. `logic/script.js` defines the fields of each. Ops that change game state are requests the server must confirm.

### Map properties

| Property | Meaning |
|---|---|
| `connect_north`, `connect_south`, `connect_east`, `connect_west` | Map id joined at that edge, with no fade |
| `connect_<side>_offset` | Tiles the neighbour's origin is shifted along the shared edge (x for north/south, y for east/west) |
| `border` | Local tile id `a`, or `a,b,c,d` for a 2x2 block, drawn outside an edge with no connection. Omit it for black, as in interiors |
| `nameKey` | Key in `places` of `backend/data/world/names.json` |
| `entry` | The edge the player arrives on (`north`, `south`, `east`, `west`). Required on any map with trainers |

Connections must be reciprocal with opposite offsets. Every tile a player can step off along a connected edge must meet a non-solid tile on the other map, and each connected edge needs at least one open tile.

Every door, arrival tile and connected edge must be reachable on foot from the others. Each trainer's sight must cut the road: walking from `entry` to any other open edge without crossing it fails validation, and so does reaching a trainer's sight before the previous trainer's.

## Conventions

- Map ids are lowercase with underscores: `<town>`, `<town>_gym`, `<town>_center`, `<town>_mart`, `route_<n>`.
- Towns are 30x20 tiles, as drawn in the Aurelia Town Layouts artifact. Routes follow `scripts/overworld_art/route_layouts.json`, the approved Aurelia Route Layouts.
- `scripts/overworld_art/world_maps.py` paints both from text grids. A new town is a grid plus its doors.
- Display names live in `backend/data/world/names.json`, not in map files.
- New art is original or CC0 and is recorded in `assets/LICENSES.md`.

## Not checked

- Ledge direction. Reachability treats ledges as two-way.
- Whether `encounters` tables, flags and `battle` trainer ids exist.
