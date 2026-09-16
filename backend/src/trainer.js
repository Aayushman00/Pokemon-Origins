// trainer.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("./middleware/auth");
const {
	validateParams,
	trainerIdParamsSchema,
} = require("./middleware/validate");
const trainerService = require("./services/trainerService");

// GET /trainer/:trainerId/data
router.get(
	"/:trainerId/data",
	requireAuth,
	validateParams(trainerIdParamsSchema),
	async (req, res) => {
		const trainerId = req.validatedParams.trainerId;

		if (trainerId !== Number(req.user.trainer_id)) {
			return res
				.status(403)
				.json({ success: false, error: "Forbidden" });
		}

		try {
			const data = await trainerService.getTrainerData(trainerId);
			return res.json({ success: true, ...data });
		} catch (err) {
			if (err.status) {
				return res
					.status(err.status)
					.json({ success: false, error: err.message });
			}
			console.error(err);
			return res
				.status(500)
				.json({ success: false, error: "Internal Server Error" });
		}
	}
);

module.exports = router;
