import { describe, expect, it } from 'vitest';
import { blockSchema, pageSchema, siteMetaSchema, tenantContentSchema } from './content';
import { newId } from './ids';

const validContent = () => ({
  tenantId: 'jmdm.org',
  siteMeta: {
    siteName: 'jmdm',
    studioLocation: 'Harbord Village, Toronto',
    hours: 'by appointment',
  },
  pages: [
    {
      id: newId(),
      slug: '/about',
      title: 'About',
      blocks: [{ id: newId(), type: 'richText', data: { paragraphs: ['hi'] }, order: 0 }],
    },
  ],
  updatedAt: '2026-06-05T00:00:00.000Z',
});

describe('envelope schema', () => {
  it('accepts a well-formed TenantContent', () => {
    expect(tenantContentSchema.safeParse(validContent()).success).toBe(true);
  });

  it('treats block.data as opaque at the envelope layer (per-type validation lives in the registry)', () => {
    // The envelope guards the structural fields; the registry validates the data shape per-type.
    expect(blockSchema.safeParse({ id: 'b1', type: 'richText', data: 42, order: 0 }).success).toBe(
      true,
    );
    expect(
      blockSchema.safeParse({ id: 'b1', type: 'richText', data: { any: 'thing' }, order: 0 })
        .success,
    ).toBe(true);
    // ...but the structural fields are enforced:
    expect(blockSchema.safeParse({ id: '', type: 'richText', data: {}, order: 0 }).success).toBe(
      false,
    );
    expect(blockSchema.safeParse({ id: 'b1', type: 'richText', data: {}, order: -1 }).success).toBe(
      false,
    );
  });

  it('requires page slugs to start with "/"', () => {
    expect(
      pageSchema.safeParse({ id: 'p', slug: 'about', title: 'About', blocks: [] }).success,
    ).toBe(false);
  });

  it('requires updatedAt to be an ISO datetime', () => {
    const bad = { ...validContent(), updatedAt: 'yesterday' };
    expect(tenantContentSchema.safeParse(bad).success).toBe(false);
  });

  it('carries the additive siteMeta studio/hours fields', () => {
    const parsed = siteMetaSchema.parse({ siteName: 'x', studioLocation: 'Toronto', hours: '9-5' });
    expect(parsed.studioLocation).toBe('Toronto');
    expect(parsed.hours).toBe('9-5');
  });
});
