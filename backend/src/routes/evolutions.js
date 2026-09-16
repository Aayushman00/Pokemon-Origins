const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
	validateBody,
	evolutionConfirmSchema,
} = require("../middleware/validate");
const evolutionService = require("../services/evolutionService");

// GET /api/evolutions/pending — party members whose level meets a level-up
// evolution rule (derived live from trainer_pokemon + pokedex Evolution).
router.get("/pending", requireAuth, async (req, res) => {
	try {
		const pending = await evolutionService.getPendingEvolutions(
			req.user.trainer_id
		);
		return res.json({ success: true, pending });
	} catch (err) {
		console.error("Pending evolutions error:", err.message);
		return res.status(err.status || 500).json({
			success: false,
			error: err.message || "Failed to load pending evolutions",
		});
	}
});

// POST /api/evolutions/confirm — apply a pending level-up evolution.
// Body: { partyPosition }. The rule is re-derived server-side, so a mon
// that doesn't meet its threshold (or has no rule) is a 400.
router.post(
	"/confirm",
	requireAuth,
	validateBody(evolutionConfirmSchema),
	async (req, res) => {
		try {
			const evolved = await evolutionService.confirmLevelEvolution(
				req.user.trainer_id,
				req.validated.partyPosition
			);
			return res.json({ success: true, evolved });
		} catch (err) {
			const status = err.status || 500;
			if (status >= 500) {
				console.error("Evolution confirm error:", err);
			}
			return res.status(status).json({
				success: false,
				error: err.message || "Failed to evolve",
				...(err.code ? { code: err.code } : {}),
			});
		}
	}
);

module.exports = router;
