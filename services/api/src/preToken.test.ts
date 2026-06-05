import type { PreTokenGenerationTriggerEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { createPreTokenHandler } from './preToken';
import type { TenantMap } from './store';

const map = (table: Record<string, string>): TenantMap => ({
  async lookup(email) {
    return table[email] ?? null;
  },
});

const event = (email?: string) =>
  ({
    request: { userAttributes: email ? { email } : {} },
    response: {},
  }) as unknown as PreTokenGenerationTriggerEvent;

describe('preTokenGeneration', () => {
  const handler = createPreTokenHandler({
    tenantMap: map({ 'jack.dalgleishmorel@gmail.com': 'jmdm.studio' }),
  });

  it('injects custom:tenantId for a mapped (federated) email', async () => {
    const out = await handler(event('Jack.Dalgleishmorel@gmail.com')); // case-insensitive
    expect(out.response.claimsOverrideDetails?.claimsToAddOrOverride).toEqual({
      'custom:tenantId': 'jmdm.studio',
      tenantId: 'jmdm.studio',
    });
  });

  it('adds no claim for an unmapped email', async () => {
    const out = await handler(event('stranger@example.com'));
    expect(out.response.claimsOverrideDetails).toBeUndefined();
  });

  it('adds no claim when there is no email', async () => {
    const out = await handler(event());
    expect(out.response.claimsOverrideDetails).toBeUndefined();
  });
});
