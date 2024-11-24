import { join, resolve } from "node:path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dts({ tsconfigPath: "tsconfig.build.json" })],
  build: {
    copyPublicDir: false,
    lib: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      entry: resolve(join(import.meta.dirname, "src/anim-engine/index.ts")),
      formats: ["es"],
      fileName: "index.js",
    },
  },
});
