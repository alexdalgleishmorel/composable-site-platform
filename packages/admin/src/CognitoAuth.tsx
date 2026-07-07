import { useCallback, useMemo, useRef } from 'react';
import { AuthProvider, useAuth } from 'react-oidc-context';
import { createHttpAdminApi, createHttpApi } from './api';
import { RoleRouter } from './RoleRouter';
import { SignIn } from './shell/SignIn';
import { createPresignUploader } from './uploader';

const AUTHORITY = import.meta.env.VITE_COGNITO_AUTHORITY as string;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID as string;
const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

/**
 * Real authentication: Cognito Hosted UI via OIDC Authorization Code + PKCE (public SPA client, no
 * secret). After sign-in, `GET /admin/whoami` decides the destination — owner console vs. the
 * tenant editor — and the same id token authorizes every `/admin/*`, `PUT /content`, and
 * `/uploads/presign` call. The tenant isolation boundary stays the `custom:tenantId` claim (§8).
 */
function CognitoGate() {
  const auth = useAuth();

  // Keep the freshest id token in a ref so the transports below can be memoised (stable identity
  // across OIDC silent token renewals) while every request still carries an up-to-date token. Before
  // this, each renewal produced a new `getToken` closure — and therefore a new `api` object — which
  // re-triggered AdminWorkspace's content load and wiped the not-yet-published document. Hooks run
  // before the early returns to keep their order stable.
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = auth.user?.id_token ?? null;
  const getToken = useCallback(() => tokenRef.current, []);

  const adminApi = useMemo(() => createHttpAdminApi(API_BASE, getToken), [getToken]);
  const makeContentApi = useCallback(
    // The preview embeds the tenant's own deployed site (tenantId == domain, §1).
    (tenantId: string) => createHttpApi(API_BASE, tenantId, getToken),
    [getToken],
  );
  const makeUploader = useCallback(() => createPresignUploader(API_BASE, getToken), [getToken]);

  if (auth.isLoading) return <div className="admin__loading">Signing in…</div>;
  if (auth.error) {
    return <div className="admin__error">Auth error: {auth.error.message}</div>;
  }
  if (!auth.isAuthenticated) {
    return <SignIn onGoogle={() => void auth.signinRedirect()} />;
  }

  const email = auth.user?.profile?.email ?? '';

  return (
    <RoleRouter
      adminApi={adminApi}
      identity={{ email, signOut: () => void auth.removeUser() }}
      makeContentApi={makeContentApi}
      makeUploader={makeUploader}
      previewUrlFor={(tenantId) => `https://${tenantId}`}
    />
  );
}

export function CognitoAuth() {
  return (
    <AuthProvider
      authority={AUTHORITY}
      client_id={CLIENT_ID}
      redirect_uri={window.location.origin + window.location.pathname}
      response_type="code"
      scope="openid email profile"
      extraQueryParams={{ identity_provider: 'Google' }}
      // Strip the ?code=… from the URL after the token exchange.
      onSigninCallback={() => window.history.replaceState({}, '', window.location.pathname)}
    >
      <CognitoGate />
    </AuthProvider>
  );
}
