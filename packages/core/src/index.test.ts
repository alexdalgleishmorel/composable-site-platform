import { describe, expect, it } from 'vitest';
import { CORE_PACKAGE, isNonEmptyString } from './index';

describe('@csp/core', () => {
  it('exposes the package identity', () => {
    expect(CORE_PACKAGE).toBe('@csp/core');
  });

  it('isNonEmptyString narrows correctly', () => {
    expect(isNonEmptyString('jmdm.org')).toBe(true);
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString(42)).toBe(false);
  });
});
