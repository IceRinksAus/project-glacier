import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
    // Interaction-heavy files can share a constrained local runner during the
    // complete release gate. Keep a bounded ceiling without making individual
    // tests depend on the default five-second scheduling allowance.
    testTimeout: 10_000,
  },
});
