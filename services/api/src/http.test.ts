import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { claimEmail, isOwner } from './http';

const event = (claims: Record<string, string>) =>
  ({
    requestContext: { authorizer: { jwt: { claims } } },
  }) as unknown as APIGatewayProxyEventV2WithJWTAuthorizer;

describe('claimEmail', () => {
  it('lower-cases the email claim and returns null when absent', () => {
    expect(claimEmail(event({ email: 'Owner@X.com' }))).toBe('owner@x.com');
    expect(claimEmail(event({}))).toBeNull();
  });
});

describe('isOwner', () => {
  it('matches the owner allowlist case-insensitively', () => {
    expect(isOwner(event({ email: 'owner@x.com' }), ['Owner@X.com'])).toBe(true);
    expect(isOwner(event({ email: 'client@x.com' }), ['owner@x.com'])).toBe(false);
    expect(isOwner(event({}), ['owner@x.com'])).toBe(false);
    expect(isOwner(event({ email: 'owner@x.com' }), [])).toBe(false);
  });
});
