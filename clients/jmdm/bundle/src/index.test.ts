import { describe, expect, it } from 'vitest';
import { JMDM_TENANT_ID } from './index';

describe('@csp/jmdm-bundle', () => {
  it('targets the jmdm.org tenant', () => {
    expect(JMDM_TENANT_ID).toBe('jmdm.org');
  });
});
