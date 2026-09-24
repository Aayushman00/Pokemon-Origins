-- database/migrations/008_trainer_pokemon_pc.sql
-- PC storage: a trainer_pokemon row is either in the party (in_pc = 0,
-- position 1..3) or stored in the PC (in_pc = 1, position = box order).
-- Apply after 001-007. Existing rows default to the party, so current saves
-- are unchanged. Re-runnable: MySQL 8 has no ADD COLUMN IF NOT EXISTS, so
-- the ALTER is guarded through information_schema.

USE `trainer`;

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'trainer' AND TABLE_NAME = 'trainer_pokemon' AND COLUMN_NAME = 'in_pc'
);
SET @ddl := IF(@has_col = 0,
  'ALTER TABLE `trainer_pokemon` ADD COLUMN `in_pc` TINYINT(1) NOT NULL DEFAULT 0 AFTER `position`',
  'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
