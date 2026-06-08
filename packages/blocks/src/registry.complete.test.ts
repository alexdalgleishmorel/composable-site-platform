import { describe, expect, it } from 'vitest';
import { registry } from './index';
import { contentValidators } from './schemas';

const MVP_BLOCK_TYPES = [
  'richText',
  'projectGrid',
  'shop',
  'entryList',
  'noteCards',
  'shopNotes',
  'portfolioProject',
].sort();

describe('MVP block library', () => {
  it('registers all the block types', () => {
    expect(registry.types().sort()).toEqual(MVP_BLOCK_TYPES);
  });

  it('every registered type has a default that satisfies its own schema', () => {
    for (const block of registry.list()) {
      expect(block.schema.safeParse(block.defaultData()).success).toBe(true);
    }
  });

  // Guards against the registry (index.ts) and the React-free schema map (schemas.ts) drifting apart
  // — they must cover exactly the same block types or the backend would validate a different set than
  // the admin can edit.
  it('keeps the React-free schema map in sync with the registry', () => {
    expect(Object.keys(contentValidators.schemas).sort()).toEqual(MVP_BLOCK_TYPES);
  });
});
