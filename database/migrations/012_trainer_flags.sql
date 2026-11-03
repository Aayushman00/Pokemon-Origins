-- database/migrations/012_trainer_flags.sql
-- Per-trainer story/world flags (overworld events, defeated trainers, one-shot
-- triggers). Server-owned: the client never writes these directly.
-- Apply after 001-009. Re-runnable (CREATE TABLE IF NOT EXISTS).
-- Rollback: DROP TABLE `trainer_flags`; nothing else references it.

USE `trainer`;

CREATE TABLE IF NOT EXISTS `trainer_flags` (
  `trainer_id` INT NOT NULL,
  `flag` VARCHAR(64) NOT NULL,
  `set_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`trainer_id`, `flag`),
  CONSTRAINT `trainer_flags_trainer_fk` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
