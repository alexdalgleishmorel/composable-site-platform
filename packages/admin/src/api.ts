import { registry, validateContent, type ContentIssue } from '@csp/blocks';
import type { TenantContent } from '@csp/core';

export interface SaveResult {
  ok: boolean;
  issues?: ContentIssue[];
}

/** The admin's content transport: the baseline §6 API — `GET /content` and whole-document `PUT`. */
export interface ContentApi {
  getContent(): Promise<TenantContent>;
  putContent(content: TenantContent): Promise<SaveResult>;
}

/**
 * Real transport against the deployed HTTP API (Cognito JWT in the Authorization header). `GET` is
 * tenant-scoped via `?tenant=` (the API is called cross-origin, so Host can't identify the tenant); a
 * fresh tenant with no content yet starts from an empty document the editor can populate.
 */
export function createHttpApi(
  baseUrl: string,
  tenantId: string,
  getToken: () => string | null,
): ContentApi {
  return {
    async getContent() {
      const res = await fetch(`${baseUrl}/content?tenant=${encodeURIComponent(tenantId)}`);
      if (res.status === 404) {
        return {
          tenantId,
          siteMeta: { siteName: tenantId },
          pages: [],
          updatedAt: new Date().toISOString(),
        };
      }
      if (!res.ok) throw new Error(`GET /content failed: ${res.status}`);
      return (await res.json()) as TenantContent;
    },
    async putContent(content) {
      const token = getToken();
      const res = await fetch(`${baseUrl}/content`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(content),
      });
      if (res.ok) return { ok: true };
      const body = (await res.json().catch(() => ({}))) as { issues?: ContentIssue[] };
      return { ok: false, issues: body.issues };
    },
  };
}

/**
 * In-memory transport for local dev and tests. Crucially it validates with the SAME shared registry
 * validators the backend uses (`validateContent`), so the admin surfaces exactly the errors a real
 * `PUT /content` would reject.
 */
export function createMockApi(initial: TenantContent): ContentApi {
  let store = initial;
  return {
    async getContent() {
      return store;
    },
    async putContent(content) {
      const result = validateContent(registry.toValidators(), content);
      if (!result.ok) return { ok: false, issues: result.issues };
      store = content;
      return { ok: true };
    },
  };
}
