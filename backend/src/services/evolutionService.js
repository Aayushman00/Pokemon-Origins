/**
 * Evolution (Phase 9).
 *
 * Rules come from the pokedex `Evolution` table (base_pokemon_id,
 * evolved_pokemon_id, evolution_method, evolution_condition) — never from
 * the client and never from hardcoded species graphs. Supported methods:
 * - `level-up` with a "Level N" condition: when a party member's level
 *   reaches N it becomes a PENDING evolution. Pending evolutions are
 *   derived on the fly from trainer_pokemon + Evolution (no offer table,
 *   no migration); the trainer confirms via POST /api/evolutions/confirm,
 *   which re-derives server-side — a forged confirm for a mon that can't
 *   evolve is a 400. Ignoring a pending evolution just leaves it pending.
 * - `use-item` with a "Use <stone>" condition: overworld stone use
 *   (inventoryService) resolves the mapping below; a stone with no row for
 *   the target species is rejected with NO_EVOLUTION_EFFECT and NOT
 *   consumed. Stones stay unusable in battle.
 * Anything else (trade, …) is skipped: those rows are never offered and
 * never applied.
 *
 * Applying an evolution (single mapping module for the field math):
 * - `pokemon_id` flips to the evolved species; level and experience buffer
 *   stay untouched; moves are kept as-is (no learnset rebuild — Phase 9
 *   limitation).
 * - Stats gain the SPECIES DIFFERENCE computed with the campaign hydrate
 *   formula: delta = statAtLevel(evolvedBase, level) −
 *   statAtLevel(baseBase, level), clamped at ≥ 0 per stat. This reuses the
 *   reward/campaign math while preserving the fixed +stat increments the
 *   mon earned from Phase 5 level-ups (a from-scratch recompute would
 *   shrink a leveled mon).
 * - current_hp grows by the max_hp delta (no free heal), clamped to the
 *   new max — same policy as level-ups. A fainted mon can still evolve
 *   but stays fainted (0 HP): evolution never revives.
 * - Nickname: renamed to the evolved species name only when it still is
 *   the base species' default name; custom nicknames are kept.
 */

const {
	statAtLevel,
	displayName,
	lookupSpecies,
} = require("../campaign/hydrate");

class EvolutionError extends Error {
	constructor(status, message, code = null) {
		super(message);
		this.name = "EvolutionError";
		this.status = status;
		if (code) this.code = code;
	}
}

const NO_EVOLUTION_EFFECT = "NO_EVOLUTION_EFFECT";

/**
 * items.json stone itemId -> Evolution condition token ("Use <token>").
 * moon-stone exists in Evolution rows but has no item yet; the mapping is
 * ready for when one is added.
 */
const STONE_TOKEN_BY_ITEM_ID = {
	3: "fire-stone",
	4: "water-stone",
	5: "thunder-stone",
	6: "leaf-stone",
};

/** "Level 16" -> 16 (null when the condition is not a plain level). */
function parseLevelRequirement(condition) {
	const match = /level\s*(\d+)/i.exec(String(condition || ""));
	return match ? Number(match[1]) : null;
}

/** "Use fire-stone" -> "fire-stone" (null when not a use-item condition). */
function parseStoneToken(condition) {
	const match = /use\s+([a-z-]+)/i.exec(String(condition || ""));
	return match ? match[1].toLowerCase() : null;
}

/** In-memory Evolution rows for tests (dump-shaped objects). */
function createMemoryEvolutionStore(rows = []) {
	return {
		async getEvolutionsFor(basePokemonId) {
			return rows
				.filter(
					(row) => Number(row.base_pokemon_id) === Number(basePokemonId)
				)
				.map((row) => ({ ...row }));
		},
	};
}

function createMysqlEvolutionStore(pool) {
	return {
		async getEvolutionsFor(basePokemonId) {
			const [rows] = await pool.query(
				`SELECT evolution_id, base_pokemon_id, evolved_pokemon_id,
                evolution_method, evolution_condition
         FROM Evolution WHERE base_pokemon_id = ?`,
				[basePokemonId]
			);
			return rows;
		},
	};
}

function createEvolutionService(deps = {}) {
	let store = deps.store || null;
	function getStore() {
		if (!store) {
			// Evolution rows live in the pokedex schema (lazy pool).
			store = createMysqlEvolutionStore(require("../config/db"));
		}
		return store;
	}
	const lookup = deps.lookup || lookupSpecies;
	const getParty = () => deps.party || require("./partyService");

	/**
	 * Level-up rule for a species at a level. Unsupported methods (trade,
	 * …) and unparseable conditions are skipped, not faked.
	 */
	async function findLevelEvolution(pokemonId, level) {
		const rows = await getStore().getEvolutionsFor(pokemonId);
		for (const row of rows) {
			if (String(row.evolution_method) !== "level-up") continue;
			const required = parseLevelRequirement(row.evolution_condition);
			if (required == null) continue;
			if (Number(level) >= required) {
				return {
					evolvedPokemonId: Number(row.evolved_pokemon_id),
					requiredLevel: required,
				};
			}
		}
		return null;
	}

	/** use-item rule for a species + stone item; null when no row matches. */
	async function findStoneEvolution(pokemonId, itemId) {
		const token = STONE_TOKEN_BY_ITEM_ID[Number(itemId)];
		if (!token) return null;
		const rows = await getStore().getEvolutionsFor(pokemonId);
		for (const row of rows) {
			if (String(row.evolution_method) !== "use-item") continue;
			if (parseStoneToken(row.evolution_condition) === token) {
				return { evolvedPokemonId: Number(row.evolved_pokemon_id) };
			}
		}
		return null;
	}

	/**
	 * Applies an evolution to a trainer_pokemon row and persists it.
	 * Returns the public result payload used by all evolution surfaces.
	 */
	async function applyEvolutionToRow(trainerId, row, evolvedPokemonId) {
		const [baseSpecies, evolvedSpecies] = await Promise.all([
			lookup(row.pokemon_id),
			lookup(evolvedPokemonId),
		]);
		const level = Number(row.level);

		const statDelta = (baseKey, isHp = false) =>
			Math.max(
				0,
				statAtLevel(evolvedSpecies[baseKey], level, isHp) -
					statAtLevel(baseSpecies[baseKey], level, isHp)
			);

		const hpDelta = statDelta("hp", true);
		const maxHp = Number(row.max_hp) + hpDelta;
		const baseName = displayName(baseSpecies.name);
		const evolvedName = displayName(evolvedSpecies.name);
		const keepNickname =
			String(row.nickname).toLowerCase() !== baseName.toLowerCase();

		const currentHp = Number(row.current_hp);
		const fields = {
			pokemon_id: Number(evolvedPokemonId),
			nickname: keepNickname ? row.nickname : evolvedName,
			max_hp: maxHp,
			// Fainted stays fainted; otherwise HP grows by the max_hp delta.
			current_hp:
				currentHp <= 0 ? 0 : Math.min(currentHp + hpDelta, maxHp),
			attack: Number(row.attack) + statDelta("attack"),
			defense: Number(row.defense) + statDelta("defense"),
			speed: Number(row.speed) + statDelta("speed"),
			special_atk: Number(row.special_atk) + statDelta("special_attack"),
			special_def: Number(row.special_def) + statDelta("special_defense"),
		};
		await getParty().updatePokemonByPosition(
			trainerId,
			row.position,
			fields
		);

		return {
			position: Number(row.position),
			fromPokemonId: Number(row.pokemon_id),
			fromName: baseName,
			toPokemonId: Number(evolvedPokemonId),
			toName: evolvedName,
			fromNickname: row.nickname,
			nickname: fields.nickname,
			level,
			stats: {
				max_hp: fields.max_hp,
				current_hp: fields.current_hp,
				attack: fields.attack,
				defense: fields.defense,
				speed: fields.speed,
				special_atk: fields.special_atk,
				special_def: fields.special_def,
			},
		};
	}

	/** Party members whose level meets a level-up evolution requirement. */
	async function getPendingEvolutions(trainerId) {
		const rows = await getParty().getPartyRows(trainerId);
		const pending = [];
		for (const row of rows) {
			const candidate = await findLevelEvolution(row.pokemon_id, row.level);
			if (!candidate) continue;
			const evolvedSpecies = await lookup(candidate.evolvedPokemonId);
			pending.push({
				position: Number(row.position),
				nickname: row.nickname,
				level: Number(row.level),
				fromPokemonId: Number(row.pokemon_id),
				toPokemonId: candidate.evolvedPokemonId,
				toName: displayName(evolvedSpecies.name),
				requiredLevel: candidate.requiredLevel,
			});
		}
		return pending;
	}

	/**
	 * Confirms a pending level evolution. The rule is re-derived here, so a
	 * client cannot evolve a mon (or into a species) the table doesn't allow.
	 */
	async function confirmLevelEvolution(trainerId, partyPosition) {
		const rows = await getParty().getPartyRows(trainerId);
		const row = rows.find(
			(r) => Number(r.position) === Number(partyPosition)
		);
		if (!row) {
			throw new EvolutionError(400, "No Pokémon at that party position");
		}
		const candidate = await findLevelEvolution(row.pokemon_id, row.level);
		if (!candidate) {
			throw new EvolutionError(
				400,
				`${row.nickname} can't evolve right now`
			);
		}
		return applyEvolutionToRow(trainerId, row, candidate.evolvedPokemonId);
	}

	/**
	 * Stone evolution for inventoryService (overworld only). Persists the
	 * evolution; the caller consumes the stone afterwards.
	 */
	async function evolveWithStone(trainerId, partyPosition, item) {
		const rows = await getParty().getPartyRows(trainerId);
		const row = rows.find(
			(r) => Number(r.position) === Number(partyPosition)
		);
		if (!row) {
			throw new EvolutionError(400, "No Pokémon at that party position");
		}
		const candidate = await findStoneEvolution(row.pokemon_id, item.itemId);
		if (!candidate) {
			throw new EvolutionError(
				400,
				`The ${item.name} won't have any effect on ${row.nickname}`,
				NO_EVOLUTION_EFFECT
			);
		}
		return applyEvolutionToRow(trainerId, row, candidate.evolvedPokemonId);
	}

	return {
		findLevelEvolution,
		findStoneEvolution,
		getPendingEvolutions,
		confirmLevelEvolution,
		evolveWithStone,
	};
}

const defaultService = createEvolutionService();

module.exports = {
	EvolutionError,
	NO_EVOLUTION_EFFECT,
	STONE_TOKEN_BY_ITEM_ID,
	parseLevelRequirement,
	parseStoneToken,
	createEvolutionService,
	createMemoryEvolutionStore,
	createMysqlEvolutionStore,
	findLevelEvolution: defaultService.findLevelEvolution,
	findStoneEvolution: defaultService.findStoneEvolution,
	getPendingEvolutions: defaultService.getPendingEvolutions,
	confirmLevelEvolution: defaultService.confirmLevelEvolution,
	evolveWithStone: defaultService.evolveWithStone,
};
