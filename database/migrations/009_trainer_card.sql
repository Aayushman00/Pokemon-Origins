-- database/migrations/009_trainer_card.sql
-- Trainer card customization: colour theme, a short motto, and a favourite
-- Pokémon (any the trainer owns, party or PC). One optional row per
-- trainer; no row means the default card. Apply after 008. Re-runnable.

USE `trainer`;

CREATE TABLE IF NOT EXISTS `trainer_card` (
  `trainer_id` INT NOT NULL,
  `theme` VARCHAR(16) NOT NULL DEFAULT 'sky',
  `motto` VARCHAR(40) NULL,
  `favorite_pokemon_row_id` INT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`trainer_id`),
  CONSTRAINT `trainer_card_trainer_fk` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
