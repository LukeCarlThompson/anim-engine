# Benchmarks

`npm run bench` builds `dist/`, copies it into `node_modules/anim-engine-bench`
(`src/benchmarks/stage-package.mjs`), then runs the vitest benchmarks. It prints the table in the root `README.md`.

## Why the copy

The benchmarks import the built package by name (`anim-engine-bench/index.js`) instead of
importing `src/` relatively. `vitest.config.ts` marks that package external, so Vitest hands it to Node
untouched.

That matters: anything Vite transforms gets its imports rewritten into namespace property
lookups (`(0, __vite_ssr_import_0__.updateTween)(...)`). That blocks inlining across
`runner.ts` → `update.ts`, which is one call per animation per frame — it made the single
tween benchmark read 37k/s instead of 53k/s, while GSAP, loaded from `node_modules`, paid
nothing. Externalising both makes the comparison fair.

It is a **copy**, not a symlink, because Vite deliberately inlines symlinked packages.
`npm run bench` rebuilds and re-copies every time, so a stale build cannot be measured.

Type-checking still resolves the package specifier to `src/` through `tsconfig.json`
`paths`, so `npm run check:types` does not need a build first.

## The measurement

`vitest bench` with the export getter tracker suppressed (`vitest.config.ts`). That tracker
wraps every module export to count accesses and adds a Map lookup per call inside hot
loops, which understated micro-benchmarks by up to 3×.

Each group gets its own ticker, so a group that fails to drain its animations cannot affect
the next one.

Numbers move with machine, Node version, and benchmark ordering. Compare within a single
run; never diff absolute throughput across runs.
