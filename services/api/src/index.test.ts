import { describe, expect, it } from 'vitest';
import { API_PACKAGE } from './index';

describe('@csp/api', () => {
  it('exposes the package identity', () => {
    expect(API_PACKAGE).toBe('@csp/api');
  });
});
