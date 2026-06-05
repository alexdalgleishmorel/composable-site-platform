import { AuthProvider, useAuth } from 'react-oidc-context';
import { AdminWorkspace } from './AdminWorkspace';
import { createHttpApi } from './api';
import { SessionContext, type Session } from './session';
import { createPresignUploader } from './uploader';

const AUTHORITY = import.meta.env.VITE_COGNITO_AUTHORITY as string;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID as string;
const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

/**
 * Real authentication: Cognito Hosted UI via OIDC Authorization Code + PKCE (public SPA client, no
 * secret). The tenant comes from the token's `custom:tenantId` claim — the isolation boundary (§8) —
 * and the same id token authorizes `PUT /content` and `/uploads/presign`.
 */
function CognitoGate() {
  const auth = useAuth();

  if (auth.isLoading) return <div className="admin__loading">Signing in…</div>;
  if (auth.error) {
    return <div className="admin__toast admin__toast--err">Auth error: {auth.error.message}</div>;
  }
  if (!auth.isAuthenticated) {
    return (
      <form
        className="signin"
        onSubmit={(e) => {
          e.preventDefault();
          void auth.signinRedirect();
        }}
      >
        <h1>Admin</h1>
        <p className="admin__muted">Sign in with your Google account to edit your site.</p>
        <button type="submit">Sign in with Google</button>
      </form>
    );
  }

  const profile = auth.user?.profile;
  const tenantId = profile?.['custom:tenantId'] as string | undefined;
  const email = profile?.email ?? '';
  if (!tenantId) {
    return (
      <div className="admin__toast admin__toast--err">
        No tenant is mapped to {email}. Ask the platform owner for access.
      </div>
    );
  }

  const getToken = () => auth.user?.id_token ?? null;
  const session: Session = { email, tenantId, signOut: () => void auth.removeUser() };
  const api = createHttpApi(API_BASE, tenantId, getToken);
  const uploader = createPresignUploader(API_BASE, getToken);

  return (
    <SessionContext.Provider value={session}>
      {/* The live preview embeds the client's own deployed site (tenantId == domain, §1). */}
      <AdminWorkspace api={api} uploader={uploader} previewUrl={`https://${tenantId}`} />
    </SessionContext.Provider>
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
