import { newId } from '@csp/core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createRegistry, type BlockType } from './index';
import { validateContent } from './validate';

const richTextish: BlockType<{ paragraphs: string[] }> = {
  type: 'richText',
  label: 'Rich text',
  schema: z.object({ paragraphs: z.array(z.string()) }),
  EditForm: () => null,
  defaultData: () => ({ paragraphs: [] }),
  validate: (data) => {
    if (data.paragraphs.length === 0) throw new Error('needs at least one paragraph');
  },
};

const content = (data: unknown) => ({
  tenantId: 'jmdm.org',
  siteMeta: { siteName: 'jmdm' },
  pages: [
    {
      id: newId(),
      slug: '/about',
      title: 'About',
      blocks: [{ id: newId(), type: 'richText', data, order: 0 }],
    },
  ],
  updatedAt: '2026-06-05T00:00:00.000Z',
});

describe('validateContent', () => {
  const validators = createRegistry(richTextish).toValidators();

  it('accepts content whose blocks match their registered schema', () => {
    const result = validateContent(validators, content({ paragraphs: ['hello'] }));
    expect(result.ok).toBe(true);
  });

  it('reports a per-type schema violation with a located path', () => {
    const result = validateContent(validators, content({ paragraphs: 'not an array' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.path).toContain('/about » richText#');
  });

  it('runs the optional stricter validator (e.g. money/empty rules)', () => {
    const result = validateContent(validators, content({ paragraphs: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.message).toMatch(/at least one paragraph/);
  });

  it('flags an unknown block type', () => {
    const result = validateContent(validators, {
      ...content({ paragraphs: ['x'] }),
      pages: [
        {
          id: 'p',
          slug: '/x',
          title: 'X',
          blocks: [{ id: 'b', type: 'mystery', data: {}, order: 0 }],
        },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.message).toMatch(/unknown block type "mystery"/);
  });

  it('rejects a structurally broken envelope', () => {
    const result = validateContent(validators, { tenantId: '', pages: 'nope' });
    expect(result.ok).toBe(false);
  });
});
