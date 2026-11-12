import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StarterPick from "./StarterPick";
import { api } from "../../../api";

const STARTERS = [
	{ id: 1, name: "Bulbasaur", pokemon_id: 1, types: ["grass"] },
	{ id: 4, name: "Charmander", pokemon_id: 4, types: ["fire"] },
	{ id: 7, name: "Squirtle", pokemon_id: 7, types: ["water"] },
];

describe("StarterPick in the lab overlay", () => {
	afterEach(() => vi.restoreAllMocks());

	it("hands the updated trainer to onDone once the server takes the pick, without the page wrapper", async () => {
		vi.spyOn(api, "get").mockResolvedValue({ data: { starters: STARTERS } });
		const post = vi.spyOn(api, "post").mockResolvedValue({ data: { success: true } });
		const setUser = vi.fn();
		const onDone = vi.fn();
		const { container } = render(<StarterPick user={{ name: "Red", starterChosen: false }} setUser={setUser} onDone={onDone} />);

		fireEvent.click(await screen.findByRole("radio", { name: /Charmander/ }));
		fireEvent.click(screen.getByRole("button", { name: "Yes, I choose you" }));

		await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1), { timeout: 3000 });
		expect(post).toHaveBeenCalledWith("/api/choose-starter", { chosenPokemon: 4 });
		expect(onDone.mock.calls[0][0]).toMatchObject({ starterChosen: true, starter: 4 });
		expect(setUser).toHaveBeenCalledWith(expect.objectContaining({ starterChosen: true }));
		expect(container.firstChild.classList.contains("page")).toBe(false);
	});
});
