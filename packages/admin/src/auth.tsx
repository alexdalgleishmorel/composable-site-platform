/**
 * Allow-listed Google emails -> tenantId for the LOCAL MOCK sign-in (mirrors the Cognito tenant
 * mapping, §8). Production uses real Cognito + Google IdP (see CognitoAuth); this is dev/test only.
 */
export const DEFAULT_ALLOWLIST: Record<string, string> = {
  'jack.dalgleishmorel@gmail.com': 'jmdm.studio',
  'alex.dalgleishmorel@gmail.com': 'jmdm.studio',
};
