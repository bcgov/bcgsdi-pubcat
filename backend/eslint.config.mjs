import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig({
  ignores: ["dist/**", "coverage/**", "node_modules/**"],

  files: ["**/*.ts"],

  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
  },

  extends: [js.configs.recommended, tseslint.configs.recommended],
});
