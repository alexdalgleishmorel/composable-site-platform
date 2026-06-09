import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

export function json(statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

/**
 * Public tenant resolution: a tenant's id IS its domain (e.g. "jmdm.org", §1). Resolved from the
 * forwarded Host header (CloudFront passes it through), with a `?tenant=` override for local/testing.
 */
export function resolveTenant(event: APIGatewayProxyEventV2): string | null {
  const override = event.queryStringParameters?.tenant;
  if (override) return override.toLowerCase();
  const host = event.headers?.['x-forwarded-host'] ?? event.headers?.host;
  return host ? host.replace(/^www\./, '').toLowerCase() : null;
}

/**
 * Admin tenant: read from the Cognito JWT claim `custom:tenantId`. The JWT authorizer has already
 * verified the token; the Lambda asserting this claim matches the resource is the tenant-isolation
 * boundary (§8).
 */
export function claimTenant(event: APIGatewayProxyEventV2WithJWTAuthorizer): string | null {
  const claims = event.requestContext.authorizer?.jwt?.claims as
    | Record<string, string | number | boolean | string[]>
    | undefined;
  const tenant = claims?.['custom:tenantId'];
  return typeof tenant === 'string' ? tenant : null;
}

/**
 * The signed-in user's email, from the verified id-token `email` claim. The admin sends its id token
 * (scope includes `email`) as the Bearer credential, so the claim is present on `/admin/*` routes.
 * Lower-cased for case-insensitive comparison.
 */
export function claimEmail(event: APIGatewayProxyEventV2WithJWTAuthorizer): string | null {
  const claims = event.requestContext.authorizer?.jwt?.claims as
    | Record<string, string | number | boolean | string[]>
    | undefined;
  const email = claims?.['email'];
  return typeof email === 'string' ? email.toLowerCase() : null;
}

/** True when the caller's email is in the platform-owner allowlist (the owner-console authz gate). */
export function isOwner(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
  ownerEmails: string[],
): boolean {
  const email = claimEmail(event);
  return email != null && ownerEmails.some((o) => o.toLowerCase() === email);
}
