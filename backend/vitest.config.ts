import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",

    coverage: {
      provider: "v8",

      include: ["src/**/*.ts"],

      exclude: ["src/**/*.test.ts", "src/**/*.d.ts", "src/api/server.ts"],

      reporter: ["text", "html", "lcov"],
    },
  },
});
