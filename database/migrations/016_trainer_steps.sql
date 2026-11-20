-- database/migrations/016_trainer_steps.sql
-- Steps walked in the Playground, counted only from server-validated moves
-- (backend/src/playground/movement.js validateStep, buffered by services/stepService.js).
-- Apply after 015. Re-runnable (CREATE TABLE IF NOT EXISTS).
-- Rollback: DROP TABLE `trainer_steps`; nothing else references it.

USE `trainer`;

CREATE TABLE IF NOT EXISTS `trainer_steps` (
  `trainer_id` INT NOT NULL,
  `steps` BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`trainer_id`),
  CONSTRAINT `fk_trainer_steps_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
