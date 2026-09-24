import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planEvent } from "./battleBeats.js";

const view = {
	player: { nickname: "Charmander", position: 1, current_hp: 20, moves: [{ move_id: 10, current_pp: 35 }] },
	enemy: { nickname: "Rattata", position: 1, current_hp: 15 },
};
const ctx = { trainerName: "Joey", nextId: () => 7 };
const says = (steps) => steps.filter((s) => s.say !== undefined).map((s) => s.say);
const kinds = (steps) => steps.map((s) => Object.keys(s)[0]);

describe("planEvent: moves", () => {
	const hit = { actor: "player", moveName: "Ember", moveType: "Fire", result: "hit", type_multiplier: 2, damage: 9, targetHpAfter: 6 };

	it("orders text → attack → impact → tick → drain → result lines", () => {
		const { steps } = planEvent(hit, view, ctx);
		const order = kinds(steps);
		const i = (k) => order.indexOf(k);
		assert.ok(i("say") < i("stage"), "text before the projectile");
		assert.ok(order.lastIndexOf("stage") > i("say"));
		assert.ok(i("tick") < i("mon"), "damage number lands with the HP change");
		assert.deepEqual(says(steps), ["Charmander used EMBER!", "It's super effective!"]);
	});

	it("tags the impact with the move type and the defending side", () => {
		const { steps } = planEvent(hit, view, ctx);
		const impact = steps.find((s) => s.stage?.impact).stage.impact;
		assert.deepEqual(impact, { side: "enemy", type: "fire", key: 7 });
		assert.equal(steps.find((s) => s.stage?.projectile)?.stage.projectile.type, "fire");
	});

	it("carries the defender's new HP into the returned view", () => {
		const { view: next } = planEvent(hit, view, ctx);
		assert.equal(next.enemy.current_hp, 6);
		assert.equal(view.enemy.current_hp, 15, "input view is not mutated");
	});

	it("lunges for physical types and adds the faint beat on a KO", () => {
		const { steps } = planEvent({ actor: "enemy", moveName: "Tackle", moveType: "Normal", result: "hit", type_multiplier: 1, damage: 20, targetHpAfter: 0, targetFainted: true }, view, ctx);
		assert.ok(steps.some((s) => s.fx === "enemy" && s.patch.lunge));
		assert.ok(steps.some((s) => s.fx === "player" && s.patch.fainted));
		assert.deepEqual(says(steps).slice(-1), ["Charmander fainted!"]);
	});

	it("misses and immunities stop before any impact", () => {
		const miss = planEvent({ actor: "player", moveName: "Scratch", moveType: "Normal", result: "miss" }, view, ctx).steps;
		assert.ok(!miss.some((s) => s.stage?.impact));
		assert.deepEqual(says(miss), ["Charmander used SCRATCH!", "Charmander's attack missed!"]);
		const immune = planEvent({ actor: "player", moveName: "Scratch", moveType: "Normal", result: "failed", type_multiplier: 0 }, view, ctx).steps;
		assert.deepEqual(says(immune).slice(-1), ["It doesn't affect Rattata..."]);
	});
});

describe("planEvent: other events", () => {
	it("a switch replaces the player in the view and announces it", () => {
		const mon = { nickname: "Pidgey", position: 2 };
		const { steps, view: next } = planEvent({ type: "switch", pokemon: mon }, view, ctx);
		assert.equal(next.player, mon === next.player ? mon : next.player);
		assert.equal(next.player.nickname, "Pidgey");
		assert.deepEqual(says(steps), ["Go! Pidgey!"]);
	});

	it("an enemy send-out names the trainer and marks the old enemy fainted", () => {
		const { steps } = planEvent({ type: "enemy_send", position: 2, pokemon: { nickname: "Pidgey", position: 2 } }, view, ctx);
		assert.deepEqual(steps.find((s) => s.enemyFainted !== undefined), { enemyFainted: 1, position: 2 });
		assert.deepEqual(says(steps), ["Joey sent out Pidgey!"]);
	});

	it("pp_change silently patches only the player's matching move", () => {
		const { steps, view: next } = planEvent({ type: "pp_change", actor: "player", moveId: 10, currentPp: 34 }, view, ctx);
		assert.equal(says(steps).length, 0);
		assert.equal(next.player.moves[0].current_pp, 34);
	});

	it("burn chip drains HP and can faint", () => {
		const { steps } = planEvent({ type: "status_damage", target: "enemy", status: "brn", nickname: "Rattata", targetHpAfter: 0, targetFainted: true }, view, ctx);
		assert.deepEqual(says(steps), ["Rattata was hurt by its burn!", "Rattata fainted!"]);
	});
});
