import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import useBattle from "./useBattle";
import { api } from "../../api";

vi.mock("./sfx", () => ({ play: vi.fn(), isSoundOn: () => false, setSoundOn: vi.fn() }));

const mon = (over) => ({ position: 1, pokemon_id: 4, nickname: "Charmander", level: 5, current_hp: 20, max_hp: 20, moves: [{ move_id: 10, name: "Scratch", move_type: "Normal", current_pp: 35, max_pp: 35 }], ...over });
const foe = (over) => ({ position: 1, pokemon_id: 19, nickname: "Rattata", level: 4, current_hp: 15, max_hp: 15, moves: [], ...over });
const state = (over) => ({
	sessionId: "s1",
	status: "active",
	battleType: "trainer",
	trainerName: "Joey",
	player: mon(),
	enemy: foe(),
	party: [mon()],
	enemyParty: [foe()],
	activePosition: 1,
	requiresSwitch: false,
	...over,
});

describe("useBattle", () => {
	beforeEach(() => vi.restoreAllMocks());

	it("plays the intro and hands control to the command menu", async () => {
		vi.spyOn(api, "post").mockResolvedValueOnce({ data: { success: true, state: state() } });
		const { result } = renderHook(() => useBattle({ levelNumber: 1, battleNumber: 1, trainerId: 9 }));
		await waitFor(() => expect(result.current.phase).toBe("command"));
		expect(result.current.log).toEqual(["Joey wants to battle!", "Joey sent out Rattata!", "Go! Charmander!"]);
		expect(result.current.fx.player.hidden).toBe(false);
	});

	it("resolves a round from server events and finishes on a win", async () => {
		const onBattleWon = vi.fn();
		const post = vi.spyOn(api, "post");
		post.mockResolvedValueOnce({ data: { success: true, state: state() } });
		const { result } = renderHook(() => useBattle({ levelNumber: 1, battleNumber: 1, trainerId: 9, onBattleWon }));
		await waitFor(() => expect(result.current.phase).toBe("command"));

		post.mockResolvedValueOnce({
			data: {
				success: true,
				state: state({ status: "won", enemy: foe({ current_hp: 0 }) }),
				progress: { current_level: 1, current_battle: 2 },
				events: [
					{ actor: "player", moveName: "Scratch", moveType: "Normal", result: "hit", type_multiplier: 1, damage: 15, targetHpAfter: 0, targetFainted: true },
					{ type: "xp_gain", position: 1, nickname: "Charmander", amount: 24, xp: 24, xpToNext: 60, level: 5 },
				],
			},
		});
		await act(async () => result.current.chooseMove(result.current.player.moves[0]));
		await waitFor(() => expect(result.current.phase).toBe("finished"));

		expect(post).toHaveBeenLastCalledWith("/api/battle/action", { sessionId: "s1", action: { type: "move", moveId: 10 } });
		expect(result.current.log).toContain("Charmander used SCRATCH!");
		expect(result.current.log).toContain("Rattata fainted!");
		expect(result.current.outcome).toEqual({ result: "win", name: "Charmander" });
		expect(result.current.rewards).toEqual(["Charmander gained 24 EXP. Points!"]);
		expect(onBattleWon).toHaveBeenCalledWith({ current_level: 1, current_battle: 2 });
	});

	it("settles a move offer on the battlefield before finishing", async () => {
		const post = vi.spyOn(api, "post");
		post.mockResolvedValueOnce({ data: { success: true, state: state() } });
		const { result } = renderHook(() => useBattle({ levelNumber: 1, battleNumber: 1, trainerId: 9 }));
		await waitFor(() => expect(result.current.phase).toBe("command"));

		const offer = { pendingId: 7, position: 1, nickname: "Charmander", move: { move_id: 52, name: "Ember" }, currentMoves: [] };
		const other = { ...offer, pendingId: 8, move: { move_id: 99, name: "Rage" } }; // older, left for the hub
		vi.spyOn(api, "get").mockResolvedValueOnce({ data: { success: true, pending: [other, offer] } });
		post.mockResolvedValueOnce({
			data: {
				success: true,
				state: state({ status: "won", enemy: foe({ current_hp: 0 }) }),
				progress: { current_level: 1, current_battle: 2 },
				events: [{ type: "move_learn_available", position: 1, nickname: "Charmander", moveId: 52, moveName: "Ember" }],
			},
		});
		await act(async () => result.current.chooseMove(result.current.player.moves[0]));
		await waitFor(() => expect(result.current.phase).toBe("moveLearn"));
		expect(result.current.learnOffer.pendingId).toBe(7);
		expect(result.current.outcome).toBe(null);

		post.mockResolvedValueOnce({ data: { success: true, result: { action: "learn", learned: { name: "Ember" }, forgot: { name: "Growl" } } } });
		await act(async () => result.current.resolveLearn("learn", 45));
		await waitFor(() => expect(result.current.phase).toBe("finished"));
		expect(post).toHaveBeenLastCalledWith("/api/moves/learn", { pendingId: 7, action: "learn", forgetMoveId: 45 });
		expect(result.current.log).toContain("1, 2, and... Poof! Charmander forgot GROWL.");
		expect(result.current.log).toContain("Charmander learned EMBER!");
		expect(result.current.rewards).toEqual([]);
	});

	it("still finishes the battle when move offers can't load", async () => {
		const post = vi.spyOn(api, "post");
		post.mockResolvedValueOnce({ data: { success: true, state: state() } });
		const { result } = renderHook(() => useBattle({ levelNumber: 1, battleNumber: 1, trainerId: 9 }));
		await waitFor(() => expect(result.current.phase).toBe("command"));
		vi.spyOn(api, "get").mockRejectedValueOnce(new Error("down"));
		post.mockResolvedValueOnce({
			data: {
				success: true,
				state: state({ status: "won", enemy: foe({ current_hp: 0 }) }),
				progress: { current_level: 1, current_battle: 2 },
				events: [{ type: "move_learn_available", position: 1, nickname: "Charmander", moveId: 52, moveName: "Ember" }],
			},
		});
		await act(async () => result.current.chooseMove(result.current.player.moves[0]));
		await waitFor(() => expect(result.current.phase).toBe("finished"));
	});

	it("turns a 400 rule rejection into a message and gives the menu back", async () => {
		const post = vi.spyOn(api, "post");
		post.mockResolvedValueOnce({ data: { success: true, state: state() } });
		const { result } = renderHook(() => useBattle({ levelNumber: 1, battleNumber: 1, trainerId: 9 }));
		await waitFor(() => expect(result.current.phase).toBe("command"));
		post.mockRejectedValueOnce({ response: { status: 400, data: { error: "It's already at full HP" } } });
		await act(async () => result.current.chooseItem({ itemId: 1 }));
		await waitFor(() => expect(result.current.phase).toBe("command"));
		expect(result.current.error).toBe("");
		expect(result.current.log).toContain("It's already at full HP");
	});

	it("uses an injected PvP transport instead of the REST api", async () => {
		const post = vi.spyOn(api, "post");
		const pvpState = (over) => state({ battleType: "pvp", trainerName: "Gary", pvp: { opponent: "Gary" }, ...over });
		const end = { winnerId: 9, endedBy: "ko", rating: { rating: 1016, delta: 16, rated: true } };
		const transport = {
			start: vi.fn(async () => ({ success: true, state: pvpState() })),
			act: vi.fn(async () => ({
				success: true,
				state: pvpState({ status: "won", enemy: foe({ current_hp: 0 }) }),
				events: [{ actor: "player", moveName: "Scratch", moveType: "Normal", result: "hit", type_multiplier: 1, damage: 15, targetHpAfter: 0, targetFainted: true }],
				pvpEnd: end,
			})),
			forfeit: vi.fn(),
			onEnd: () => () => {},
		};
		const { result } = renderHook(() => useBattle({ trainerId: 9, transport }));
		await waitFor(() => expect(result.current.phase).toBe("command"));
		await act(async () => result.current.chooseMove(result.current.player.moves[0]));
		await waitFor(() => expect(result.current.phase).toBe("finished"));
		expect(post).not.toHaveBeenCalled();
		expect(transport.act).toHaveBeenCalledWith({ type: "move", moveId: 10 });
		expect(result.current.outcome).toEqual({ result: "win", name: "Charmander", pvp: end });
		expect(result.current.progressSave).toBe("saved");
		result.current.forfeit();
		expect(transport.forfeit).toHaveBeenCalled();
	});

	it("finishes when a PvP match ends while waiting at the menu", async () => {
		let ended;
		const transport = {
			start: async () => ({ success: true, state: state({ battleType: "pvp", pvp: { opponent: "Gary" } }) }),
			act: vi.fn(),
			forfeit: vi.fn(),
			onEnd: (cb) => ((ended = cb), () => {}),
		};
		const { result } = renderHook(() => useBattle({ trainerId: 9, transport }));
		await waitFor(() => expect(result.current.phase).toBe("command"));
		const end = { winnerId: 9, endedBy: "disconnect", rating: null, state: state({ battleType: "pvp", status: "won" }) };
		await act(async () => ended(end));
		await waitFor(() => expect(result.current.phase).toBe("finished"));
		expect(result.current.outcome).toEqual({ result: "win", name: "Charmander", pvp: end });
	});

	it("a watch transport plays pushed rounds without a menu and ends on the winner", async () => {
		const post = vi.spyOn(api, "post");
		const watchState = (over) => state({ battleType: "pvp", trainerName: "Gary", pvp: { spectator: true, names: { player: "Ash", enemy: "Gary" } }, ...over });
		const hit = { actor: "player", moveName: "Scratch", moveType: "Normal", result: "hit", type_multiplier: 1, damage: 5, targetHpAfter: 10, targetFainted: false };
		const feed = [
			{ events: [hit], state: watchState({ enemy: foe({ current_hp: 10 }) }) },
			{ events: [], state: watchState({ status: "won", enemy: foe({ current_hp: 0 }) }) }, // the KO round
			{ end: { winnerName: "Ash", endedBy: "ko", state: watchState({ status: "won", enemy: foe({ current_hp: 0 }) }) } },
		];
		const phases = [];
		const transport = { watch: true, start: async () => ({ success: true, state: watchState() }), nextRound: vi.fn(async () => feed.shift()), act: vi.fn(), forfeit: vi.fn() };
		const { result } = renderHook(() => {
			const b = useBattle({ trainerId: 9, transport });
			phases.push(b.phase);
			return b;
		});
		await waitFor(() => expect(result.current.phase).toBe("finished"), { timeout: 8000 });
		expect(result.current.outcome).toEqual({ result: "watched", name: "Ash" });
		expect(result.current.log).toContain("Charmander used SCRATCH!");
		expect(phases).toContain("watching");
		expect(phases).not.toContain("command");
		expect(transport.act).not.toHaveBeenCalled();
		expect(post).not.toHaveBeenCalled();
	});

	describe("catching", () => {
		const potion = { itemId: 1, name: "Potion", category: "healing", quantity: 1, usableInBattle: true };
		const ball = { itemId: 9, name: "Poké Ball", category: "ball", quantity: 3, usableInBattle: true };
		const startWith = async (battleType) => {
			const post = vi.spyOn(api, "post");
			post.mockResolvedValueOnce({ data: { success: true, state: state({ battleType }) } });
			vi.spyOn(api, "get").mockResolvedValueOnce({ data: { success: true, items: [potion, ball] } });
			const props = battleType === "wild" ? { wild: "route_1", trainerId: 9 } : { levelNumber: 1, battleNumber: 1, trainerId: 9 };
			const { result } = renderHook(() => useBattle(props));
			await waitFor(() => expect(result.current.phase).toBe("command"));
			await act(async () => result.current.openBag());
			return { post, result };
		};

		it("only offers balls in a wild battle", async () => {
			const { result } = await startWith("trainer");
			expect(result.current.bagItems.map((i) => i.itemId)).toEqual([1]);
		});

		it("a ball throws a catch and a catch ends the battle", async () => {
			const { post, result } = await startWith("wild");
			expect(result.current.bagItems.map((i) => i.itemId)).toEqual([1, 9]);
			post.mockResolvedValueOnce({
				data: {
					success: true,
					state: state({ battleType: "wild", status: "caught" }),
					progress: { wild: true, caught: { nickname: "Rattata", inPc: false } },
					events: [{ actor: "player", type: "catch", itemId: 9, itemName: "Poké Ball", nickname: "Rattata", shakes: 3, caught: true, inPc: false }],
				},
			});
			await act(async () => result.current.chooseItem(ball));
			await waitFor(() => expect(result.current.phase).toBe("finished"));
			expect(post).toHaveBeenLastCalledWith("/api/battle/action", { sessionId: "s1", action: { type: "catch", itemId: 9 } });
			expect(result.current.log).toContain("Gotcha! Rattata was caught!");
			expect(result.current.outcome).toEqual({ result: "caught", name: "Rattata", inPc: false });
		});
	});
});
