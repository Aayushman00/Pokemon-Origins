-- database/migrations/015_pvp.sql
-- Live PvP ladder. pvp_rating: one Elo row per trainer who has played (start 1000).
-- pvp_match: every finished match; `rated` = 0 once a pair passed 3 games that UTC
-- day (services/elo.js RATED_PER_PAIR_PER_DAY). The "today" board counts rated wins.
-- Apply after 014. Re-runnable (CREATE TABLE IF NOT EXISTS).
-- Rollback: DROP TABLE `pvp_match`; DROP TABLE `pvp_rating`; nothing else references them.

USE `trainer`;

CREATE TABLE IF NOT EXISTS `pvp_rating` (
  `trainer_id` INT NOT NULL,
  `rating` INT NOT NULL DEFAULT 1000,
  `wins` INT NOT NULL DEFAULT 0,
  `losses` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`trainer_id`),
  KEY `pvp_rating_rating_idx` (`rating`),
  CONSTRAINT `pvp_rating_trainer_fk` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `pvp_match` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `a_id` INT NOT NULL,
  `b_id` INT NOT NULL,
  `winner_id` INT NULL,
  `day` DATE NOT NULL,
  `rated` TINYINT(1) NOT NULL,
  `delta` INT NOT NULL DEFAULT 0,
  `ended_by` ENUM('ko', 'forfeit', 'timeout', 'disconnect') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pvp_match_day_idx` (`day`),
  KEY `pvp_match_pair_idx` (`a_id`, `b_id`, `day`),
  CONSTRAINT `pvp_match_a_fk` FOREIGN KEY (`a_id`) REFERENCES `trainers` (`trainer_id`) ON DELETE CASCADE,
  CONSTRAINT `pvp_match_b_fk` FOREIGN KEY (`b_id`) REFERENCES `trainers` (`trainer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
