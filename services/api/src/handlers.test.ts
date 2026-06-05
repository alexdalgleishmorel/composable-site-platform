import type { TenantContent } from '@csp/core';
import type { APIGatewayProxyEventV2, APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { createHandlers, type HandlerDeps } from './handlers';
import type { ContentStore } from './store';

const content = (tenantId: string): TenantContent => ({
  tenantId,
  siteMeta: { siteName: 'jmdm' },
  pages: [
    {
      id: 'p',
      slug: '/about',
      title: 'About',
      blocks: [{ id: 'b', type: 'richText', order: 0, data: { paragraphs: ['hi'] } }],
    },
  ],
  updatedAt: '2026-01-01T00:00:00.000Z',
});

function fakeStore(seed?: TenantContent): ContentStore & { saved?: TenantContent } {
  const map = new Map<string, TenantContent>();
  if (seed) map.set(seed.tenantId, seed);
  const store: ContentStore & { saved?: TenantContent } = {
    async get(id) {
      return map.get(id) ?? null;
    },
    async put(c) {
      map.set(c.tenantId, c);
      store.saved = c;
    },
  };
  return store;
}

const deps = (over: Partial<HandlerDeps> = {}): HandlerDeps => ({
  store: fakeStore(),
  presigner: {
    presignUpload: async (tenantId, contentType) => ({
      uploadUrl: `https://s3/${tenantId}/x?sig`,
      cdnUrl: `https://cdn/${tenantId}/x.${contentType.split('/')[1]}`,
      key: `${tenantId}/x`,
    }),
  },
  now: () => '2026-06-05T00:00:00.000Z',
  ...over,
});

const publicEvent = (headers: Record<string, string>, query?: Record<string, string>) =>
  ({ headers, queryStringParameters: query }) as unknown as APIGatewayProxyEventV2;

const adminEvent = (tenant: string | null, body: string | undefined) =>
  ({
    body,
    requestContext: {
      authorizer: { jwt: { claims: tenant ? { 'custom:tenantId': tenant } : {} } },
    },
  }) as unknown as APIGatewayProxyEventV2WithJWTAuthorizer;

describe('GET /content', () => {
  it('returns the tenant document resolved from the Host header', async () => {
    const h = createHandlers(deps({ store: fakeStore(content('jmdm.org')) }));
    const res = await h.getContent(publicEvent({ host: 'www.jmdm.org' }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body!).tenantId).toBe('jmdm.org');
  });

  it('404s an unknown tenant and 400s when no tenant can be resolved', async () => {
    const h = createHandlers(deps({ store: fakeStore(content('jmdm.org')) }));
    expect((await h.getContent(publicEvent({ host: 'other.org' }))).statusCode).toBe(404);
    expect((await h.getContent(publicEvent({}))).statusCode).toBe(400);
  });
});

describe('PUT /content', () => {
  it('rejects a missing tenant claim with 401', async () => {
    const res = await createHandlers(deps()).putContent(
      adminEvent(null, JSON.stringify(content('jmdm.org'))),
    );
    expect(res.statusCode).toBe(401);
  });

  it('rejects content failing shared validation with 400 + issues', async () => {
    const bad = { ...content('jmdm.org'), updatedAt: 'not-a-date' };
    const res = await createHandlers(deps()).putContent(
      adminEvent('jmdm.org', JSON.stringify(bad)),
    );
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body!).issues.length).toBeGreaterThan(0);
  });

  it('rejects a tenant mismatch with 403 (isolation boundary)', async () => {
    const res = await createHandlers(deps()).putContent(
      adminEvent('someone-else.org', JSON.stringify(content('jmdm.org'))),
    );
    expect(res.statusCode).toBe(403);
  });

  it('saves valid content and stamps updatedAt', async () => {
    const store = fakeStore();
    const res = await createHandlers(deps({ store })).putContent(
      adminEvent('jmdm.org', JSON.stringify(content('jmdm.org'))),
    );
    expect(res.statusCode).toBe(200);
    expect(store.saved?.updatedAt).toBe('2026-06-05T00:00:00.000Z');
  });
});

describe('POST /uploads/presign', () => {
  it('requires a tenant claim and a contentType', async () => {
    const h = createHandlers(deps());
    expect((await h.uploadsPresign(adminEvent(null, '{}'))).statusCode).toBe(401);
    expect((await h.uploadsPresign(adminEvent('jmdm.org', '{}'))).statusCode).toBe(400);
  });

  it('returns an upload URL and CDN URL', async () => {
    const res = await createHandlers(deps()).uploadsPresign(
      adminEvent('jmdm.org', JSON.stringify({ contentType: 'image/png' })),
    );
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body!);
    expect(body.uploadUrl).toContain('jmdm.org');
    expect(body.cdnUrl).toContain('.png');
  });
});
