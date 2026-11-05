-- database/migrations/013_world_state.sql
-- Where each trainer stands in the overworld, and where they last healed (a
-- lost battle sends them back there). One row per trainer, either half may be empty.
-- Apply after 012. Re-runnable (CREATE TABLE IF NOT EXISTS).
-- Rollback: DROP TABLE `trainer_world_state`; nothing else references it.

USE `trainer`;

CREATE TABLE IF NOT EXISTS `trainer_world_state` (
  `trainer_id` INT NOT NULL,
  `map_id` VARCHAR(48) DEFAULT NULL,
  `x` SMALLINT DEFAULT NULL,
  `y` SMALLINT DEFAULT NULL,
  `facing` VARCHAR(5) DEFAULT NULL,
  `heal_map_id` VARCHAR(48) DEFAULT NULL,
  `heal_x` SMALLINT DEFAULT NULL,
  `heal_y` SMALLINT DEFAULT NULL,
  PRIMARY KEY (`trainer_id`),
  CONSTRAINT `trainer_world_state_trainer_fk` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
