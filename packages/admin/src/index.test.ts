import { describe, expect, it } from 'vitest';
import { ADMIN_PACKAGE } from './index';

describe('@csp/admin', () => {
  it('exposes the package identity', () => {
    expect(ADMIN_PACKAGE).toBe('@csp/admin');
  });
});
