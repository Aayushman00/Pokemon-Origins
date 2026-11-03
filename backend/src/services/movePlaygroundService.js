const {
	createBattleSessionService,
	createMemoryPpStore,
	createMemoryHpStore,
	createMemoryHistoryStore,
} = require("./battleSessionService");
const {
	createProgressService,
	createMemoryStore,
} = require("./progressService");
const { createXpService, createMemoryXpStore } = require("./xpService");
const {
	createWalletService,
	createMemoryWalletStore,
} = require("./walletService");
const hydrate = require("../campaign/hydrate");
const { CampaignError } = require("../campaign/errors");

const FAKE_TRAINER_ID = -1;
const FAKE_LEVEL = 1;
const FAKE_BATTLE_NUMBER = 1;
const SYNTHETIC_MON_ID = -1;

function getPokedexDb() {
	return require("../config/db");
}

async function defaultListSpeciesRaw() {
	const [rows] = await getPokedexDb().query(
		`SELECT pokemon_id, name, hp, attack, defense, special_attack, special_defense, speed
     FROM Pokemon ORDER BY pokemon_id ASC`
	);
	const [typeRows] = await getPokedexDb().query(
		`SELECT pt.pokemon_id, t.name AS type_name
     FROM Pokemon_Type pt JOIN Type t ON pt.type_id = t.type_id`
	);
	const typesByPokemon = new Map();
	for (const row of typeRows) {
		const list = typesByPokemon.get(row.pokemon_id) || [];
		list.push(row.type_name);
		typesByPokemon.set(row.pokemon_id, list);
	}
	return rows.map((row) => ({
		pokemon_id: row.pokemon_id,
		name: row.name,
		hp: row.hp,
		attack: row.attack,
		defense: row.defense,
		special_attack: row.special_attack,
		special_defense: row.special_defense,
		speed: row.speed,
		types: typesByPokemon.get(row.pokemon_id) || ["Normal"],
	}));
}

async function defaultListMovesRaw() {
	const [rows] = await getPokedexDb().query(
		`SELECT m.move_id, m.name AS move_name, m.power, m.accuracy, m.pp, t.name AS move_type
     FROM \`Move\` m LEFT JOIN Type t ON m.type_id = t.type_id
     ORDER BY m.move_id ASC`
	);
	return rows.map((row) => ({
		move_id: row.move_id,
		name: row.move_name,
		power: row.power,
		accuracy: row.accuracy,
		pp: row.pp,
		move_type: row.move_type || "Normal",
	}));
}

/** Single-move lookup (hydrate.js's queries always join through a species'
 * learnset; Move Lab needs an arbitrary move by id with no species filter). */
async function defaultLookupMove(moveId) {
	const [rows] = await getPokedexDb().query(
		`SELECT m.move_id, m.name AS move_name, m.power, m.accuracy, m.pp, t.name AS move_type
     FROM \`Move\` m LEFT JOIN Type t ON m.type_id = t.type_id
     WHERE m.move_id = ?`,
		[moveId]
	);
	if (!rows.length) {
		throw new CampaignError(400, `Unknown moveId ${moveId}`);
	}
	const row = rows[0];
	let accuracy = row.accuracy == null ? 1 : Number(row.accuracy);
	if (accuracy > 1) accuracy = accuracy / 100;
	return {
		move_id: row.move_id,
		name: row.move_name,
		power: row.power,
		accuracy,
		move_type: row.move_type || "Normal",
		pp: row.pp ?? null,
	};
}

function createMovePlaygroundService(deps = {}) {
	const lookupSpecies = deps.lookupSpecies || hydrate.lookupSpecies;
	const lookupMove = deps.lookupMove || defaultLookupMove;
	const listSpeciesRaw = deps.listSpeciesRaw || defaultListSpeciesRaw;
	const listMovesRaw = deps.listMovesRaw || defaultListMovesRaw;

	async function listSpecies() {
		return listSpeciesRaw();
	}

	async function listMoves() {
		return listMovesRaw();
	}

	async function buildMon(input) {
		let species;
		try {
			species = await lookupSpecies(input.pokemonId);
		} catch (err) {
			throw new CampaignError(400, `Unknown pokemonId ${input.pokemonId}`);
		}
		const move = await lookupMove(input.moveId);
		const level = input.level;
		const maxHp = hydrate.statAtLevel(species.hp, level, true);
		const hpPercent = input.hpPercent == null ? 100 : Number(input.hpPercent);
		const currentHp = Math.max(0, Math.round((maxHp * hpPercent) / 100));
		if (currentHp <= 0) {
			throw new CampaignError(
				400,
				`${hydrate.displayName(species.name)} can't battle at 0 HP — raise hpPercent above 0`
			);
		}
		const status =
			input.status && input.status !== "Healthy" ? input.status : null;
		return {
			id: SYNTHETIC_MON_ID,
			pokemon_id: species.pokemon_id,
			nickname: hydrate.displayName(species.name),
			level,
			max_hp: maxHp,
			current_hp: currentHp,
			attack: hydrate.statAtLevel(species.attack, level, false),
			defense: hydrate.statAtLevel(species.defense, level, false),
			speed: hydrate.statAtLevel(species.speed, level, false),
			special_atk: hydrate.statAtLevel(species.special_attack, level, false),
			special_def: hydrate.statAtLevel(species.special_defense, level, false),
			types: species.types && species.types.length ? species.types : ["Normal"],
			ability: species.ability ?? null,
			debugStatus: status,
			debugStages: input.stages || {},
			moves: [
				{
					move_id: move.move_id,
					name: move.name,
					power: move.power,
					accuracy: move.accuracy,
					move_type: move.move_type,
					pp: move.pp,
					status_effect: null,
					effect_chance: null,
					force_hit: input.forceHit ?? null,
					force_crit: input.forceCrit ?? null,
					force_secondary: input.forceSecondary ?? null,
				},
			],
		};
	}

	function buildSandboxService(monARaw, monBRaw) {
		return createBattleSessionService({
			progress: createProgressService({
				store: createMemoryStore(),
				countBattles: () => 1,
			}),
			xp: createXpService({ store: createMemoryXpStore([]) }),
			wallet: createWalletService({
				store: createMemoryWalletStore({ [FAKE_TRAINER_ID]: 0 }),
			}),
			evolution: { findLevelEvolution: async () => null },
			moveLearn: {
				processLevelUp: async () => ({ learned: [], pending: [] }),
			},
			ai: { pickMove: async (attacker) => attacker.moves[0] },
			ppStore: createMemoryPpStore(),
			hpStore: createMemoryHpStore(),
			history: createMemoryHistoryStore(),
			...(deps.engine ? { engine: deps.engine } : {}),
			getPlayerParty: async () => [monARaw],
			getEnemyBattle: async () => ({
				trainerName: "Move Lab",
				pokemon: monBRaw,
				battleType: "trainer",
			}),
		});
	}

	async function runExchange(monAInput, monBInput) {
		const monARaw = await buildMon(monAInput);
		const monBRaw = await buildMon(monBInput);
		const service = buildSandboxService(monARaw, monBRaw);
		const { state: startState } = await service.startBattle(FAKE_TRAINER_ID, {
			level: FAKE_LEVEL,
			battleNumber: FAKE_BATTLE_NUMBER,
		});
		const { state, events } = await service.performAction(FAKE_TRAINER_ID, {
			sessionId: startState.sessionId,
			action: { type: "move", moveId: monARaw.moves[0].move_id },
		});
		return { events, log: state.log };
	}

	return { listSpecies, listMoves, runExchange };
}

const defaultService = createMovePlaygroundService();

module.exports = {
	listSpecies: defaultService.listSpecies,
	listMoves: defaultService.listMoves,
	runExchange: defaultService.runExchange,
	createMovePlaygroundService,
};
