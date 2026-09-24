import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Component tests (*.spec.jsx, jsdom). Pure-logic suites stay on node:test (*.test.js).
export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		include: ["src/**/*.spec.jsx"],
		setupFiles: ["src/test/setup.js"],
		css: false,
	},
});
