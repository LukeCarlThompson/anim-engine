import { defineConfig } from "vitest/config";

// Benchmark settings only. Rationale: src/benchmarks/README.md.
export default defineConfig({
  test: {
    benchmark: { suppressExportGetterWarnings: true },
    server: { deps: { external: ["anim-engine-bench"] } },
  },
});
