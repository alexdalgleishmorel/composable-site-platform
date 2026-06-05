import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface Session {
  email: string;
  tenantId: string;
}

interface AuthValue {
  session: Session | null;
  /** Returns an error message, or null on success. */
  signIn(email: string): string | null;
  signOut(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Allow-listed Google emails -> tenantId. This mirrors the Cognito tenant mapping (§8): only
 * allow-listed accounts get a tenant. Wired to real Cognito + Google IdP in #14; this is the local
 * stand-in for dev and tests.
 */
export const DEFAULT_ALLOWLIST: Record<string, string> = {
  'jack.dalgleishmorel@gmail.com': 'jmdm.studio',
  'alex.dalgleishmorel@gmail.com': 'jmdm.studio',
};

export function AuthProvider({
  children,
  allowlist = DEFAULT_ALLOWLIST,
}: {
  children: ReactNode;
  allowlist?: Record<string, string>;
}) {
  const [session, setSession] = useState<Session | null>(null);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      signIn(email) {
        const tenantId = allowlist[email.toLowerCase()];
        if (!tenantId) return `No tenant mapping for ${email}. Ask the platform owner for access.`;
        setSession({ email, tenantId });
        return null;
      },
      signOut() {
        setSession(null);
      },
    }),
    [session, allowlist],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within an AuthProvider');
  return value;
}
