const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../config/trainerdb");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/env");

const saltRounds = 10;

class ServiceError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

async function login({ email, password }) {
	const selectQuery =
		"SELECT trainer_id, name, email, gender, level, created_at, password FROM trainers WHERE email = ?";
	const [rows] = await pool.query(selectQuery, [email]);
	if (rows.length === 0) {
		throw new ServiceError(400, "Trainer not found.");
	}

	const trainer = rows[0];
	const isMatch = await bcrypt.compare(password, trainer.password);
	if (!isMatch) {
		throw new ServiceError(400, "Incorrect password.");
	}

	delete trainer.password;
	const token = jwt.sign(
		{ trainer_id: trainer.trainer_id },
		JWT_SECRET,
		{ expiresIn: JWT_EXPIRES_IN }
	);
	return { user: trainer, token };
}

async function register({ name, email, gender, password }) {
	const selectQuery = "SELECT trainer_id FROM trainers WHERE email = ?";
	const [existingRows] = await pool.query(selectQuery, [email]);
	if (existingRows.length > 0) {
		throw new ServiceError(
			400,
			"A trainer with this email already exists. Please log in."
		);
	}

	const hashedPassword = await bcrypt.hash(password, saltRounds);
	const insertQuery =
		"INSERT INTO trainers (name, email, gender, password) VALUES (?, ?, ?, ?)";
	const [insertResults] = await pool.query(insertQuery, [
		name,
		email,
		gender,
		hashedPassword,
	]);
	const trainerId = insertResults.insertId;

	const fetchQuery =
		"SELECT trainer_id, name, email, gender, level, created_at FROM trainers WHERE trainer_id = ?";
	const [rows] = await pool.query(fetchQuery, [trainerId]);
	if (rows.length === 0) {
		throw new ServiceError(404, "Trainer not found after registration.");
	}

	const token = jwt.sign(
		{ trainer_id: rows[0].trainer_id },
		JWT_SECRET,
		{ expiresIn: JWT_EXPIRES_IN }
	);
	return { user: rows[0], token };
}

async function getTrainerCount() {
	const countQuery = "SELECT COUNT(*) AS count FROM trainers";
	const [rows] = await pool.query(countQuery);
	return rows[0].count;
}

async function validateTrainer(trainerId) {
	const query =
		"SELECT trainer_id, name, email, gender, level, created_at FROM trainers WHERE trainer_id = ?";
	const [rows] = await pool.query(query, [trainerId]);
	if (rows.length === 0) {
		throw new ServiceError(404, "User not found");
	}

	const [pokemonRows] = await pool.query(
		"SELECT id, trainer_id, pokemon_id, nickname, level, current_hp, max_hp, attack, defense, speed, special_atk, special_def, experience, status, position FROM trainer_pokemon WHERE trainer_id = ?",
		[trainerId]
	);

	const userData = rows[0];
	if (pokemonRows.length > 0) {
		userData.starterChosen = true;
		userData.starter = pokemonRows[0].nickname;
		userData.pokemons = pokemonRows;
	} else {
		userData.starterChosen = false;
		userData.starter = null;
		userData.pokemons = [];
	}
	return userData;
}

module.exports = {
	ServiceError,
	login,
	register,
	getTrainerCount,
	validateTrainer,
};
