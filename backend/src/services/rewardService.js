/**
 * Boss reward cards (Phase 6).
 *
 * After a gym_boss battle is won server-side, the server creates a one-time
 * reward offer with exactly `optionCount` (3) Pokémon options picked from a
 * data-driven pool (backend/data/rewards/level<N>_boss.json). Options are
 * hydrated from the pokedex DB (same stat/move math as campaign hydration)
 * and snapshotted into the trainer DB — a claim never trusts client stats
 * or species.
 *
 * Claim rules (server-enforced):
 * - The offer must belong to the trainer and still be pending (one-time).
 * - The selected option must be one of the stored options.
 * - Party < MAX_PARTY: the Pokémon is added (lowest free position).
 * - Party at cap: a replacement position is required; that mon is removed
 *   and the reward takes the freed slot.
 *
 * Win-path order (see battleSessionService): battle resolves → progress
 * completeBattle → XP award → reward offer. All reward creation is gated on
 * the first-time completion, plus a DB UNIQUE(trainer, level, battle).
 */

const fs = require("fs");
const path = require("path");
const { MAX_PARTY } = require("./partyService");

class RewardError extends Error {
	constructor(status, message) {
		super(message);
		this.name = "RewardError";
		this.status = status;
	}
}

const REWARDS_DIR = path.join(__dirname, "..", "..", "data", "rewards");

/** Loads the boss pool config for a level; null when none exists. */
function loadRewardPool(level) {
	const file = path.join(REWARDS_DIR, `level${level}_boss.json`);
	if (!fs.existsSync(file)) return null;
	return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function defaultHydrateOption() {
	return async ({ pokemonId, level }) => {
		const {
			lookupSpecies,
			hydrateFromSpecies,
		} = require("../campaign/hydrate");
		const species = await lookupSpecies(pokemonId);
		return hydrateFromSpecies({ pokemonId, level }, species);
	};
}

function cloneOffer(offer) {
	return {
		...offer,
		options: offer.options.map((option) => ({
			...option,
			types: [...(option.types || [])],
			moves: (option.moves || []).map((m) => ({ ...m })),
		})),
	};
}

/** In-memory store for tests. */
function createMemoryRewardStore() {
	const offers = new Map(); // id -> offer
	let nextOfferId = 1;
	let nextOptionId = 1;
	const battleKey = (trainerId, level, battleNumber) =>
		`${Number(trainerId)}:${level}:${battleNumber}`;
	const byBattle = new Map(); // battleKey -> offerId

	return {
		async findByBattle(trainerId, level, battleNumber) {
			const id = byBattle.get(battleKey(trainerId, level, battleNumber));
			return id ? cloneOffer(offers.get(id)) : null;
		},
		async findPendingByTrainer(trainerId) {
			for (const offer of offers.values()) {
				if (
					offer.trainer_id === Number(trainerId) &&
					offer.status === "pending"
				) {
					return cloneOffer(offer);
				}
			}
			return null;
		},
		async getOffer(offerId) {
			const offer = offers.get(Number(offerId));
			return offer ? cloneOffer(offer) : null;
		},
		async createOffer({
			trainerId,
			level,
			battleNumber,
			sessionId,
			source,
			options,
		}) {
			const key = battleKey(trainerId, level, battleNumber);
			if (byBattle.has(key)) {
				// Mirrors the DB UNIQUE constraint.
				return cloneOffer(offers.get(byBattle.get(key)));
			}
			const offer = {
				id: nextOfferId++,
				trainer_id: Number(trainerId),
				level,
				battle_number: battleNumber,
				session_id: sessionId,
				source,
				status: "pending",
				claimed_option_id: null,
				options: options.map((option, index) => ({
					id: nextOptionId++,
					option_index: index + 1,
					...option,
				})),
			};
			offers.set(offer.id, offer);
			byBattle.set(key, offer.id);
			return cloneOffer(offer);
		},
		async markClaimed(offerId, trainerId, optionId) {
			const offer = offers.get(Number(offerId));
			if (
				!offer ||
				offer.trainer_id !== Number(trainerId) ||
				offer.status !== "pending"
			) {
				return false;
			}
			offer.status = "claimed";
			offer.claimed_option_id = Number(optionId);
			return true;
		},
		async reopen(offerId) {
			const offer = offers.get(Number(offerId));
			if (offer) {
				offer.status = "pending";
				offer.claimed_option_id = null;
			}
		},
	};
}

function createMysqlRewardStore(pool) {
	async function attachOptions(offerRow) {
		const [optionRows] = await pool.query(
			`SELECT id, option_index, pokemon_id, nickname, level, max_hp, current_hp,
              attack, defense, speed, special_atk, special_def, types_json, moves_json
       FROM reward_offer_options WHERE offer_id = ? ORDER BY option_index ASC`,
			[offerRow.id]
		);
		return {
			...offerRow,
			options: optionRows.map((row) => ({
				id: row.id,
				option_index: row.option_index,
				pokemon_id: row.pokemon_id,
				nickname: row.nickname,
				level: row.level,
				max_hp: row.max_hp,
				current_hp: row.current_hp,
				attack: row.attack,
				defense: row.defense,
				speed: row.speed,
				special_atk: row.special_atk,
				special_def: row.special_def,
				types: JSON.parse(row.types_json || "[]"),
				moves: JSON.parse(row.moves_json || "[]"),
			})),
		};
	}

	const OFFER_FIELDS =
		"id, trainer_id, level, battle_number, session_id, source, status, claimed_option_id";

	return {
		async findByBattle(trainerId, level, battleNumber) {
			const [rows] = await pool.query(
				`SELECT ${OFFER_FIELDS} FROM reward_offers
         WHERE trainer_id = ? AND level = ? AND battle_number = ?`,
				[trainerId, level, battleNumber]
			);
			return rows.length ? attachOptions(rows[0]) : null;
		},
		async findPendingByTrainer(trainerId) {
			const [rows] = await pool.query(
				`SELECT ${OFFER_FIELDS} FROM reward_offers
         WHERE trainer_id = ? AND status = 'pending'
         ORDER BY id DESC LIMIT 1`,
				[trainerId]
			);
			return rows.length ? attachOptions(rows[0]) : null;
		},
		async getOffer(offerId) {
			const [rows] = await pool.query(
				`SELECT ${OFFER_FIELDS} FROM reward_offers WHERE id = ?`,
				[offerId]
			);
			return rows.length ? attachOptions(rows[0]) : null;
		},
		async createOffer({
			trainerId,
			level,
			battleNumber,
			sessionId,
			source,
			options,
		}) {
			const connection = await pool.getConnection();
			try {
				await connection.beginTransaction();
				const [result] = await connection.query(
					`INSERT INTO reward_offers (trainer_id, level, battle_number, session_id, source)
           VALUES (?, ?, ?, ?, ?)`,
					[trainerId, level, battleNumber, sessionId, source]
				);
				const offerId = result.insertId;
				for (let i = 0; i < options.length; i++) {
					const o = options[i];
					await connection.query(
						`INSERT INTO reward_offer_options
               (offer_id, option_index, pokemon_id, nickname, level, max_hp, current_hp,
                attack, defense, speed, special_atk, special_def, types_json, moves_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
						[
							offerId,
							i + 1,
							o.pokemon_id,
							o.nickname,
							o.level,
							o.max_hp,
							o.current_hp,
							o.attack,
							o.defense,
							o.speed,
							o.special_atk,
							o.special_def,
							JSON.stringify(o.types || []),
							JSON.stringify(o.moves || []),
						]
					);
				}
				await connection.commit();
				return this.getOffer(offerId);
			} catch (txError) {
				await connection.rollback();
				if (txError.code === "ER_DUP_ENTRY") {
					// Another request created the offer first; reuse it.
					return this.findByBattle(trainerId, level, battleNumber);
				}
				throw txError;
			} finally {
				connection.release();
			}
		},
		async markClaimed(offerId, trainerId, optionId) {
			const [result] = await pool.query(
				`UPDATE reward_offers
         SET status = 'claimed', claimed_option_id = ?
         WHERE id = ? AND trainer_id = ? AND status = 'pending'`,
				[optionId, offerId, trainerId]
			);
			return result.affectedRows > 0;
		},
		async reopen(offerId) {
			await pool.query(
				`UPDATE reward_offers
         SET status = 'pending', claimed_option_id = NULL
         WHERE id = ?`,
				[offerId]
			);
		},
	};
}

function toPublicOption(option) {
	return {
		optionId: option.id,
		pokemon_id: option.pokemon_id,
		nickname: option.nickname,
		level: option.level,
		max_hp: option.max_hp,
		attack: option.attack,
		defense: option.defense,
		speed: option.speed,
		special_atk: option.special_atk,
		special_def: option.special_def,
		types: [...(option.types || [])],
	};
}

function toPublicOffer(offer) {
	return {
		offerId: offer.id,
		level: offer.level,
		battleNumber: offer.battle_number,
		source: offer.source,
		options: offer.options.map(toPublicOption),
	};
}

function toPublicParty(rows) {
	return rows.map((row) => ({
		position: row.position,
		pokemon_id: row.pokemon_id,
		nickname: row.nickname,
		level: row.level,
		current_hp: row.current_hp,
		max_hp: row.max_hp,
	}));
}

function createRewardService(deps = {}) {
	let store = deps.store || null;
	function getStore() {
		if (!store) {
			// Lazy so requiring this module never opens a DB connection.
			store = createMysqlRewardStore(require("../config/trainerdb"));
		}
		return store;
	}
	const getParty = () => deps.party || require("./partyService");
	const loadPool = deps.loadPool || loadRewardPool;
	const hydrateOption = deps.hydrateOption || defaultHydrateOption();
	const random = deps.random || Math.random;

	function pickDistinct(pool, count) {
		const shuffled = [...pool];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled.slice(0, Math.min(count, shuffled.length));
	}

	/**
	 * Creates the one-time offer for a just-won boss battle. Returns the
	 * public offer, the existing pending offer (resume), or null when the
	 * battle type has no reward pool or the offer was already claimed.
	 */
	async function createOfferForWin({
		trainerId,
		level,
		battleNumber,
		sessionId,
		battleType,
	}) {
		const poolConfig = loadPool(level);
		if (!poolConfig || battleType !== poolConfig.source) return null;

		const existing = await getStore().findByBattle(
			trainerId,
			level,
			battleNumber
		);
		if (existing) {
			return existing.status === "pending" ? toPublicOffer(existing) : null;
		}

		const picks = pickDistinct(
			poolConfig.pool,
			poolConfig.optionCount || 3
		);
		const options = [];
		for (const pick of picks) {
			const mon = await hydrateOption(pick);
			options.push({
				pokemon_id: mon.pokemon_id,
				nickname: mon.nickname,
				level: mon.level,
				max_hp: mon.max_hp,
				current_hp: mon.max_hp,
				attack: mon.attack,
				defense: mon.defense,
				speed: mon.speed,
				special_atk: mon.special_atk,
				special_def: mon.special_def,
				types: mon.types || [],
				moves: (mon.moves || []).map((m) => ({
					move_id: m.move_id,
					pp: m.pp || 0,
				})),
			});
		}

		const created = await getStore().createOffer({
			trainerId,
			level,
			battleNumber,
			sessionId,
			source: poolConfig.source,
			options,
		});
		return created && created.status === "pending"
			? toPublicOffer(created)
			: null;
	}

	/** The trainer's outstanding offer (if any) in public shape. */
	async function getPendingOffer(trainerId) {
		const offer = await getStore().findPendingByTrainer(trainerId);
		return offer ? toPublicOffer(offer) : null;
	}

	async function getPublicParty(trainerId) {
		return toPublicParty(await getParty().getPartyRows(trainerId));
	}

	/**
	 * Claims one option of a pending offer. Adds the Pokémon, or replaces
	 * `replacePartyPosition` when the party is at the cap.
	 */
	async function claimOffer(
		trainerId,
		{ offerId, optionId, replacePartyPosition }
	) {
		const party = getParty();
		const offer = await getStore().getOffer(offerId);
		if (!offer || offer.trainer_id !== Number(trainerId)) {
			throw new RewardError(404, "Reward offer not found");
		}
		if (offer.status !== "pending") {
			throw new RewardError(409, "Reward already claimed");
		}
		const option = offer.options.find((o) => o.id === Number(optionId));
		if (!option) {
			throw new RewardError(400, "Invalid reward option");
		}

		const rows = await party.getPartyRows(trainerId);
		const replacing = rows.length >= MAX_PARTY;
		if (replacing) {
			if (replacePartyPosition == null) {
				throw new RewardError(
					400,
					"Party is full — choose a Pokémon to replace"
				);
			}
			if (
				!rows.some(
					(row) => Number(row.position) === Number(replacePartyPosition)
				)
			) {
				throw new RewardError(400, "No Pokémon at that party position");
			}
		}

		// Atomic one-time gate: pending -> claimed.
		const marked = await getStore().markClaimed(
			offer.id,
			trainerId,
			option.id
		);
		if (!marked) {
			throw new RewardError(409, "Reward already claimed");
		}

		try {
			if (replacing) {
				await party.removeByPosition(trainerId, replacePartyPosition);
			}
			const mon = {
				pokemon_id: option.pokemon_id,
				nickname: option.nickname,
				level: option.level,
				current_hp: option.current_hp,
				max_hp: option.max_hp,
				attack: option.attack,
				defense: option.defense,
				speed: option.speed,
				special_atk: option.special_atk,
				special_def: option.special_def,
				experience: 0,
				status: "Healthy",
			};
			const added = await party.addPokemon(
				trainerId,
				mon,
				(option.moves || []).map((m) => ({
					move_id: m.move_id,
					pp: m.pp || 0,
				}))
			);
			return {
				pokemon: toPublicOption(option),
				position: added.position,
				party: toPublicParty(await party.getPartyRows(trainerId)),
			};
		} catch (err) {
			// Best-effort: give the claim back if the party write failed.
			await getStore()
				.reopen(offer.id)
				.catch(() => {});
			throw err;
		}
	}

	return { createOfferForWin, getPendingOffer, getPublicParty, claimOffer };
}

const defaultService = createRewardService();

module.exports = {
	RewardError,
	loadRewardPool,
	createRewardService,
	createMemoryRewardStore,
	createMysqlRewardStore,
	createOfferForWin: defaultService.createOfferForWin,
	getPendingOffer: defaultService.getPendingOffer,
	getPublicParty: defaultService.getPublicParty,
	claimOffer: defaultService.claimOffer,
};
