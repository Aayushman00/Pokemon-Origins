import React from "react";
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StartMenu from "./StartMenu";

describe("StartMenu", () => {
	it("acts on the item the cursor reached, even when the buttons land in one frame", () => {
		const items = [{ label: "Party", run: vi.fn() }, { label: "Bag", run: vi.fn() }, { label: "Save", run: vi.fn() }];
		const keys = { current: null };
		render(<StartMenu items={items} keys={keys} onClose={() => {}} />);
		act(() => {
			keys.current("down");
			keys.current("down");
			keys.current("a");
		});
		expect(items[2].run).toHaveBeenCalledOnce();
		expect(items[0].run).not.toHaveBeenCalled();
	});
	it("wraps upward from the top and closes on B", () => {
		const items = [{ label: "Party", run: vi.fn() }, { label: "Close", run: vi.fn() }];
		const keys = { current: null };
		const onClose = vi.fn();
		render(<StartMenu items={items} keys={keys} onClose={onClose} />);
		act(() => {
			keys.current("up");
			keys.current("a");
			keys.current("b");
		});
		expect(items[1].run).toHaveBeenCalledOnce();
		expect(onClose).toHaveBeenCalledOnce();
	});
});
