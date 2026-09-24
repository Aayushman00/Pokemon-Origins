import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DialogueBox from "./DialogueBox";
import MenuList from "./MenuList";
import TrainerTrigger from "./TrainerHoverCard";
import { api } from "../../api";

describe("DialogueBox", () => {
	it("exposes the whole line to screen readers and advances on click once shown", () => {
		const onAdvance = vi.fn();
		render(<DialogueBox text="Charmander used EMBER!" onAdvance={onAdvance} />);
		expect(screen.getByText("Charmander used EMBER!", { selector: "[aria-live]" })).toBeTruthy();
		fireEvent.click(screen.getByText("Charmander used EMBER!", { selector: "[aria-live]" }).parentElement);
		expect(onAdvance).toHaveBeenCalledTimes(1);
	});

	it("reports a fast-forward press through onSkip (Enter key)", () => {
		const onSkip = vi.fn();
		render(<DialogueBox text="Go! Pikachu!" onSkip={onSkip} />);
		fireEvent.keyDown(window, { key: "Enter" });
		expect(onSkip).toHaveBeenCalled();
	});
});

describe("MenuList", () => {
	const items = (onSelect) => [
		{ id: "fight", label: "Fight", onSelect: () => onSelect("fight") },
		{ id: "bag", label: "Bag", onSelect: () => onSelect("bag") },
		{ id: "mon", label: "Pokémon", onSelect: () => onSelect("mon") },
		{ id: "run", label: "Restart", disabled: true, onSelect: () => onSelect("run") },
	];

	it("moves the cursor with arrows in a grid and selects with Enter (global keys)", () => {
		const onSelect = vi.fn();
		render(<MenuList items={items(onSelect)} columns={2} globalKeys label="Commands" />);
		fireEvent.keyDown(window, { key: "ArrowDown" });
		fireEvent.keyDown(window, { key: "Enter" });
		expect(onSelect).toHaveBeenCalledWith("mon");
		expect(screen.getByRole("button", { name: /Pokémon/ }).className).toContain("is-active");
	});

	it("goes back on Escape and never selects a disabled row", () => {
		const onSelect = vi.fn();
		const onBack = vi.fn();
		render(<MenuList items={items(onSelect)} label="Commands" onBack={onBack} />);
		const restart = screen.getByRole("button", { name: /Restart/ });
		expect(restart.disabled).toBe(true);
		fireEvent.click(restart);
		expect(onSelect).not.toHaveBeenCalled();
		fireEvent.keyDown(screen.getByRole("list"), { key: "Escape" });
		expect(onBack).toHaveBeenCalled();
	});
});

describe("TrainerTrigger hover card", () => {
	const renderTrigger = (props) =>
		render(
			<MemoryRouter>
				<TrainerTrigger {...props}>{props.name}</TrainerTrigger>
			</MemoryRouter>
		);

	it("shows an unregistered-trainer card for Playground guests without fetching", async () => {
		const get = vi.spyOn(api, "get");
		renderTrigger({ trainerId: "guest-abc", name: "Guest1234", online: true });
		fireEvent.click(screen.getByRole("button", { name: /Guest1234/ }));
		expect(await screen.findByText("Unregistered trainer")).toBeTruthy();
		expect(screen.queryByText(/Wins/)).toBeNull();
		expect(get).not.toHaveBeenCalled();
		get.mockRestore();
	});

	it("says Unknown trainer when the profile 404s, with no invented stats", async () => {
		const get = vi.spyOn(api, "get").mockRejectedValue({ response: { status: 404 } });
		renderTrigger({ trainerId: 404404, name: "Ghost" });
		fireEvent.click(screen.getByRole("button", { name: /Ghost/ }));
		expect(await screen.findByText("Unknown trainer")).toBeTruthy();
		expect(screen.queryByText("Wins")).toBeNull();
		get.mockRestore();
	});

	it("renders a registered trainer's real record, streak, motto and party", async () => {
		const profile = {
			trainer_id: 77,
			name: "Red",
			campaign: { current_level: 3, level_name: "Vermilion City", battles_cleared: 14, total_battles: 50, champion: false },
			record: { wins: 5, losses: 2, battles: 7, win_rate: 71.4, streak: { type: "Win", count: 3 } },
			card: { theme: "ember", motto: "Fire first!", favorite: null },
			party: [{ position: 1, pokemon_id: 5, nickname: "Charmeleon", level: 17 }],
		};
		const get = vi.spyOn(api, "get").mockResolvedValue({ data: { success: true, profile } });
		renderTrigger({ trainerId: 77, name: "Red", online: true });
		fireEvent.click(screen.getByRole("button", { name: /Red/ }));
		await waitFor(() => expect(screen.getByText("71.4%")).toBeTruthy());
		expect(screen.getByText("3 wins")).toBeTruthy();
		expect(screen.getByText(/Fire first!/)).toBeTruthy();
		expect(screen.getByText("Charmeleon")).toBeTruthy();
		expect(screen.getByText("Online in the playground")).toBeTruthy();
		get.mockRestore();
	});
});
