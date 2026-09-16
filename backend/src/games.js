// games.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("./middleware/auth");
const { validateBody, chooseStarterSchema } = require("./middleware/validate");
const starterService = require("./services/starterService");

// POST /api/choose-starter — trainer identity comes from JWT, not the body
router.post(
	"/choose-starter",
	requireAuth,
	validateBody(chooseStarterSchema),
	async (req, res) => {
		try {
			const result = await starterService.chooseStarter(
				req.user.trainer_id,
				req.validated.chosenPokemon
			);
			return res.json({ success: true, ...result });
		} catch (error) {
			if (error.status) {
				return res
					.status(error.status)
					.json({ success: false, error: error.message });
			}
			console.error(error);
			return res
				.status(500)
				.json({ success: false, error: "Failed to choose starter" });
		}
	}
);

module.exports = router;
