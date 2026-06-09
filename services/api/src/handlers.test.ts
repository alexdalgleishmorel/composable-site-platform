import type { TenantContent, TenantRecord } from '@csp/core';
import type { APIGatewayProxyEventV2, APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { createHandlers, type HandlerDeps } from './handlers';
import type { ContentStore, TenantMapReader, TenantRegistry } from './store';

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

function fakeTenants(
  seed: TenantRecord[] = [],
): TenantRegistry & { rows: Map<string, TenantRecord> } {
  const rows = new Map(seed.map((r) => [r.tenantId, r]));
  return {
    rows,
    async get(id) {
      return rows.get(id) ?? null;
    },
    async list() {
      return [...rows.values()];
    },
    async putBlocks(id, blocks, now) {
      const prev = rows.get(id);
      rows.set(id, {
        tenantId: id,
        displayName: prev?.displayName ?? id,
        status: prev?.status ?? 'active',
        createdAt: prev?.createdAt ?? now,
        updatedAt: now,
        ...(blocks && blocks.length ? { blocks } : {}),
      });
    },
  };
}

const fakeTenantMap = (entries: { email: string; tenantId: string }[] = []): TenantMapReader => ({
  async entries() {
    return entries;
  },
});

const deps = (over: Partial<HandlerDeps> = {}): HandlerDeps => ({
  store: fakeStore(),
  presigner: {
    presignUpload: async (tenantId, contentType) => ({
      uploadUrl: `https://s3/${tenantId}/x?sig`,
      cdnUrl: `https://cdn/${tenantId}/x.${contentType.split('/')[1]}`,
      key: `${tenantId}/x`,
    }),
  },
  tenants: fakeTenants(),
  tenantMap: fakeTenantMap(),
  ownerEmails: [],
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

/** A richer authenticated event carrying email/tenant claims, a body, and path params (`/admin/*`). */
const authEvent = (opts: {
  email?: string;
  tenant?: string;
  body?: string;
  path?: Record<string, string>;
}) =>
  ({
    body: opts.body,
    pathParameters: opts.path,
    requestContext: {
      authorizer: {
        jwt: {
          claims: {
            ...(opts.email ? { email: opts.email } : {}),
            ...(opts.tenant ? { 'custom:tenantId': opts.tenant } : {}),
          },
        },
      },
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

describe('PUT /content provisioning enforcement', () => {
  const allowOnly = (tenantId: string, blocks: string[]): TenantRecord => ({
    tenantId,
    displayName: tenantId,
    status: 'active',
    blocks,
  });

  it('rejects a block whose type is not in the tenant allow-list', async () => {
    // content('jmdm.org') has a single richText block; restrict to projectGrid only.
    const tenants = fakeTenants([allowOnly('jmdm.org', ['projectGrid'])]);
    const res = await createHandlers(deps({ tenants })).putContent(
      adminEvent('jmdm.org', JSON.stringify(content('jmdm.org'))),
    );
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body!);
    expect(body.message).toBe('block type not provisioned');
    expect(body.issues[0].message).toContain('richText');
  });

  it('allows blocks within the allow-list', async () => {
    const tenants = fakeTenants([allowOnly('jmdm.org', ['richText'])]);
    const res = await createHandlers(deps({ tenants })).putContent(
      adminEvent('jmdm.org', JSON.stringify(content('jmdm.org'))),
    );
    expect(res.statusCode).toBe(200);
  });

  it('allows all blocks when the tenant has no row (the permissive default)', async () => {
    const res = await createHandlers(deps()).putContent(
      adminEvent('jmdm.org', JSON.stringify(content('jmdm.org'))),
    );
    expect(res.statusCode).toBe(200);
  });
});

describe('GET /admin/whoami', () => {
  it('reflects identity, owner status, and the tenant allow-list', async () => {
    const tenants = fakeTenants([
      { tenantId: 'jmdm.org', displayName: 'JMDM', status: 'active', blocks: ['richText'] },
    ]);
    const h = createHandlers(deps({ tenants, ownerEmails: ['owner@x.com'] }));

    const owner = await h.whoami(authEvent({ email: 'OWNER@x.com', tenant: 'jmdm.org' }));
    expect(JSON.parse(owner.body!)).toMatchObject({
      email: 'owner@x.com',
      tenantId: 'jmdm.org',
      isOwner: true,
      blocks: ['richText'],
    });

    const client = await h.whoami(authEvent({ email: 'client@x.com', tenant: 'other.org' }));
    expect(JSON.parse(client.body!)).toMatchObject({ isOwner: false, blocks: null });
  });

  it('401s without an email claim', async () => {
    const res = await createHandlers(deps()).whoami(authEvent({ tenant: 'jmdm.org' }));
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /admin/tenants (owner-only)', () => {
  it('403s a non-owner', async () => {
    const res = await createHandlers(deps({ ownerEmails: ['owner@x.com'] })).listTenants(
      authEvent({ email: 'client@x.com' }),
    );
    expect(res.statusCode).toBe(403);
  });

  it('merges registry rows with mapped-but-unprovisioned tenants', async () => {
    const tenants = fakeTenants([
      { tenantId: 'a.com', displayName: 'A', status: 'active', blocks: ['richText'] },
    ]);
    const tenantMap = fakeTenantMap([
      { email: 'a@x.com', tenantId: 'a.com' },
      { email: 'b@x.com', tenantId: 'b.com' }, // no registry row → synthesized default
    ]);
    const res = await createHandlers(
      deps({ tenants, tenantMap, ownerEmails: ['owner@x.com'] }),
    ).listTenants(authEvent({ email: 'owner@x.com' }));
    expect(res.statusCode).toBe(200);
    const list = JSON.parse(res.body!).tenants as {
      tenantId: string;
      blocks?: string[];
      emails: string[];
    }[];
    expect(list.map((t) => t.tenantId)).toEqual(['a.com', 'b.com']);
    expect(list.find((t) => t.tenantId === 'a.com')!.emails).toEqual(['a@x.com']);
    expect(list.find((t) => t.tenantId === 'b.com')!.blocks).toBeUndefined();
  });
});

describe('PUT /admin/tenants/{tenantId}/blocks (owner-only)', () => {
  const owner = { email: 'owner@x.com' };

  it('403s a non-owner', async () => {
    const res = await createHandlers(deps({ ownerEmails: ['owner@x.com'] })).setTenantBlocks(
      authEvent({ email: 'client@x.com', path: { tenantId: 'a.com' }, body: '{"blocks":[]}' }),
    );
    expect(res.statusCode).toBe(403);
  });

  it('rejects unknown block types with 400', async () => {
    const res = await createHandlers(deps({ ownerEmails: ['owner@x.com'] })).setTenantBlocks(
      authEvent({ ...owner, path: { tenantId: 'a.com' }, body: '{"blocks":["nope"]}' }),
    );
    expect(res.statusCode).toBe(400);
  });

  it('stores a valid allow-list and clears it on null', async () => {
    const tenants = fakeTenants();
    const h = createHandlers(deps({ tenants, ownerEmails: ['owner@x.com'] }));

    const set = await h.setTenantBlocks(
      authEvent({ ...owner, path: { tenantId: 'a.com' }, body: '{"blocks":["richText"]}' }),
    );
    expect(set.statusCode).toBe(200);
    expect(tenants.rows.get('a.com')?.blocks).toEqual(['richText']);

    await h.setTenantBlocks(
      authEvent({ ...owner, path: { tenantId: 'a.com' }, body: '{"blocks":null}' }),
    );
    expect(tenants.rows.get('a.com')?.blocks).toBeUndefined();
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
