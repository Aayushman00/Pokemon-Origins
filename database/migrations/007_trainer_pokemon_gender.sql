-- database/migrations/007_trainer_pokemon_gender.sql
-- Battle UI redesign: per-owned-Pokémon gender (trainer schema).
-- Apply after 001-006. Nullable: existing rows read back NULL (no gender shown
-- in the UI). Only genderService.rollGenderForSpecies, called once from
-- partyService.addPokemon at creation time, ever assigns a value. No backfill:
-- pre-existing party members simply show no gender symbol. Re-runnable via
-- information_schema check (MySQL 8 compatibility).

USE `trainer`;

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'trainer' AND TABLE_NAME = 'trainer_pokemon' AND COLUMN_NAME = 'gender'
);
SET @ddl := IF(@has_col = 0,
  'ALTER TABLE `trainer_pokemon` ADD COLUMN `gender` ENUM(\'male\',\'female\',\'genderless\') NULL AFTER `status`',
  'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
