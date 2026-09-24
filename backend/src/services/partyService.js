/**
 * Party write path for trainer_pokemon.
 *
 * Party rules (source of truth):
 * - A trainer owns at most MAX_PARTY (3) Pokémon.
 * - Each row keeps a stable `position` 1..3; a new Pokémon takes the lowest
 *   free slot.
 * - "Active" Pokémon is battle-session state (see battleSessionService), not
 *   a DB flag.
 * - Pokémon outside the party live in the PC (trainer_pokemon.in_pc = 1,
 *   position = box order). Every party query filters in_pc = 0; the PC has
 *   no cap. arrange() is the one write path that moves Pokémon between the
 *   two and reorders them.
 *
 * The cap is enforced here in service code — there is no DB constraint on
 * (trainer_id, position), which is a documented limitation.
 *
 * Store is injectable so tests can run against an in-memory store.
 */

const MAX_PARTY = 3;

class PartyError extends Error {
	constructor(status, message) {
		super(message);
		this.name = "PartyError";
		this.status = status;
	}
}

const PARTY_FULL_MESSAGE = `Party is full (max ${MAX_PARTY} Pokémon)`;

const { rollGenderForSpecies } = require("./genderService");

/** In-memory store for tests. `initialRows` maps trainerId -> array of rows. */
function createMemoryPartyStore(initialRows = {}) {
	const byTrainer = new Map();
	let nextId = 1;
	for (const [trainerId, rows] of Object.entries(initialRows)) {
		byTrainer.set(
			Number(trainerId),
			rows.map((row) => ({ id: nextId++, ...row }))
		);
	}
	return {
		async list(trainerId) {
			const rows = byTrainer.get(Number(trainerId)) || [];
			return rows
				.filter((row) => !row.in_pc)
				.map((row) => ({ ...row }))
				.sort((a, b) => a.position - b.position);
		},
		async listPc(trainerId) {
			const rows = byTrainer.get(Number(trainerId)) || [];
			return rows
				.filter((row) => row.in_pc)
				.map((row) => ({ ...row }))
				.sort((a, b) => a.position - b.position);
		},
		async moveToPc(trainerId, id, pcPosition) {
			const rows = byTrainer.get(Number(trainerId)) || [];
			Object.assign(rows.find((r) => Number(r.id) === Number(id)), { in_pc: 1, position: pcPosition });
		},
		async setLayout(trainerId, partyIds, pcIds) {
			const rows = byTrainer.get(Number(trainerId)) || [];
			const byId = new Map(rows.map((r) => [Number(r.id), r]));
			partyIds.forEach((id, i) => Object.assign(byId.get(id), { in_pc: 0, position: i + 1 }));
			pcIds.forEach((id, i) => Object.assign(byId.get(id), { in_pc: 1, position: i + 1 }));
		},
		async insert(trainerId, mon, moves, position) {
			const key = Number(trainerId);
			const rows = byTrainer.get(key) || [];
			const id = nextId++;
			rows.push({
				id,
				position,
				...mon,
				moves: (moves || []).map((m) => ({ ...m })),
			});
			byTrainer.set(key, rows);
			return id;
		},
		async remove(trainerId, position) {
			const key = Number(trainerId);
			const rows = byTrainer.get(key) || [];
			const idx = rows.findIndex(
				(row) => !row.in_pc && Number(row.position) === Number(position)
			);
			if (idx === -1) return false;
			rows.splice(idx, 1);
			return true;
		},
		async setCurrentHp(trainerId, position, currentHp) {
			const rows = byTrainer.get(Number(trainerId)) || [];
			const row = rows.find(
				(r) => !r.in_pc && Number(r.position) === Number(position)
			);
			if (!row) return false;
			row.current_hp = currentHp;
			return true;
		},
		async updateAtPosition(trainerId, position, fields) {
			const rows = byTrainer.get(Number(trainerId)) || [];
			const row = rows.find(
				(r) => !r.in_pc && Number(r.position) === Number(position)
			);
			if (!row) return false;
			Object.assign(row, fields);
			return true;
		},
	};
}

/** MySQL store: transactional insert of the mon plus its moves. */
function createMysqlPartyStore(pool) {
	return {
		async list(trainerId) {
			const [rows] = await pool.query(
				`SELECT id, trainer_id, pokemon_id, nickname, level, current_hp, max_hp,
                attack, defense, speed, special_atk, special_def, experience, status, gender, position
         FROM trainer_pokemon WHERE trainer_id = ? AND in_pc = 0 ORDER BY position ASC`,
				[trainerId]
			);
			return rows;
		},
		async listPc(trainerId) {
			const [rows] = await pool.query(
				`SELECT id, trainer_id, pokemon_id, nickname, level, current_hp, max_hp,
                attack, defense, speed, special_atk, special_def, experience, status, gender, position
         FROM trainer_pokemon WHERE trainer_id = ? AND in_pc = 1 ORDER BY position ASC`,
				[trainerId]
			);
			return rows;
		},
		async moveToPc(trainerId, id, pcPosition) {
			await pool.query(`UPDATE trainer_pokemon SET in_pc = 1, position = ? WHERE id = ? AND trainer_id = ?`, [
				pcPosition,
				id,
				trainerId,
			]);
		},
		async setLayout(trainerId, partyIds, pcIds) {
			const connection = await pool.getConnection();
			try {
				await connection.beginTransaction();
				const write = (id, inPc, position) =>
					connection.query(
						`UPDATE trainer_pokemon SET in_pc = ?, position = ? WHERE id = ? AND trainer_id = ?`,
						[inPc, position, id, trainerId]
					);
				for (const [i, id] of partyIds.entries()) await write(id, 0, i + 1);
				for (const [i, id] of pcIds.entries()) await write(id, 1, i + 1);
				await connection.commit();
			} catch (txError) {
				await connection.rollback();
				throw txError;
			} finally {
				connection.release();
			}
		},
		async insert(trainerId, mon, moves, position) {
			const connection = await pool.getConnection();
			try {
				await connection.beginTransaction();
				const [result] = await connection.query(
					`INSERT INTO trainer_pokemon
             (trainer_id, pokemon_id, nickname, level, current_hp, max_hp,
              attack, defense, speed, special_atk, special_def, experience, status, gender, position)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					[
						trainerId,
						mon.pokemon_id,
						mon.nickname,
						mon.level,
						mon.current_hp,
						mon.max_hp,
						mon.attack,
						mon.defense,
						mon.speed,
						mon.special_atk,
						mon.special_def,
						mon.experience ?? 0,
						mon.status ?? "Healthy",
						mon.gender ?? null,
						position,
					]
				);
				const trainerPokemonId = result.insertId;
				for (const move of moves || []) {
					await connection.query(
						`INSERT INTO trainer_pokemon_moves
               (trainer_pokemon_id, move_id, current_pp)
             VALUES (?, ?, ?)`,
						[trainerPokemonId, move.move_id, move.pp || 0]
					);
				}
				await connection.commit();
				return trainerPokemonId;
			} catch (txError) {
				await connection.rollback();
				throw txError;
			} finally {
				connection.release();
			}
		},
		async remove(trainerId, position) {
			const connection = await pool.getConnection();
			try {
				await connection.beginTransaction();
				const [rows] = await connection.query(
					`SELECT id FROM trainer_pokemon WHERE trainer_id = ? AND position = ? AND in_pc = 0`,
					[trainerId, position]
				);
				if (!rows.length) {
					await connection.rollback();
					return false;
				}
				const rowId = rows[0].id;
				// No ON DELETE CASCADE on trainer_pokemon_moves: moves first.
				await connection.query(
					`DELETE FROM trainer_pokemon_moves WHERE trainer_pokemon_id = ?`,
					[rowId]
				);
				await connection.query(
					`DELETE FROM trainer_pokemon WHERE id = ?`,
					[rowId]
				);
				await connection.commit();
				return true;
			} catch (txError) {
				await connection.rollback();
				throw txError;
			} finally {
				connection.release();
			}
		},
		async setCurrentHp(trainerId, position, currentHp) {
			const [result] = await pool.query(
				`UPDATE trainer_pokemon SET current_hp = ?
         WHERE trainer_id = ? AND position = ? AND in_pc = 0`,
				[currentHp, trainerId, position]
			);
			return result.affectedRows > 0;
		},
		async updateAtPosition(trainerId, position, fields) {
			// Evolution write: species + recomputed stats; level/experience
			// and moves are intentionally untouched.
			const [result] = await pool.query(
				`UPDATE trainer_pokemon
         SET pokemon_id = ?, nickname = ?, max_hp = ?, current_hp = ?,
             attack = ?, defense = ?, speed = ?, special_atk = ?, special_def = ?
         WHERE trainer_id = ? AND position = ? AND in_pc = 0`,
				[
					fields.pokemon_id,
					fields.nickname,
					fields.max_hp,
					fields.current_hp,
					fields.attack,
					fields.defense,
					fields.speed,
					fields.special_atk,
					fields.special_def,
					trainerId,
					position,
				]
			);
			return result.affectedRows > 0;
		},
	};
}

function createPartyService(deps = {}) {
	let store = deps.store || null;
	function getStore() {
		if (!store) {
			// Lazy so requiring this module never opens a DB connection
			// (keeps unit tests free of MySQL).
			store = createMysqlPartyStore(require("../config/trainerdb"));
		}
		return store;
	}

	async function getPartyRows(trainerId) {
		return getStore().list(trainerId);
	}

	/**
	 * Adds a Pokémon to the trainer's party in the lowest free position.
	 * Throws PartyError(400) when the party already holds MAX_PARTY Pokémon.
	 * `mon` carries the stat columns; `moves` is [{ move_id, pp? }].
	 */
	async function addPokemon(trainerId, mon, moves = []) {
		const rows = await getStore().list(trainerId);
		if (rows.length >= MAX_PARTY) {
			throw new PartyError(400, PARTY_FULL_MESSAGE);
		}
		const taken = new Set(rows.map((row) => Number(row.position)));
		let position = 1;
		while (taken.has(position) && position <= MAX_PARTY) {
			position += 1;
		}
		if (position > MAX_PARTY) {
			throw new PartyError(400, PARTY_FULL_MESSAGE);
		}
		const monWithGender = {
			...mon,
			gender: mon.gender ?? rollGenderForSpecies(mon.pokemon_id),
		};
		const id = await getStore().insert(trainerId, monWithGender, moves, position);
		return { id, position };
	}

	/**
	 * Removes the Pokémon at `position` (moves + row). Used by the boss
	 * reward replacement flow. Throws PartyError(400) if the slot is empty.
	 */
	async function removeByPosition(trainerId, position) {
		const removed = await getStore().remove(trainerId, position);
		if (!removed) {
			throw new PartyError(400, "No Pokémon at that party position");
		}
		return true;
	}

	/**
	 * Persists a stored-HP change for the mon at `position` (overworld
	 * healing). Callers clamp to max_hp; battle HP stays session-local.
	 */
	async function setCurrentHpByPosition(trainerId, position, currentHp) {
		const updated = await getStore().setCurrentHp(
			trainerId,
			position,
			currentHp
		);
		if (!updated) {
			throw new PartyError(400, "No Pokémon at that party position");
		}
		return true;
	}

	/**
	 * Persists an evolution write (species id, nickname, recomputed stats)
	 * for the mon at `position`. Level, experience, and moves stay as they
	 * are — evolutionService owns the field math.
	 */
	async function updatePokemonByPosition(trainerId, position, fields) {
		const updated = await getStore().updateAtPosition(
			trainerId,
			position,
			fields
		);
		if (!updated) {
			throw new PartyError(400, "No Pokémon at that party position");
		}
		return true;
	}

	async function getPcRows(trainerId) {
		return getStore().listPc(trainerId);
	}

	/**
	 * Sets the whole layout at once: `party` is the new party order (ids,
	 * lead first) and `pc` the PC box order. Both lists together must name
	 * exactly the Pokémon the trainer owns; the party keeps 1..MAX_PARTY.
	 * Covers reorder, deposit, withdraw and swap in one validated write.
	 */
	async function arrange(trainerId, { party, pc }) {
		const [partyRows, pcRows] = await Promise.all([getStore().list(trainerId), getStore().listPc(trainerId)]);
		const owned = new Set([...partyRows, ...pcRows].map((r) => Number(r.id)));
		const partyIds = (party || []).map(Number);
		const pcIds = (pc || []).map(Number);
		const all = [...partyIds, ...pcIds];
		if (new Set(all).size !== all.length || all.length !== owned.size || !all.every((id) => owned.has(id))) {
			throw new PartyError(400, "Layout must list each of your Pokémon exactly once");
		}
		if (partyIds.length < 1) throw new PartyError(400, "Keep at least one Pokémon in your party");
		if (partyIds.length > MAX_PARTY) throw new PartyError(400, PARTY_FULL_MESSAGE);
		await getStore().setLayout(trainerId, partyIds, pcIds);
		return { party: await getStore().list(trainerId), pc: await getStore().listPc(trainerId) };
	}

	/** Sends the party member at `position` to the end of the PC box. */
	async function depositByPosition(trainerId, position) {
		const [partyRows, pcRows] = await Promise.all([getStore().list(trainerId), getStore().listPc(trainerId)]);
		const mon = partyRows.find((r) => Number(r.position) === Number(position));
		if (!mon) throw new PartyError(400, "No Pokémon at that party position");
		if (partyRows.length <= 1) throw new PartyError(400, "Keep at least one Pokémon in your party");
		// Party positions are left as-is so the next addPokemon refills the
		// freed slot (reward replacement keeps the newcomer in that spot).
		await getStore().moveToPc(trainerId, mon.id, pcRows.length + 1);
		return true;
	}

	return {
		getPartyRows,
		getPcRows,
		arrange,
		depositByPosition,
		addPokemon,
		removeByPosition,
		setCurrentHpByPosition,
		updatePokemonByPosition,
	};
}

const defaultService = createPartyService();

module.exports = {
	MAX_PARTY,
	PartyError,
	createPartyService,
	createMemoryPartyStore,
	createMysqlPartyStore,
	getPartyRows: defaultService.getPartyRows,
	getPcRows: defaultService.getPcRows,
	arrange: defaultService.arrange,
	depositByPosition: defaultService.depositByPosition,
	addPokemon: defaultService.addPokemon,
	removeByPosition: defaultService.removeByPosition,
	setCurrentHpByPosition: defaultService.setCurrentHpByPosition,
	updatePokemonByPosition: defaultService.updatePokemonByPosition,
};
