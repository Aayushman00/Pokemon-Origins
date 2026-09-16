const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { validateBody, rewardClaimSchema } = require("../middleware/validate");
const rewardService = require("../services/rewardService");

// GET /api/rewards/pending — the trainer's outstanding boss offer (if any).
// Includes the current party so the client can tell whether a claim will
// need a replacement target.
router.get("/pending", requireAuth, async (req, res) => {
	try {
		const reward = await rewardService.getPendingOffer(req.user.trainer_id);
		const party = reward
			? await rewardService.getPublicParty(req.user.trainer_id)
			: undefined;
		return res.json({
			success: true,
			reward,
			...(party ? { party } : {}),
		});
	} catch (err) {
		console.error("Reward pending fetch error:", err.message);
		return res.status(err.status || 500).json({
			success: false,
			error: err.message || "Failed to load pending reward",
		});
	}
});

// POST /api/rewards/claim — claim exactly one server-generated option.
// Body: { offerId, optionId, replacePartyPosition? }
router.post(
	"/claim",
	requireAuth,
	validateBody(rewardClaimSchema),
	async (req, res) => {
		try {
			const result = await rewardService.claimOffer(
				req.user.trainer_id,
				req.validated
			);
			return res.json({ success: true, ...result });
		} catch (err) {
			const status = err.status || 500;
			if (status >= 500) {
				console.error("Reward claim error:", err);
			}
			return res.status(status).json({
				success: false,
				error: err.message || "Failed to claim reward",
			});
		}
	}
);

module.exports = router;
