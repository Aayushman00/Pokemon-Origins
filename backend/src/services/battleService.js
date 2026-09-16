const axios = require("axios");
const { BATTLE_ENGINE_URL } = require("../config/env");
const campaignService = require("./campaignService");

const client = axios.create({
	baseURL: BATTLE_ENGINE_URL,
	timeout: 15000,
	headers: { "Content-Type": "application/json" },
});

function proxyError(err) {
	if (err.response) {
		const detail =
			err.response.data?.detail ||
			err.response.data?.error ||
			err.response.data?.message ||
			"Battle engine error";
		const error =
			typeof detail === "string" ? detail : JSON.stringify(detail);
		const error_ = new Error(error);
		error_.status = err.response.status;
		error_.upstream = err.response.data;
		throw error_;
	}
	const error_ = new Error("Battle engine unreachable");
	error_.status = 502;
	throw error_;
}

async function getLevel1() {
	return campaignService.getLegacyLevel1();
}

async function calculateDamage(payload) {
	try {
		const { data } = await client.post("/calculate_damage/", payload);
		return data;
	} catch (err) {
		proxyError(err);
	}
}

async function turnOrder(pokemon1, pokemon2, priorities = {}) {
	try {
		const { data } = await client.post("/turn_order/", {
			pokemon1,
			pokemon2,
			priority1: priorities.priority1 ?? 0,
			priority2: priorities.priority2 ?? 0,
		});
		return data;
	} catch (err) {
		proxyError(err);
	}
}

module.exports = {
	getLevel1,
	calculateDamage,
	turnOrder,
};
