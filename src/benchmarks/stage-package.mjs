import { cpSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Stages dist/ as node_modules/anim-engine-bench so the benchmarks import the
// build by name and Node loads it natively. Why: src/benchmarks/README.md.
const source = resolve("dist");
const target = resolve("node_modules/anim-engine-bench");

if (!existsSync(source)) {
  throw new Error("dist/ is missing. Run `npm run build:lib` first.");
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
writeFileSync(
  resolve(target, "package.json"),
  `${JSON.stringify({ type: "module", private: true }, null, 2)}\n`,
);
console.log(`staged ${source} -> ${target}`);
