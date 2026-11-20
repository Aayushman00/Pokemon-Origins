import { describe, it, expect } from "vitest";
import { bannerText } from "./BattleStage";

describe("battle end banner", () => {
	it("names each ending, not just win or lose", () => {
		expect(bannerText({ result: "win" })).toBe("Victory!");
		expect(bannerText({ result: "lose" })).toBe("Defeated");
		expect(bannerText({ result: "caught", name: "Pidgey" })).toBe("Gotcha!");
		expect(bannerText({ result: "watched", name: "Ash" })).toBe("Ash wins!");
		expect(bannerText({ result: "watched", name: null })).toBe("Match over");
	});
});
