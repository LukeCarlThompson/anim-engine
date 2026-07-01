import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    rules: {
      // Library-specific: no console.log in published code
      "no-console": "warn",

      // ESM library — no require()
      "@typescript-eslint/no-require-imports": "error",

      // All exported functions must have explicit return types
      "@typescript-eslint/explicit-module-boundary-types": "error",

      // Prefer type imports to avoid bundling unused values
      "@typescript-eslint/consistent-type-imports": "error",

      // Underscore-prefixed params are intentionally unused (e.g. cubicBezier stub)
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],

      // Function-based architecture — no classes, so this rule is irrelevant
      "@typescript-eslint/explicit-member-accessibility": "off",

      // Allow template expressions like `${value}px`
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["vite.config.js", ".storybook/*", "eslint.config.mjs"],
          defaultProject: "./tsconfig.json",
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ["dist/", "**/*.test.ts", "**/*.stories.ts"],
  }
);
