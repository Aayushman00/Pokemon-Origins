import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);

// jsdom has no matchMedia; report reduced motion so animations and text
// pacing collapse to 0ms and tests stay fast and deterministic.
window.matchMedia = vi.fn((query) => ({
	matches: query.includes("prefers-reduced-motion"),
	media: query,
	addEventListener() {},
	removeEventListener() {},
	addListener() {},
	removeListener() {},
}));
