const { z } = require("zod");

const partyMemberSchema = z.object({
	pokemonId: z.number().int().positive(),
	level: z.number().int().min(1).max(100),
});

const trainerSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	title: z.string().min(1),
	specialization: z.string().optional(),
	region: z.string().optional(),
	sprite: z.string().min(1),
	party: z.array(partyMemberSchema).min(1),
});

const trainerCatalogSchema = z.record(z.string(), trainerSchema);

const trainerBattleSchema = z.object({
	battleNumber: z.number().int().positive(),
	type: z.enum(["trainer", "gym_boss", "elite_four", "champion"]),
	trainerId: z.string().min(1),
});

// Legendary battles reference encounters/legendary.json by id (Phase 10);
// the loader resolves the encounterId into { name, pokemonId, level }.
const legendaryBattleSchema = z.object({
	battleNumber: z.number().int().positive(),
	type: z.literal("legendary"),
	encounterId: z.string().min(1),
});

const encounterSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	pokemonId: z.number().int().positive(),
	level: z.number().int().min(1).max(100),
});

const encounterCatalogSchema = z.record(z.string(), encounterSchema);

const battleSchema = z.union([trainerBattleSchema, legendaryBattleSchema]);

const levelSchema = z.object({
	level: z.number().int().positive(),
	name: z.string().min(1),
	battles: z.array(battleSchema).min(1),
});

module.exports = {
	partyMemberSchema,
	trainerSchema,
	trainerCatalogSchema,
	encounterSchema,
	encounterCatalogSchema,
	battleSchema,
	levelSchema,
};
