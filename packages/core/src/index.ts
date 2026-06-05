/**
 * @csp/core — shared types and the API client.
 *
 * The `TenantContent` envelope types (site -> pages -> blocks) and the typed API client land in
 * issue #5. This module currently exposes only the package identity and a couple of shared guards
 * so the rest of the monorepo has something to import.
 */

export const CORE_PACKAGE = '@csp/core';

/** Narrow an unknown value to a non-empty string. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
