import { join, resolve } from "node:path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dts({ tsconfigPath: "tsconfig.build.json" })],
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
