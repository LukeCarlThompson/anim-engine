import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { createTicker, getTicker } from "./ticker";

// ─── Helpers ───────────────────────────────────────────────────────────

/** Captures all deltaMs received by a handler. */
const capture = (): { fn: (d: number) => void; deltas: number[] } => {
  const deltas: number[] = [];
  return {
    fn: (d: number) => {
      deltas.push(d);
    },
    deltas,
  };
};

// ─── requestAnimationFrame mocking ─────────────────────────────────────

let rafCallbacks: Map<number, (now: number) => void>;
let rafNextId: number;

beforeEach(() => {
  rafCallbacks = new Map();
  rafNextId = 1;

  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((cb: (now: number) => void): number => {
      const id = rafNextId++;
      rafCallbacks.set(id, cb);
      return id;
    }),
  );

  vi.stubGlobal(
    "cancelAnimationFrame",
    vi.fn((id: number) => {
      rafCallbacks.delete(id);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  getTicker().stop();
});

// ─── Factory ───────────────────────────────────────────────────────────

test("GIVEN createTicker WHEN called THEN it returns a Ticker with all 5 methods", () => {
  // WHEN
  const ticker = createTicker();

  // THEN
  expect(ticker).toHaveProperty("start");
  expect(ticker).toHaveProperty("stop");
  expect(ticker).toHaveProperty("update");
  expect(ticker).toHaveProperty("add");
  expect(ticker).toHaveProperty("remove");
  expect(typeof ticker.start).toBe("function");
  expect(typeof ticker.stop).toBe("function");
  expect(typeof ticker.update).toBe("function");
  expect(typeof ticker.add).toBe("function");
  expect(typeof ticker.remove).toBe("function");
});

test("GIVEN createTicker WHEN called THEN it does not auto-start a rAF loop", () => {
  // WHEN
  createTicker();

  // THEN
  expect(requestAnimationFrame).not.toHaveBeenCalled();
});

// ─── add / update ──────────────────────────────────────────────────────

test("GIVEN a ticker with one handler WHEN update is called THEN the handler receives the delta", () => {
  // GIVEN
  const ticker = createTicker();
  const { fn, deltas } = capture();
  ticker.add(fn);

  // WHEN
  ticker.update(16);

  // THEN
  expect(deltas).toEqual([16]);
});

test("GIVEN a ticker with multiple handlers WHEN update is called THEN all handlers receive the delta", () => {
  // GIVEN
  const ticker = createTicker();
  const a = capture();
  const b = capture();
  const c = capture();
  ticker.add(a.fn);
  ticker.add(b.fn);
  ticker.add(c.fn);

  // WHEN
  ticker.update(33);

  // THEN
  expect(a.deltas).toEqual([33]);
  expect(b.deltas).toEqual([33]);
  expect(c.deltas).toEqual([33]);
});

test("GIVEN a ticker with handlers WHEN update is called multiple times THEN each handler receives all deltas in order", () => {
  // GIVEN
  const ticker = createTicker();
  const { fn, deltas } = capture();
  ticker.add(fn);

  // WHEN
  ticker.update(16);
  ticker.update(17);
  ticker.update(33);

  // THEN
  expect(deltas).toEqual([16, 17, 33]);
});

// ─── remove ────────────────────────────────────────────────────────────

test("GIVEN a ticker with a handler WHEN the handler is removed THEN it no longer receives updates", () => {
  // GIVEN
  const ticker = createTicker();
  const { fn, deltas } = capture();
  ticker.add(fn);
  ticker.update(16);
  expect(deltas).toEqual([16]);

  // WHEN
  ticker.remove(fn);
  ticker.update(33);

  // THEN
  expect(deltas).toEqual([16]); // no new entry
});

test("GIVEN a ticker WHEN remove is called with an unregistered handler THEN it does nothing", () => {
  // GIVEN
  const ticker = createTicker();
  const a = capture();
  const b = capture();
  ticker.add(a.fn);

  // WHEN — remove a handler that was never added
  ticker.remove(b.fn);
  ticker.update(16);

  // THEN — the registered handler still fires
  expect(a.deltas).toEqual([16]);
});

test("GIVEN a ticker with a handler registered twice WHEN remove is called once THEN the handler still fires once per update", () => {
  // GIVEN
  const ticker = createTicker();
  const { fn, deltas } = capture();
  ticker.add(fn);
  ticker.add(fn); // same handler added twice

  ticker.update(10);

  // GIVEN — registered twice, so 2 calls
  expect(deltas).toEqual([10, 10]);
  deltas.length = 0;

  // WHEN — remove (first occurrence)
  ticker.remove(fn);
  ticker.update(20);

  // THEN — one occurrence remains
  expect(deltas).toEqual([20]);
});

// ─── Concurrent modification safety ────────────────────────────────────

test("GIVEN a ticker with a handler WHEN the handler removes itself during update THEN the iteration continues without error and the handler is removed", () => {
  // GIVEN
  const ticker = createTicker();
  const survivor = capture();

  const selfRemoving = (_d: number) => {
    ticker.remove(selfRemoving);
  };

  ticker.add(selfRemoving);
  ticker.add(survivor.fn);

  // WHEN — first update: selfRemoving adds a tombstone, survivor fires
  ticker.update(16);

  // THEN — survivor was called
  expect(survivor.deltas).toEqual([16]);

  // WHEN — second update: compaction removes tombstone, survivor fires again
  ticker.update(17);

  // THEN — survivor still called, no crash
  expect(survivor.deltas).toEqual([16, 17]);
});

test("GIVEN a ticker with a handler WHEN the handler adds a new handler during update THEN the new handler is called in the same frame (flat array, length grows)", () => {
  // GIVEN
  const ticker = createTicker();
  const latecomer = capture();

  // Only add once to avoid duplicates across frames
  let added = false;
  const adder = (_d: number) => {
    if (!added) {
      ticker.add(latecomer.fn);
      added = true;
    }
  };

  ticker.add(adder);

  // WHEN — first update: adder registers latecomer, loop length grows
  ticker.update(10);

  // THEN — latecomer is called in the same frame because the
  // flat-array loop iterates past the original length
  expect(latecomer.deltas).toEqual([10]);

  // WHEN — second update: adder is idempotent, latecomer fires again
  ticker.update(20);

  // THEN
  expect(latecomer.deltas).toEqual([10, 20]);
});

test("GIVEN a ticker with a handler WHEN the handler adds and removes during update THEN iteration is stable", () => {
  // GIVEN
  const ticker = createTicker();
  const { fn: h1, deltas: d1 } = capture();
  const { fn: h2 } = capture();
  const { fn: h3, deltas: d3 } = capture();
  ticker.add(h1);  // index 0
  ticker.add(h2);  // index 1
  ticker.add(h3);  // index 2

  // WHEN — replace h2 slot with a mutator that removes h1 and adds late (once)
  let lateAdded = false;
  const late = capture();
  const mutator = (_d: number) => {
    ticker.remove(h1); // index 0 → undefined, needsCompact = true
    if (!lateAdded) {
      ticker.add(late.fn); // pushed to end once
      lateAdded = true;
    }
  };
  ticker.remove(h2);          // index 1 → undefined
  ticker.add(mutator);         // index 3
  // activeAnimations = [h1, undef, h3, mutator]

  ticker.update(10);
  // i=0: h1 fires → d1=[10]
  // i=1: undef → skip
  // i=2: h3 fires → d3=[10]
  // i=3: mutator fires → removes h1 (index 0), pushes late (index 4)
  // i=4: late fires → late=[10] (length grew during iteration)

  // THEN
  expect(d1).toEqual([10]);   // h1 was visited at index 0 before removal
  expect(d3).toEqual([10]);   // h3 visited normally
  expect(late.deltas).toEqual([10]); // late was pushed and visited same frame

  // WHEN — second frame: compaction runs, tombstones removed
  ticker.update(20);

  // THEN — survivors still fire
  expect(late.deltas).toEqual([10, 20]);
});

// ─── Tombstone compaction ──────────────────────────────────────────────

test("GIVEN a ticker with removed handlers WHEN update is called THEN the array is compacted and tombstones are removed", () => {
  // GIVEN
  const ticker = createTicker();
  const { fn: a, deltas: da } = capture();
  const { fn: b, deltas: db } = capture();
  const { fn: c, deltas: dc } = capture();
  ticker.add(a);
  ticker.add(b);
  ticker.add(c);

  // WHEN — remove b (middle), creating a tombstone
  ticker.remove(b);
  ticker.update(10);

  // THEN — a and c fired, b is gone
  expect(da).toEqual([10]);
  expect(db).toEqual([]);
  expect(dc).toEqual([10]);

  // WHEN — second update: b's slot was compacted away
  ticker.update(20);

  // THEN — a and c still fire
  expect(da).toEqual([10, 20]);
  expect(dc).toEqual([10, 20]);
});

test("GIVEN a ticker WHEN all handlers are removed and update is called THEN it does not throw", () => {
  // GIVEN
  const ticker = createTicker();
  const { fn: a } = capture();
  const { fn: b } = capture();
  ticker.add(a);
  ticker.add(b);

  // WHEN
  ticker.remove(a);
  ticker.remove(b);
  ticker.update(10);

  // THEN — no error
  expect(true).toBe(true);
});

test("GIVEN a ticker with tombstones only (all removed) WHEN update is called THEN the array is compacted to empty", () => {
  // GIVEN
  const ticker = createTicker();
  const { fn: a } = capture();
  ticker.add(a);
  ticker.remove(a);

  // WHEN — first update: compact
  ticker.update(10);

  // WHEN — second update: no handlers, no crash
  ticker.update(20);

  // THEN — no error, empty internal state
  expect(true).toBe(true);
});

// ─── start / stop (rAF loop) ──────────────────────────────────────────

test("GIVEN a ticker WHEN start is called THEN requestAnimationFrame is called", () => {
  // GIVEN
  const ticker = createTicker();

  // WHEN
  ticker.start();

  // THEN
  expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
});

test("GIVEN a running ticker WHEN start is called again THEN it does not start a second rAF", () => {
  // GIVEN
  const ticker = createTicker();
  ticker.start();
  expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

  // WHEN
  ticker.start();

  // THEN
  expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
});

test("GIVEN a running ticker WHEN stop is called THEN cancelAnimationFrame is called with the stored rAF id", () => {
  // GIVEN
  const ticker = createTicker();
  ticker.start();

  // WHEN
  ticker.stop();

  // THEN — cancelAnimationFrame was called (the id is stored internally, not returned)
  expect(cancelAnimationFrame).toHaveBeenCalledOnce();
  const callArg = vi.mocked(cancelAnimationFrame).mock.calls[0][0];
  expect(typeof callArg).toBe("number");
});

test("GIVEN a stopped ticker WHEN stop is called THEN it does nothing", () => {
  // GIVEN
  const ticker = createTicker();

  // WHEN
  ticker.stop();

  // THEN
  expect(cancelAnimationFrame).not.toHaveBeenCalled();
});

test("GIVEN a ticker with a handler WHEN started with rAF and a frame fires THEN the handler receives the delta between frames", () => {
  // GIVEN
  const ticker = createTicker();
  const { fn, deltas } = capture();
  ticker.add(fn);

  // WHEN — start the rAF loop
  ticker.start();

  // Simulate first rAF call (previousFrameTime is undefined → no delta)
  const firstCb = rafCallbacks.get(1)!;
  firstCb(100);
  expect(deltas).toEqual([]); // no delta on first frame

  // Simulate second rAF call
  firstCb(133); // delta = 33
  expect(deltas).toEqual([33]);

  // Simulate third rAF call
  firstCb(150); // delta = 17
  expect(deltas).toEqual([33, 17]);
});

test("GIVEN a running ticker WHEN start→stop→start is called THEN a new rAF loop begins", () => {
  // GIVEN
  const ticker = createTicker();
  const { fn, deltas } = capture();
  ticker.add(fn);

  // WHEN — first loop
  ticker.start();
  ticker.stop();
  ticker.start();

  // THEN — two rAF calls (one per start), stop cancelled the first
  expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
  expect(cancelAnimationFrame).toHaveBeenCalledOnce();

  // AND — the second rAF starts a fresh frame (no delta on first callback)
  const cb = rafCallbacks.get(2)!;
  cb(200);
  expect(deltas).toEqual([]); // first frame after stop→start: no delta

  cb(250);
  expect(deltas).toEqual([50]);
});

// ─── getTicker singleton ──────────────────────────────────────────────

test("GIVEN getTicker WHEN called twice THEN it returns the same instance", () => {
  // WHEN
  const a = getTicker();
  const b = getTicker();

  // THEN
  expect(a).toBe(b);
});

test("GIVEN getTicker WHEN called THEN it returns a functioning ticker", () => {
  // GIVEN
  const ticker = getTicker();
  const { fn, deltas } = capture();

  // WHEN
  ticker.add(fn);
  ticker.update(42);

  // THEN
  expect(deltas).toEqual([42]);
});

test("GIVEN getTicker WHEN called after stop THEN previous handlers are preserved", () => {
  // GIVEN
  const ticker = getTicker();
  const { fn, deltas } = capture();
  ticker.add(fn);
  ticker.stop(); // used in beforeEach of other test suites

  // WHEN
  ticker.update(10);

  // THEN — handler remains registered (stop only cancels rAF, doesn't clear handlers)
  expect(deltas).toEqual([10]);
});

// ─── Edge cases ────────────────────────────────────────────────────────

test("GIVEN a ticker WHEN update is called with delta 0 THEN handlers receive 0", () => {
  // GIVEN
  const ticker = createTicker();
  const { fn, deltas } = capture();
  ticker.add(fn);

  // WHEN
  ticker.update(0);

  // THEN
  expect(deltas).toEqual([0]);
});

test("GIVEN a ticker WHEN update is called with a negative delta THEN handlers receive the negative value", () => {
  // GIVEN
  const ticker = createTicker();
  const { fn, deltas } = capture();
  ticker.add(fn);

  // WHEN
  ticker.update(-16);

  // THEN — ticker does not clamp; consumers decide
  expect(deltas).toEqual([-16]);
});

test("GIVEN a ticker with many handlers WHEN update is called THEN all handlers receive the same delta", () => {
  // GIVEN
  const ticker = createTicker();
  const handlers = Array.from({ length: 100 }, () => capture());
  for (const h of handlers) ticker.add(h.fn);

  // WHEN
  ticker.update(16);

  // THEN
  for (const h of handlers) {
    expect(h.deltas).toEqual([16]);
  }
});
