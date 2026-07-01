// Internal types — not exported in the public API.

/** An object that can be driven by the ticker. */
export type Updateable = { update(deltaMs: number): void };
