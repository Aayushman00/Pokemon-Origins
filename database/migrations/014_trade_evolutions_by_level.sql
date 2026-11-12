-- database/migrations/014_trade_evolutions_by_level.sql
-- There is no trading, so the four Gen 1 trade evolutions (Kadabra, Machoke,
-- Graveler, Haunter) happen at Lv 37 like any level-up evolution.
-- Apply after 013. Re-runnable (only rows still marked 'trade' change).
-- Rollback: UPDATE `pokedex`.`Evolution` SET `evolution_method` = 'trade', `evolution_condition` = ''
--           WHERE `base_pokemon_id` IN (64, 67, 75, 93);

USE `pokedex`;

UPDATE `Evolution` SET `evolution_method` = 'level-up', `evolution_condition` = 'Level 37'
WHERE `evolution_method` = 'trade' AND `base_pokemon_id` IN (64, 67, 75, 93);
