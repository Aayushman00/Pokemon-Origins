const express = require("express");
const router = express.Router();
const {
	validateParams,
	trainerIdParamsSchema,
} = require("../middleware/validate");
const profileService = require("../services/profileService");

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
