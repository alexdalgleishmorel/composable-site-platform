import { contentValidators, validateContent, type ContentIssue } from '@csp/blocks/schemas';
import type { TenantContent, TenantRecord } from '@csp/core';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { claimEmail, claimTenant, isOwner, json, resolveTenant } from './http';
import type { Presigner } from './presign';
import type { ContentStore, TenantMapReader, TenantRegistry } from './store';

export interface HandlerDeps {
  store: ContentStore;
  presigner: Presigner;
  /** The owner-console tenant registry (`csp-tenants`): client list + per-tenant block allow-list. */
  tenants: TenantRegistry;
  /** Reads every email→tenant mapping so the client list includes live-but-unprovisioned tenants. */
  tenantMap: TenantMapReader;
  /** Platform-owner allowlist (the `/admin/*` authz gate). */
  ownerEmails: string[];
  /** Injectable clock for deterministic `updatedAt` in tests. */
  now?: () => string;
}

type Result = Promise<APIGatewayProxyStructuredResultV2>;

/** The known registered block types — the universe a provisioning allow-list may draw from. */
const KNOWN_BLOCK_TYPES = Object.keys(contentValidators.schemas);

/** A summary of one client for the owner console: the registry row enriched with mapped emails. */
export interface TenantSummary extends TenantRecord {
  emails: string[];
}

/** The API behind the HTTP API Gateway (§6). Deps are injected so the logic is unit-testable. */
export function createHandlers(deps: HandlerDeps) {
  const now = deps.now ?? (() => new Date().toISOString());

  /** GET /content — public. Returns the tenant's full document. */
  async function getContent(event: APIGatewayProxyEventV2): Result {
    const tenantId = resolveTenant(event);
    if (!tenantId) return json(400, { message: 'cannot resolve tenant from request' });
    const content = await deps.store.get(tenantId);
    if (!content) return json(404, { message: `no content for ${tenantId}` });
    return json(200, content);
  }

  /** PUT /content — admin. Replaces the whole document (last-write-wins, §6). */
  async function putContent(event: APIGatewayProxyEventV2WithJWTAuthorizer): Result {
    const tenant = claimTenant(event);
    if (!tenant) return json(401, { message: 'missing tenant claim' });

    let parsed: unknown;
    try {
      parsed = JSON.parse(event.body ?? 'null');
    } catch {
      return json(400, { message: 'invalid JSON body' });
    }

    // Validate the envelope AND every block's data against the shared registry (incl. shop money).
    const result = validateContent(contentValidators, parsed);
    if (!result.ok) return json(400, { message: 'invalid content', issues: result.issues });

    // Tenant-isolation boundary: the document's tenantId must match the caller's token (§8).
    if (result.value.tenantId !== tenant) {
      return json(403, { message: 'tenant mismatch' });
    }

    // Provisioning boundary: if the owner has restricted this tenant to an allow-list, reject any
    // block whose type is outside it. Absent row / absent `blocks` ⇒ every type allowed (§ default).
    const record = await deps.tenants.get(tenant);
    const denied = disallowedBlocks(result.value, record);
    if (denied.length) return json(400, { message: 'block type not provisioned', issues: denied });

    const saved = { ...result.value, updatedAt: now() };
    await deps.store.put(saved);
    return json(200, { ok: true, updatedAt: saved.updatedAt });
  }

  /** POST /uploads/presign — admin. Returns a one-time S3 PUT URL + the resulting CDN URL. */
  async function uploadsPresign(event: APIGatewayProxyEventV2WithJWTAuthorizer): Result {
    const tenant = claimTenant(event);
    if (!tenant) return json(401, { message: 'missing tenant claim' });

    let body: { contentType?: string };
    try {
      body = JSON.parse(event.body ?? '{}') as { contentType?: string };
    } catch {
      return json(400, { message: 'invalid JSON body' });
    }
    if (!body.contentType) return json(400, { message: 'contentType is required' });

    const { uploadUrl, cdnUrl } = await deps.presigner.presignUpload(tenant, body.contentType);
    return json(200, { uploadUrl, cdnUrl });
  }

  /** GET /admin/whoami — authenticated. Reflects the caller's identity so the SPA can branch between
   * the owner console and the per-tenant editor, and filter the editor's "Add a block" menu. */
  async function whoami(event: APIGatewayProxyEventV2WithJWTAuthorizer): Result {
    const email = claimEmail(event);
    if (!email) return json(401, { message: 'missing email claim' });
    const tenantId = claimTenant(event);
    const record = tenantId ? await deps.tenants.get(tenantId) : null;
    return json(200, {
      email,
      tenantId,
      isOwner: isOwner(event, deps.ownerEmails),
      blocks: record?.blocks ?? null, // null ⇒ all block types allowed
    });
  }

  /** GET /admin/tenants — owner-only. The client list: every `csp-tenants` row unioned with tenants
   * discoverable from the email→tenant map, so live-but-unprovisioned tenants appear with no backfill. */
  async function listTenants(event: APIGatewayProxyEventV2WithJWTAuthorizer): Result {
    if (!isOwner(event, deps.ownerEmails)) return json(403, { message: 'not a platform owner' });

    const [records, mappings] = await Promise.all([deps.tenants.list(), deps.tenantMap.entries()]);

    const emailsByTenant = new Map<string, string[]>();
    for (const { email, tenantId } of mappings) {
      emailsByTenant.set(tenantId, [...(emailsByTenant.get(tenantId) ?? []), email]);
    }

    const byId = new Map<string, TenantSummary>();
    for (const r of records) {
      byId.set(r.tenantId, { ...r, emails: emailsByTenant.get(r.tenantId) ?? [] });
    }
    // Synthesize a default row for any mapped-but-unprovisioned tenant (blocks absent ⇒ all allowed).
    for (const tenantId of emailsByTenant.keys()) {
      if (!byId.has(tenantId)) {
        byId.set(tenantId, {
          tenantId,
          displayName: tenantId,
          status: 'active',
          emails: emailsByTenant.get(tenantId) ?? [],
        });
      }
    }

    const tenants = [...byId.values()].sort((a, b) => a.tenantId.localeCompare(b.tenantId));
    return json(200, { tenants });
  }

  /** PUT /admin/tenants/{tenantId}/blocks — owner-only. Sets a tenant's block allow-list. Body
   * `{ blocks: string[] | null }`; `null`/`[]` clears the restriction (⇒ all blocks allowed). */
  async function setTenantBlocks(event: APIGatewayProxyEventV2WithJWTAuthorizer): Result {
    if (!isOwner(event, deps.ownerEmails)) return json(403, { message: 'not a platform owner' });

    const tenantId = event.pathParameters?.['tenantId'];
    if (!tenantId) return json(400, { message: 'tenantId path parameter is required' });

    let body: { blocks?: string[] | null };
    try {
      body = JSON.parse(event.body ?? '{}') as { blocks?: string[] | null };
    } catch {
      return json(400, { message: 'invalid JSON body' });
    }

    const blocks = body.blocks;
    if (blocks != null) {
      if (!Array.isArray(blocks) || blocks.some((t) => typeof t !== 'string')) {
        return json(400, { message: 'blocks must be an array of strings or null' });
      }
      const unknown = blocks.filter((t) => !KNOWN_BLOCK_TYPES.includes(t));
      if (unknown.length) {
        return json(400, { message: `unknown block types: ${unknown.join(', ')}` });
      }
    }

    await deps.tenants.putBlocks(tenantId, blocks ?? null, now());
    return json(200, { ok: true });
  }

  return { getContent, putContent, uploadsPresign, whoami, listTenants, setTenantBlocks };
}

/** Blocks in `content` whose type is outside a restricted tenant's allow-list. Empty when the tenant
 * has no row or no `blocks` field (the permissive default). */
function disallowedBlocks(content: TenantContent, record: TenantRecord | null): ContentIssue[] {
  const allow = record?.blocks;
  if (!allow || allow.length === 0) return [];
  const allowed = new Set(allow);
  const issues: ContentIssue[] = [];
  for (const page of content.pages) {
    for (const block of page.blocks) {
      if (!allowed.has(block.type)) {
        issues.push({
          path: `${page.slug} » ${block.type}#${block.id}`,
          message: `block type "${block.type}" is not provisioned for this site`,
        });
      }
    }
  }
  return issues;
}
