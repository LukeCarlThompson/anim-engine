import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: ["dist/**", ".tmp/**", "**/*.astro"],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  plugins: ["typescript", "unicorn", "oxc"],
  categories: {
    correctness: "error",
    suspicious: "warn",
    perf: "warn",
  },
  rules: {
    "eslint/no-unused-vars": "error",
  },
  env: {
    builtin: true,
    browser: true,
  },
});
