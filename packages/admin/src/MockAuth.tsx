import { useState } from 'react';
import { AdminWorkspace } from './AdminWorkspace';
import { createMockApi } from './api';
import { DEFAULT_ALLOWLIST } from './auth';
import { sampleContent } from './mockContent';
import { SessionContext, type Session } from './session';
import { mockUploader } from './uploader';

const PREVIEW_URL: string = import.meta.env.VITE_PREVIEW_URL ?? 'about:blank';

/** Local-dev / test auth: an allow-listed email stands in for Google, against the in-memory API. */
export function MockAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [api] = useState(() => createMockApi(sampleContent()));

  if (!session) {
    return (
      <form
        className="signin"
        onSubmit={(e) => {
          e.preventDefault();
          const tenantId = DEFAULT_ALLOWLIST[email.toLowerCase()];
          if (!tenantId) {
            setError(`No tenant mapping for ${email}. Ask the platform owner for access.`);
            return;
          }
          setSession({ email, tenantId, signOut: () => setSession(null) });
        }}
      >
        <h1>Admin</h1>
        <p className="admin__muted">
          Mock sign-in (local dev — production uses Google via Cognito). Enter an allow-listed
          email.
        </p>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Sign in with Google</button>
        {error && <div className="admin__toast admin__toast--err">{error}</div>}
      </form>
    );
  }

  return (
    <SessionContext.Provider value={session}>
      <AdminWorkspace api={api} uploader={mockUploader} previewUrl={PREVIEW_URL} />
    </SessionContext.Provider>
  );
}
