-- Phase 7: per-trainer inventory (trainer schema).
-- Apply after pokedex_data.sql has created `trainer.trainers`.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS).
--
-- Item stats (name, category, heal amount, usage rules) live in
-- backend/data/items.json — the DB stores quantities only, keyed by the
-- catalog itemId. The legacy `trainer.inventory` table from the original
-- dump (name-keyed, no uniqueness) stays unused.

USE `trainer`;

CREATE TABLE IF NOT EXISTS `trainer_inventory` (
  `trainer_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`trainer_id`, `item_id`),
  CONSTRAINT `fk_inventory_trainer_id`
    FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
