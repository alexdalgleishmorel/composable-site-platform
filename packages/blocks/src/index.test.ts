import { describe, expect, it } from 'vitest';
import { BLOCKS_PACKAGE, DEPENDS_ON } from './index';

describe('@csp/blocks', () => {
  it('exposes the package identity', () => {
    expect(BLOCKS_PACKAGE).toBe('@csp/blocks');
  });

  it('resolves the @csp/core workspace dependency', () => {
    expect(DEPENDS_ON).toBe('@csp/core');
  });
});
