const express = require("express");
const router = express.Router();
const {
	validateBody,
	validateParams,
	trainerIdParamsSchema,
	trainerCardSchema,
	battleHistoryQuerySchema,
} = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const profileService = require("../services/profileService");
const resetService = require("../services/resetService");

const fail = (res, err, fallback) => {
	if (err.status) return res.status(err.status).json({ success: false, error: err.message });
	console.error(fallback, err.message);
	return res.status(500).json({ success: false, error: fallback });
};

// PUT /api/trainers/me/card — edit your own card (theme, motto, favourite).
// Declared before /:trainerId routes so "me" is never parsed as an id.
router.put("/me/card", requireAuth, validateBody(trainerCardSchema), async (req, res) => {
	try {
		const profile = await profileService.updateCard(req.user.trainer_id, req.validated);
		return res.json({ success: true, profile });
	} catch (err) {
		return fail(res, err, "Failed to save your card");
	}
});

// POST /api/trainers/me/reset — wipe party/PC, inventory, badges, pending
// reward offers, and reset progress + coins to a fresh save. Battle history
// and the trainer's card are left untouched (see resetService).
router.post("/me/reset", requireAuth, async (req, res) => {
	try {
		await resetService.resetTrainer(req.user.trainer_id);
		return res.json({ success: true });
	} catch (err) {
		return fail(res, err, "Failed to reset your save");
	}
});

// GET /api/trainers/:trainerId/battles?limit=&before= — public battle log.
router.get("/:trainerId/battles", validateParams(trainerIdParamsSchema), async (req, res) => {
	const q = battleHistoryQuerySchema.safeParse(req.query);
	if (!q.success) return res.status(400).json({ success: false, error: "Invalid paging parameters" });
	try {
		const page = await profileService.getBattleHistory(req.validatedParams.trainerId, q.data);
		return res.json({ success: true, ...page });
	} catch (err) {
		return fail(res, err, "Failed to load battle history");
	}
});

// GET /api/trainers/:trainerId/profile — public: guests in the Playground
// hover registered trainers too. The payload carries no account fields.
router.get(
	"/:trainerId/profile",
	validateParams(trainerIdParamsSchema),
	async (req, res) => {
		try {
			const profile = await profileService.getPublicProfile(
				req.validatedParams.trainerId
			);
			return res.json({ success: true, profile });
		} catch (err) {
			if (err.status) {
				return res.status(err.status).json({ success: false, error: err.message });
			}
			console.error("Trainer profile error:", err.message);
			return res.status(500).json({ success: false, error: "Failed to load profile" });
		}
	}
);

module.exports = router;
