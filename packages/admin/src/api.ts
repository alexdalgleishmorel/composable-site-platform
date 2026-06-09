import { registry, validateContent, type ContentIssue } from '@csp/blocks';
import type { TenantContent } from '@csp/core';

export interface SaveResult {
  ok: boolean;
  issues?: ContentIssue[];
}

/** The signed-in user's identity + role, from `GET /admin/whoami`. Drives the owner/editor branch
 * and the editor's "Add a block" filter. `blocks: null` ⇒ every block type is allowed. */
export interface WhoAmI {
  email: string;
  tenantId: string | null;
  isOwner: boolean;
  blocks: string[] | null;
}

/** One client in the owner console's list (`GET /admin/tenants`). */
export interface TenantSummary {
  tenantId: string;
  displayName: string;
  status: 'active' | 'suspended';
  blocks?: string[]; // absent ⇒ all block types allowed
  emails: string[];
}

/** The platform-owner transport: identity reflection, the client list, and per-tenant provisioning. */
export interface AdminApi {
  whoami(): Promise<WhoAmI>;
  listTenants(): Promise<TenantSummary[]>;
  setTenantBlocks(tenantId: string, blocks: string[] | null): Promise<{ ok: boolean }>;
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

/** Real owner-console transport against the deployed HTTP API. Every call carries the Cognito id
 * token; the backend enforces the owner allowlist on `/admin/tenants*`. */
export function createHttpAdminApi(baseUrl: string, getToken: () => string | null): AdminApi {
  const authHeaders = (): Record<string, string> => {
    const token = getToken();
    return token ? { authorization: `Bearer ${token}` } : {};
  };
  return {
    async whoami() {
      const res = await fetch(`${baseUrl}/admin/whoami`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`GET /admin/whoami failed: ${res.status}`);
      return (await res.json()) as WhoAmI;
    },
    async listTenants() {
      const res = await fetch(`${baseUrl}/admin/tenants`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`GET /admin/tenants failed: ${res.status}`);
      return ((await res.json()) as { tenants: TenantSummary[] }).tenants;
    },
    async setTenantBlocks(tenantId, blocks) {
      const res = await fetch(`${baseUrl}/admin/tenants/${encodeURIComponent(tenantId)}/blocks`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ blocks }),
      });
      return { ok: res.ok };
    },
  };
}

/** In-memory owner-console transport for local dev and tests. Seeded with the caller's identity and a
 * few demo clients so the console and the editor's block-filter are exercisable without a backend. */
export function createMockAdminApi(opts: {
  email: string;
  tenantId: string | null;
  owners: string[];
  tenants: TenantSummary[];
}): AdminApi {
  const tenants = opts.tenants.map((t) => ({ ...t }));
  const isOwner = opts.owners.some((o) => o.toLowerCase() === opts.email.toLowerCase());
  return {
    async whoami() {
      const self = tenants.find((t) => t.tenantId === opts.tenantId);
      return {
        email: opts.email,
        tenantId: opts.tenantId,
        isOwner,
        blocks: self?.blocks ?? null,
      };
    },
    async listTenants() {
      return tenants.map((t) => ({ ...t }));
    },
    async setTenantBlocks(tenantId, blocks) {
      const t = tenants.find((x) => x.tenantId === tenantId);
      if (t) {
        if (blocks && blocks.length) t.blocks = blocks;
        else delete t.blocks;
      }
      return { ok: true };
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
