/**
 * A stable UUID for blocks, projects, and shop items.
 *
 * NEVER derive ids from content (no hashes) — hashes change on edit and would break ordering,
 * references, and per-item routing (§3). `crypto.randomUUID` is available in Node >= 19 and all
 * modern browsers.
 */
export function newId(): string {
  return globalThis.crypto.randomUUID();
}
