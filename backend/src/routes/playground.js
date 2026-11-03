const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { validateBody, playgroundExchangeSchema } = require("../middleware/validate");
const movePlaygroundService = require("../services/movePlaygroundService");

// GET /api/playground/species — every species for the Move Lab pickers.
router.get("/species", requireAuth, async (req, res) => {
	try {
		const species = await movePlaygroundService.listSpecies();
		return res.json({ success: true, species });
	} catch (err) {
		console.error("Playground species error:", err.message);
		return res.status(500).json({ success: false, error: "Failed to load species" });
	}
});

// GET /api/playground/moves — every move for the Move Lab pickers.
router.get("/moves", requireAuth, async (req, res) => {
	try {
		const moves = await movePlaygroundService.listMoves();
		return res.json({ success: true, moves });
	} catch (err) {
		console.error("Playground moves error:", err.message);
		return res.status(500).json({ success: false, error: "Failed to load moves" });
	}
});

// POST /api/playground/exchange — run one move-vs-move exchange through the
// real battle engine with fully custom Pokémon setup on both sides.
router.post(
	"/exchange",
	requireAuth,
	validateBody(playgroundExchangeSchema),
	async (req, res) => {
		try {
			const result = await movePlaygroundService.runExchange(
				req.validated.monA,
				req.validated.monB
			);
			return res.json({ success: true, ...result });
		} catch (err) {
			const status = err.status || 500;
			if (status >= 500) {
				console.error("Playground exchange error:", err);
			}
			return res.status(status).json({
				success: false,
				error: err.message || "Failed to run exchange",
			});
		}
	}
);

module.exports = router;
