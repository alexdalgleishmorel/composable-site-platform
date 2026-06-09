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

  if (auth.isLoading) return <div className="admin__loading">Signing in…</div>;
  if (auth.error) {
    return <div className="admin__error">Auth error: {auth.error.message}</div>;
  }
  if (!auth.isAuthenticated) {
    return <SignIn onGoogle={() => void auth.signinRedirect()} />;
  }

  const email = auth.user?.profile?.email ?? '';
  const getToken = () => auth.user?.id_token ?? null;

  return (
    <RoleRouter
      adminApi={createHttpAdminApi(API_BASE, getToken)}
      identity={{ email, signOut: () => void auth.removeUser() }}
      // The preview embeds the tenant's own deployed site (tenantId == domain, §1).
      makeContentApi={(tenantId) => createHttpApi(API_BASE, tenantId, getToken)}
      makeUploader={() => createPresignUploader(API_BASE, getToken)}
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
