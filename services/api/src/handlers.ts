import { contentValidators, validateContent } from '@csp/blocks/schemas';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { claimTenant, json, resolveTenant } from './http';
import type { Presigner } from './presign';
import type { ContentStore } from './store';

export interface HandlerDeps {
  store: ContentStore;
  presigner: Presigner;
  /** Injectable clock for deterministic `updatedAt` in tests. */
  now?: () => string;
}

type Result = Promise<APIGatewayProxyStructuredResultV2>;

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

  return { getContent, putContent, uploadsPresign };
}
