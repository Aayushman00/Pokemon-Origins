const trainer_db = require("../config/trainerdb");
const { ServiceError } = require("./authService");

async function getTrainerData(trainerId) {
	const [trainerRows] = await trainer_db.query(
		"SELECT trainer_id, name, email, gender, level, created_at FROM trainers WHERE trainer_id = ?",
		[trainerId]
	);
	if (trainerRows.length === 0) {
		throw new ServiceError(404, "Trainer not found");
	}
	const trainer = trainerRows[0];

	const [pokemonRows] = await trainer_db.query(
		`SELECT id, trainer_id, pokemon_id, nickname, level, current_hp, max_hp,
            attack, defense, speed, special_atk, special_def, experience, status, position
     FROM trainer_pokemon WHERE trainer_id = ? ORDER BY position ASC`,
		[trainerId]
	);

	const pokemonWithDetails = await Promise.all(
		pokemonRows.map(async (p) => {
			const moveQuery = `
        SELECT
          tpm.move_id,
          tpm.current_pp,
          m.name AS move_name,
          m.power,
          m.accuracy,
          m.pp AS base_pp,
          t.name AS move_type,
          NULL AS status_effect,
          NULL AS effect_chance
        FROM trainer_pokemon_moves tpm
        LEFT JOIN pokedex.\`Move\` m ON tpm.move_id = m.move_id
        LEFT JOIN \`pokedex\`.\`Type\` t ON m.type_id = t.type_id
        WHERE tpm.trainer_pokemon_id = ?
      `;
			const [moveRows] = await trainer_db.query(moveQuery, [p.id]);
			const moves = moveRows.map((row) => ({
				move_id: row.move_id,
				name: row.move_name,
				power: row.power,
				accuracy: row.accuracy ? row.accuracy / 100 : null,
				move_type: row.move_type,
				status_effect: row.status_effect,
				effect_chance: row.effect_chance,
				// PP (Phase 14): persisted current PP + catalog max. A NULL
				// current_pp (pre-migration row) counts as full.
				pp: row.base_pp,
				current_pp: row.current_pp == null ? row.base_pp : row.current_pp,
			}));

			// Ability (Phase 14): first non-hidden ability of the species
			// (lowest ability_id — documented rule). Absence is fine.
			const [abilityRows] = await trainer_db.query(
				`SELECT a.ability_id, a.name
         FROM \`pokedex\`.\`Pokemon_Ability\` pa
         JOIN \`pokedex\`.\`Ability\` a ON pa.ability_id = a.ability_id
         WHERE pa.pokemon_id = ? AND pa.is_hidden = 0
         ORDER BY a.ability_id ASC
         LIMIT 1`,
				[p.pokemon_id]
			);
			const ability = abilityRows.length
				? { id: abilityRows[0].ability_id, name: abilityRows[0].name }
				: null;

			const typeQuery = `
        SELECT t.name AS type_name
        FROM \`pokedex\`.\`Pokemon_Type\` pt
        JOIN \`pokedex\`.\`Type\` t ON pt.type_id = t.type_id
        WHERE pt.pokemon_id = ?
      `;
			const [typeRows] = await trainer_db.query(typeQuery, [p.pokemon_id]);
			const types = typeRows.map((r) => r.type_name);

			return {
				id: p.id,
				position: p.position,
				pokemon_id: p.pokemon_id,
				nickname: p.nickname,
				level: p.level,
				max_hp: p.max_hp,
				current_hp: p.current_hp,
				attack: p.attack,
				defense: p.defense,
				speed: p.speed,
				special_atk: p.special_atk,
				special_def: p.special_def,
				status: p.status,
				types,
				ability,
				moves,
			};
		})
	);

	return {
		trainer_id: trainer.trainer_id,
		name: trainer.name,
		pokemon: pokemonWithDetails,
	};
}

module.exports = { getTrainerData };
