const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
	validateBody,
	completeBattleSchema,
} = require("../middleware/validate");
const campaignService = require("../services/campaignService");
const progressService = require("../services/progressService");
const battleSessionService = require("../services/battleSessionService");

router.get("/progress", requireAuth, async (req, res) => {
	try {
		const progress = await progressService.getProgress(req.user.trainer_id);
		return res.json({ success: true, progress });
	} catch (err) {
		const status = err.status || 500;
		console.error("Campaign progress error:", err.message);
		return res.status(status).json({
			success: false,
			error: err.message || "Failed to load campaign progress",
		});
	}
});

router.post(
	"/progress/complete-battle",
	requireAuth,
	validateBody(completeBattleSchema),
	async (req, res) => {
		try {
			const trainerId = req.user.trainer_id;
			const { level, battleNumber } = req.validated;

			// Anti-cheat: advancing requires a server session won for this
			// battle. Replays of already-completed battles stay 200 (idempotent).
			const current = await progressService.getProgress(trainerId);
			const alreadyCompleted =
				current.current_level > level ||
				(current.current_level === level &&
					current.current_battle > battleNumber);
			if (
				!alreadyCompleted &&
				!battleSessionService.hasWonBattle(trainerId, level, battleNumber)
			) {
				return res.status(403).json({
					success: false,
					error: "No winning battle session for this battle",
				});
			}

			const progress = await progressService.completeBattle(trainerId, {
				level,
				battleNumber,
			});
			return res.json({ success: true, progress });
		} catch (err) {
			const status = err.status || 500;
			console.error("Complete battle error:", err.message);
			return res.status(status).json({
				success: false,
				error: err.message || "Failed to complete battle",
			});
		}
	}
);

router.get("/level/:levelNumber", requireAuth, async (req, res) => {
	const levelNumber = Number(req.params.levelNumber);
	if (!Number.isInteger(levelNumber) || levelNumber < 1) {
		return res.status(400).json({
			success: false,
			error: "levelNumber must be a positive integer",
		});
	}
	try {
		await progressService.assertLevelUnlocked(
			req.user.trainer_id,
			levelNumber
		);
		const campaign = await campaignService.getLevel(levelNumber);
		return res.json({
			success: true,
			level: campaign.level,
			name: campaign.name,
			battles: campaign.battles,
			legacy: campaignService.toLegacyLevelPayload(campaign),
		});
	} catch (err) {
		const status = err.status || 500;
		console.error("Campaign level error:", err.message);
		return res.status(status).json({
			success: false,
			error: err.message || "Failed to load campaign level",
		});
	}
});

module.exports = router;
