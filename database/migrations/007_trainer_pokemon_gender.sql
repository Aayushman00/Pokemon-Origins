-- database/migrations/007_trainer_pokemon_gender.sql
-- Battle UI redesign: per-owned-Pokémon gender (trainer schema).
-- Apply after 001-006. Safe to re-run (ADD COLUMN IF NOT EXISTS, MySQL 8).
--
-- Nullable: existing rows read back NULL (no gender shown in the UI) --
-- only genderService.rollGenderForSpecies, called once from
-- partyService.addPokemon at creation time, ever assigns a value. No
-- backfill: pre-existing party members simply show no gender symbol.

USE `trainer`;

ALTER TABLE `trainer_pokemon`
  ADD COLUMN IF NOT EXISTS `gender` ENUM('male','female','genderless') NULL AFTER `status`;
