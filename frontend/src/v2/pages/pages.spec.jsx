import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ChatLog, Composer } from "./playground/ChatParts";
import PartyBoard from "./hub/PartyBoard";
import { ToastProvider } from "../ui/Toast";

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("Playground chat", () => {
	it("tags guests and channels, and invites the first message when empty", () => {
		const { rerender } = wrap(<ChatLog messages={[]} selfId="guest-me" onlineIds={new Set()} />);
		expect(screen.getByText(/No one has said anything yet/)).toBeTruthy();
		rerender(
			<MemoryRouter>
				<ChatLog
					selfId="guest-me"
					onlineIds={new Set([7])}
					messages={[
						{ trainerId: 7, name: "Red", text: "Anyone up for a battle?", ts: 1, broadcast: false },
						{ trainerId: "guest-x", name: "Guest1", text: "hi all", ts: 2, broadcast: true },
					]}
				/>
			</MemoryRouter>
		);
		expect(screen.getByText("Nearby")).toBeTruthy();
		expect(screen.getByText("Everyone")).toBeTruthy();
		expect(screen.getByText("Guest")).toBeTruthy();
		expect(screen.getByRole("button", { name: /Red: trainer profile/ })).toBeTruthy();
	});

	it("sends to Everyone when that channel is picked and clears the box", () => {
		const onSend = vi.fn(() => true);
		wrap(<Composer onSend={onSend} />);
		fireEvent.click(screen.getByRole("radio", { name: "Everyone" }));
		const input = screen.getByLabelText("Message");
		fireEvent.change(input, { target: { value: "hello map" } });
		fireEvent.submit(input.closest("form"));
		expect(onSend).toHaveBeenCalledWith("hello map", { everyone: true });
		expect(input.value).toBe("");
	});
});

describe("PartyBoard + PC buttons", () => {
	const party = [
		{ id: 1, position: 1, pokemon_id: 4, nickname: "Charmander", level: 5, current_hp: 20, max_hp: 20 },
		{ id: 2, position: 2, pokemon_id: 16, nickname: "Pidgey", level: 6, current_hp: 20, max_hp: 20 },
	];
	const pc = [{ id: 9, pokemon_id: 25, nickname: "Pikachu", level: 7, current_hp: 21, max_hp: 21 }];
	const board = (onArrange) =>
		wrap(
			<ToastProvider>
				<PartyBoard party={party} pc={pc} onArrange={onArrange} />
			</ToastProvider>
		);

	it("Make lead and Send to PC write the new layout", async () => {
		const onArrange = vi.fn(async () => null);
		board(onArrange);
		fireEvent.click(screen.getAllByRole("button", { name: /Pidgey/ })[0]);
		fireEvent.click(screen.getByRole("button", { name: "Make lead" }));
		await waitFor(() => expect(onArrange).toHaveBeenLastCalledWith({ party: [2, 1], pc: [9] }));
		fireEvent.click(screen.getByRole("button", { name: "Send to PC" }));
		await waitFor(() => expect(onArrange).toHaveBeenLastCalledWith({ party: [1], pc: [9, 2] }));
	});

	it("takes a stored Pokémon into a party with room", async () => {
		const onArrange = vi.fn(async () => null);
		board(onArrange);
		fireEvent.click(screen.getByRole("button", { name: /Pikachu, level 7/ }));
		fireEvent.click(screen.getByRole("button", { name: "Take into party" }));
		await waitFor(() => expect(onArrange).toHaveBeenCalledWith({ party: [1, 2, 9], pc: [] }));
	});

	it("keeps the last party member out of the PC", () => {
		const onArrange = vi.fn();
		wrap(
			<ToastProvider>
				<PartyBoard party={[party[0]]} pc={[]} onArrange={onArrange} />
			</ToastProvider>
		);
		expect(screen.getByRole("button", { name: "Send to PC" }).disabled).toBe(true);
	});
});
