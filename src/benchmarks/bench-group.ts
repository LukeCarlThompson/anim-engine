import { test } from "vitest";
import type { BenchFn, BenchRegistration } from "vitest";

import type { Ticker } from "../domain";
import { createTicker } from "../ticker/get-ticker";

/**
 * Registers a single benchmark case inside a {@link benchGroup}.
 *
 * Mirrors the `bench(name, fn)` shape of Vitest 4, but collects the
 * registration instead of running it immediately.
 */
export type BenchRegistrar = (name: string, fn: BenchFn) => void;

/**
 * Register a group of benchmarks.
 *
 * Vitest 5 runs benchmarks through `test()` and only executes the
 * registrations handed to `bench.compare()`. This collects a group's cases
 * and hands them over as one comparison table.
 *
 * @param name - Group name shown in the benchmark report.
 * @param register - Receives a case registrar and the ticker for this group.
 */
export const benchGroup = (
  name: string,
  register: (bench: BenchRegistrar, ticker: Ticker) => void,
): void => {
  test(name, async ({ bench }) => {
    // A fresh ticker per group. The global singleton would let a group that
    // fails to drain its animations skew every group after it.
    const ticker = createTicker();
    const registrations: BenchRegistration<string>[] = [];
    register((caseName, fn) => {
      registrations.push(bench(caseName, fn));
    }, ticker);

    const [first, ...rest] = registrations;
    if (!first) return;
    // `compare()` needs at least two cases; a lone case just runs.
    if (rest.length === 0) {
      await first.run();
      return;
    }
    await bench.compare(first, ...rest);
  });
};
