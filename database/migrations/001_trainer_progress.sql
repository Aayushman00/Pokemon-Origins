-- Phase 2: persistent campaign progression (trainer schema).
-- Apply after pokedex_data.sql has created `trainer.trainers`.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS).

USE `trainer`;

CREATE TABLE IF NOT EXISTS `trainer_progress` (
  `trainer_id` int NOT NULL,
  `current_level` int NOT NULL DEFAULT 1,
  `current_battle` int NOT NULL DEFAULT 1,
  `unlocked_level` int NOT NULL DEFAULT 1,
  `status` varchar(32) NOT NULL DEFAULT 'in_progress',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`trainer_id`),
  CONSTRAINT `fk_progress_trainer`
    FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
