-- Battle fidelity (Phase 14): backfill move PP (trainer schema).
-- Apply after pokedex_data.sql and 001-005. Safe to re-run (idempotent
-- UPDATE — only touches rows that are still 0/NULL).
--
-- Why: hydrate-created trainer_pokemon_moves rows (reward claims before
-- Phase 14) stored current_pp = 0 because the hydrated learnset carried no
-- PP; starters already carry real PP from starterStats. Now that battles
-- spend PP and persist it at battle end, a 0 would read as "move is out of
-- PP" and force Struggle, so pre-existing rows are topped up to the
-- pokedex.Move base PP once. No schema change.

USE `trainer`;

UPDATE `trainer_pokemon_moves` tpm
JOIN `pokedex`.`Move` m ON m.move_id = tpm.move_id
SET tpm.current_pp = m.pp
WHERE tpm.current_pp IS NULL OR tpm.current_pp = 0;
