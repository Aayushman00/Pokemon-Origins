import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { UserContext } from "../../data/user";
import HubScreen from "./HubScreen";
import { api } from "../../../api";

const renderHub = () =>
	render(
		<UserContext.Provider value={{ user: { name: "Red", trainer_id: 1, starterChosen: false }, setUser: () => {} }}>
			<MemoryRouter initialEntries={["/game"]}>
				<Routes>
					<Route path="/game" element={<HubScreen />} />
					<Route path="/overworld" element={<p>the overworld</p>} />
				</Routes>
			</MemoryRouter>
		</UserContext.Provider>
	);

describe("HubScreen without a starter", () => {
	afterEach(() => {
		localStorage.removeItem("po.flag.OVERWORLD");
		vi.restoreAllMocks();
	});

	it("sends a new trainer to the overworld, where the Professor hands out starters", async () => {
		localStorage.setItem("po.flag.OVERWORLD", "1");
		renderHub();
		expect(await screen.findByText("the overworld")).toBeTruthy();
	});

	it("keeps the hub's own lab when the overworld is off", async () => {
		localStorage.setItem("po.flag.OVERWORLD", "0");
		vi.spyOn(api, "get").mockResolvedValue({ data: { starters: [] } });
		renderHub();
		expect(await screen.findByText("Choose your partner")).toBeTruthy();
	});
});
