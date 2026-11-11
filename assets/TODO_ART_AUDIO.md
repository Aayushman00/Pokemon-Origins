# Art / audio needed from a human

## Mossgate placeholders
- [x] Gym interior: `grove` theme in `gym_art.py` (flagstones, living-wood walls, soil, seed pod, sprout, vine gate, honey runner under the Leader).
- [x] Bridge: rope handrails (`nature.rope_rail`) on every plank side over water, void or lava, added for all maps in `world_maps.bridge_rails`.

## Still to draw
- [x] Cliff tiles: the `mass` plateaus (`town_art.mass_top/mass_face`) have rims, rock faces in 3 variants and a base shadow.
- [x] Side-facing ledges: Route 1 has a hop-east drop at x=24, rows 4-6 (`world_maps.SIDE_LEDGES`, `ledge_col`).
- [x] Taller cliffs: craggy plateaus three or more rows deep show a two-tile face (`town_art.mass_face_tall`, `towns.terrain`); a shrub on that rim steps back onto the plateau.
- [~] Bump / ledge / door / push sounds: redesigned synth cues with pitch slides and low-passed noise (`battle/sfx.js`). Still synthesized; recorded sounds would need a human.
