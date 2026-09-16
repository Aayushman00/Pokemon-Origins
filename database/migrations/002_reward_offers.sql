-- Phase 6: boss reward card offers (trainer schema).
-- Apply after pokedex_data.sql has created `trainer.trainers`.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS).

USE `trainer`;

-- One offer per trainer per boss battle (UNIQUE enforces one-time creation).
CREATE TABLE IF NOT EXISTS `reward_offers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainer_id` int NOT NULL,
  `level` int NOT NULL,
  `battle_number` int NOT NULL,
  `session_id` varchar(64) NOT NULL,
  `source` varchar(32) NOT NULL DEFAULT 'gym_boss',
  `status` varchar(16) NOT NULL DEFAULT 'pending',
  `claimed_option_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_offer_per_battle` (`trainer_id`, `level`, `battle_number`),
  CONSTRAINT `fk_reward_offer_trainer`
    FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Server-authored option snapshots: the claim never trusts client stats.
-- `types_json` / `moves_json` hold JSON arrays (types; {move_id, pp} rows).
CREATE TABLE IF NOT EXISTS `reward_offer_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `offer_id` int NOT NULL,
  `option_index` int NOT NULL,
  `pokemon_id` int NOT NULL,
  `nickname` varchar(50) NOT NULL,
  `level` int NOT NULL,
  `max_hp` int NOT NULL,
  `current_hp` int NOT NULL,
  `attack` int NOT NULL,
  `defense` int NOT NULL,
  `speed` int NOT NULL,
  `special_atk` int NOT NULL,
  `special_def` int NOT NULL,
  `types_json` text,
  `moves_json` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_option_index` (`offer_id`, `option_index`),
  CONSTRAINT `fk_reward_option_offer`
    FOREIGN KEY (`offer_id`) REFERENCES `reward_offers` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
