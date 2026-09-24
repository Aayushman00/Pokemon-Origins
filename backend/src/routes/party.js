const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { validateBody, partyArrangeSchema } = require("../middleware/validate");
const partyService = require("../services/partyService");

const pcView = (r) => ({
	id: r.id,
	pokemon_id: r.pokemon_id,
	nickname: r.nickname,
	level: r.level,
	current_hp: r.current_hp,
	max_hp: r.max_hp,
	gender: r.gender,
});

const fail = (res, err, fallback) => {
	if (!err.status) console.error(fallback, err.message);
	return res.status(err.status || 500).json({ success: false, error: err.status ? err.message : fallback });
};

// GET /api/party/pc — Pokémon stored in the PC (box order).
router.get("/pc", requireAuth, async (req, res) => {
	try {
		const rows = await partyService.getPcRows(req.user.trainer_id);
		return res.json({ success: true, pc: rows.map(pcView) });
	} catch (err) {
		return fail(res, err, "Failed to load the PC");
	}
});

// POST /api/party/arrange — { party: [ids lead-first], pc: [ids] }.
// One validated write for reorder / deposit / withdraw / swap. A battle
// already in progress keeps its own snapshot; the new order applies to the
// next battle.
router.post("/arrange", requireAuth, validateBody(partyArrangeSchema), async (req, res) => {
	try {
		const out = await partyService.arrange(req.user.trainer_id, req.validated);
		return res.json({ success: true, party: out.party.map(pcView), pc: out.pc.map(pcView) });
	} catch (err) {
		return fail(res, err, "Failed to arrange the party");
	}
});

module.exports = router;
