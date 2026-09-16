-- Phase 8: per-trainer coin wallet (trainer schema).
-- Apply after pokedex_data.sql has created `trainer.trainers`.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS).
--
-- Rows are lazy-inserted by walletService with the starting balance
-- (500 coins) on first read, so existing trainers need no backfill.
-- Coins only move server-side: battle-win awards and mart purchases.

USE `trainer`;

CREATE TABLE IF NOT EXISTS `trainer_wallet` (
  `trainer_id` int NOT NULL,
  `coins` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`trainer_id`),
  CONSTRAINT `fk_wallet_trainer_id`
    FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`trainer_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
