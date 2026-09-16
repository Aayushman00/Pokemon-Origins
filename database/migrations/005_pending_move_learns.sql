-- Move learning: pending "wants to learn" offers (trainer schema).
-- Apply after pokedex_data.sql has created `trainer.trainer_pokemon`.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS).
--
-- A row is created on a level-up win when the learnset (pokedex.Pokemon_Move)
-- teaches a move but the mon already knows 4 — the trainer must forget one
-- or skip via POST /api/moves/learn. Rows survive refresh; the UNIQUE key
-- makes offer creation idempotent per (mon, move, level). Auto-learns
-- (< 4 moves) never create rows here.

USE `trainer`;

CREATE TABLE IF NOT EXISTS `trainer_pending_move_learns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainer_id` int NOT NULL,
  `trainer_pokemon_id` int NOT NULL,
  `move_id` int NOT NULL,
  `learned_at_level` int NOT NULL,
  `status` enum('pending','resolved') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pending_move_learn` (`trainer_pokemon_id`, `move_id`, `learned_at_level`),
  KEY `idx_pending_by_trainer` (`trainer_id`, `status`),
  CONSTRAINT `fk_pending_learn_trainer`
    FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_pending_learn_mon`
    FOREIGN KEY (`trainer_pokemon_id`) REFERENCES `trainer_pokemon` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
