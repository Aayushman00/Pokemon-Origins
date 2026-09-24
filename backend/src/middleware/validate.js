const { z } = require("zod");

/**
 * Validate req.body (or custom source) with a Zod schema.
 * On failure: 400 { success: false, error }.
 */
function validateBody(schema) {
	return (req, res, next) => {
		const result = schema.safeParse(req.body);
		if (!result.success) {
			const message = result.error.issues
				.map((issue) => issue.message)
				.join("; ");
			return res.status(400).json({ success: false, error: message });
		}
		req.validated = result.data;
		return next();
	};
}

function validateParams(schema) {
	return (req, res, next) => {
		const result = schema.safeParse(req.params);
		if (!result.success) {
			const message = result.error.issues
				.map((issue) => issue.message)
				.join("; ");
			return res.status(400).json({ success: false, error: message });
		}
		req.validatedParams = result.data;
		return next();
	};
}

const loginSchema = z.object({
	email: z.string().email("Valid email is required"),
	password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
	email: z.string().email("Valid email is required"),
	gender: z.enum(["Male", "Female", "Other"], {
		errorMap: () => ({ message: "Gender must be Male, Female, or Other" }),
	}),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

const chooseStarterSchema = z.object({
	chosenPokemon: z.enum(["bulbasaur", "charmander", "squirtle"], {
		errorMap: () => ({
			message: "chosenPokemon must be bulbasaur, charmander, or squirtle",
		}),
	}),
});

const pokemonSchema = z
	.object({
		pokemon_id: z.number().int(),
		nickname: z.string(),
		level: z.number(),
		max_hp: z.number(),
		current_hp: z.number(),
		attack: z.number(),
		defense: z.number(),
		speed: z.number(),
		special_atk: z.number(),
		special_def: z.number(),
		status: z.string(),
		types: z.array(z.string()).default([]),
		moves: z.array(z.any()).default([]),
	})
	.passthrough();

const moveSchema = z
	.object({
		move_id: z.number().int(),
		name: z.string(),
		power: z.number().nullable().optional(),
		accuracy: z.number(),
		move_type: z.string(),
		pp: z.number().nullable().optional(),
		status_effect: z.string().nullable().optional(),
		effect_chance: z.number().nullable().optional(),
	})
	.passthrough();

const calculateDamageSchema = z.object({
	attacker: pokemonSchema,
	defender: pokemonSchema,
	move: moveSchema,
});

const trainerIdParamsSchema = z.object({
	trainerId: z.coerce.number().int().positive(),
});

const completeBattleSchema = z.object({
	level: z.number().int().positive(),
	battleNumber: z.number().int().positive(),
});

const battleStartSchema = z.object({
	level: z.number().int().positive(),
	battleNumber: z.number().int().positive(),
	force: z.boolean().optional(),
});

const rewardClaimSchema = z.object({
	offerId: z.number().int().positive(),
	optionId: z.number().int().positive(),
	replacePartyPosition: z.number().int().min(1).max(3).optional(),
});

const battleActionSchema = z.object({
	sessionId: z.string().min(1, "sessionId is required"),
	action: z.discriminatedUnion("type", [
		z.object({
			type: z.literal("move"),
			moveId: z.number().int(),
		}),
		z.object({
			type: z.literal("switch"),
			partyPosition: z.number().int().min(1).max(3),
		}),
		z.object({
			type: z.literal("item"),
			itemId: z.number().int().positive(),
			partyPosition: z.number().int().min(1).max(3).optional(),
		}),
	]),
});

const inventoryUseSchema = z.object({
	itemId: z.number().int().positive(),
	partyPosition: z.number().int().min(1).max(3).optional(),
});

const martPurchaseSchema = z.object({
	itemId: z.number().int().positive(),
	quantity: z.number().int().min(1).max(10).optional().default(1),
});

const evolutionConfirmSchema = z.object({
	partyPosition: z.number().int().min(1).max(3),
});

const moveLearnResolveSchema = z.object({
	pendingId: z.number().int().positive(),
	action: z.enum(["learn", "skip"], {
		errorMap: () => ({ message: "action must be learn or skip" }),
	}),
	forgetMoveId: z.number().int().positive().optional(),
});

const trainerCardSchema = z.object({
	theme: z.string().max(16),
	motto: z.string().max(80).optional().nullable(),
	favoriteId: z.number().int().positive().nullable().optional(),
});
const battleHistoryQuerySchema = z.object({
	limit: z.coerce.number().int().positive().max(50).optional(),
	before: z.coerce.number().int().positive().optional(),
});

const idList = z.array(z.number().int().positive()).max(1000);
const partyArrangeSchema = z.object({ party: idList, pc: idList });

module.exports = {
	partyArrangeSchema,
	trainerCardSchema,
	battleHistoryQuerySchema,
	validateBody,
	validateParams,
	loginSchema,
	registerSchema,
	chooseStarterSchema,
	calculateDamageSchema,
	trainerIdParamsSchema,
	completeBattleSchema,
	battleStartSchema,
	battleActionSchema,
	rewardClaimSchema,
	inventoryUseSchema,
	martPurchaseSchema,
	evolutionConfirmSchema,
	moveLearnResolveSchema,
};
