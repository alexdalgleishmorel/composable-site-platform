/**
 * @csp/jmdm-bundle — the brother's bespoke render bundle (first client, tenant `jmdm.org`).
 *
 * Ships render components keyed by block `type`, the theme, and page composition — never schemas or
 * edit forms (§7). The BlockRenderer + postMessage preview contract lands in #21; the bespoke renders
 * and the data.js -> TenantContent seed in #22/#23. Stubbed for now.
 *
 * The Claude Design handoff it reconstructs lives in `clients/jmdm/design` (visual reference only).
 */
export const JMDM_TENANT_ID = 'jmdm.org';
