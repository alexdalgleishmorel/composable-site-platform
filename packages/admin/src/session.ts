import { createContext, useContext } from 'react';

/** The signed-in editor's session, independent of which auth backend produced it. */
export interface Session {
  email: string;
  tenantId: string;
  signOut: () => void;
}

export const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used within a session provider');
  return session;
}
