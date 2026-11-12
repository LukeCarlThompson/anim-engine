# Benchmarks

Results are produced by `npm run bench` and printed to stdout. Nothing is committed.

Numbers move with machine, Node version, and benchmark ordering. Compare cases within a
single run; do not diff absolute throughput across runs.

## Commands

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run bench` | Run all benchmarks, print the tables |

Single file, or a group:

```sh
npx vitest bench src/benchmarks/easing.bench.ts --run --reporter=verbose
npx vitest bench --run --reporter=verbose -t "single tween"
```

`--reporter=verbose` is required. The default reporter prints no benchmark tables.

## Baselines

Vitest 5 removed `--outputJson` and `--compare`. Baselines are now per-benchmark:

- `bench(name, { writeResult: "baselines/${projectName}/<case>.json" }, fn)` writes a
  result after a successful run.
- `bench.from(name, "baselines/${projectName}/<case>.json")` adds a stored result as a
  reference row in the comparison table instead of re-running it.

No npm script wraps this yet. Add the options inside `src/benchmarks/*.bench.ts` when a
baseline is worth tracking.
