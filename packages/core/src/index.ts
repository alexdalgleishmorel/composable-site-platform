/**
 * @csp/core — shared types and (later) the API client.
 *
 * Holds the `TenantContent` envelope contract (site -> pages -> blocks) used by every other package.
 * Per-block `data` validation lives in `@csp/blocks`, which reads these envelope schemas.
 */

export const CORE_PACKAGE = '@csp/core';

/** Narrow an unknown value to a non-empty string. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export * from './content';
export * from './ids';
