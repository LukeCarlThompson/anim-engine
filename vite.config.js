import { join, resolve } from "node:path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dts({ tsconfigPath: "tsconfig.build.json" })],
  test: {
    // The getter tracker wraps module exports to count accesses, which adds a
    // Map lookup per call inside hot benchmark loops and skews the results.
    benchmark: { suppressExportGetterWarnings: true },
  },
  build: {
    copyPublicDir: false,
    minify: false,
    sourcemap: false,
    lib: {
      entry: resolve(join(import.meta.dirname, "src/index.ts")),
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
      },
      treeshake: true,
    },
  },
});
