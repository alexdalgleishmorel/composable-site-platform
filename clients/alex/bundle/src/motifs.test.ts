import { builtinMotifKeys } from '@csp/blocks';
import { describe, expect, it } from 'vitest';
import { motifs } from './motifs';

describe('built-in motif registry', () => {
  it('implements exactly the shared builtinMotifKeys (no drift)', () => {
    expect(Object.keys(motifs).sort()).toEqual([...builtinMotifKeys].sort());
  });
});
