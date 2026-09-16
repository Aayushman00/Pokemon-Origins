const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
	validateBody,
	moveLearnResolveSchema,
} = require("../middleware/validate");
const moveLearnService = require("../services/moveLearnService");

// GET /api/moves/pending — open "wants to learn" offers for the trainer's
// party (created on level-up wins when a mon already knew 4 moves), each
// with the new move's metadata and the mon's current moveset.
router.get("/pending", requireAuth, async (req, res) => {
	try {
		const pending = await moveLearnService.getPendingLearns(
			req.user.trainer_id
		);
		return res.json({ success: true, pending });
	} catch (err) {
		console.error("Pending move learns error:", err.message);
		return res.status(err.status || 500).json({
			success: false,
			error: err.message || "Failed to load pending move offers",
		});
	}
});

// POST /api/moves/learn — resolve one offer.
// Body: { pendingId, action: "learn", forgetMoveId? } or
//       { pendingId, action: "skip" }.
// The offer's own move is applied (the client never posts a new move id);
// with 4 moves known, `learn` requires forgetMoveId ∈ current moves.
router.post(
	"/learn",
	requireAuth,
	validateBody(moveLearnResolveSchema),
	async (req, res) => {
		try {
			const result = await moveLearnService.resolveLearn(
				req.user.trainer_id,
				req.validated
			);
			return res.json({ success: true, result });
		} catch (err) {
			const status = err.status || 500;
			if (status >= 500) {
				console.error("Move learn resolve error:", err);
			}
			return res.status(status).json({
				success: false,
				error: err.message || "Failed to resolve move offer",
				...(err.code ? { code: err.code } : {}),
			});
		}
	}
);

module.exports = router;
