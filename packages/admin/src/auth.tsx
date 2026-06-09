/**
 * Allow-listed Google emails -> tenantId for the LOCAL MOCK sign-in (mirrors the Cognito tenant
 * mapping, §8). Production uses real Cognito + Google IdP (see CognitoAuth); this is dev/test only.
 */
export const DEFAULT_ALLOWLIST: Record<string, string> = {
  'jack.dalgleishmorel@gmail.com': 'jmdm.studio',
  'alex.dalgleishmorel@gmail.com': 'jmdm.studio',
};

/**
 * Platform-owner emails for the LOCAL MOCK (mirrors the Lambda's `OWNER_EMAILS` allowlist). An owner
 * lands on the owner console (clients + block provisioning); everyone else lands in their editor.
 * Production authz is server-side — this is dev/test only.
 */
export const DEFAULT_OWNERS: string[] = ['alex.dalgleishmorel@gmail.com'];
