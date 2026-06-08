import { useState } from 'react';
import { AdminWorkspace } from './AdminWorkspace';
import { createMockApi } from './api';
import { DEFAULT_ALLOWLIST } from './auth';
import { sampleContent } from './mockContent';
import { SessionContext, type Session } from './session';
import { SignIn } from './shell/SignIn';
import { useToast } from './toasts';
import { mockUploader } from './uploader';

const PREVIEW_URL: string = import.meta.env.VITE_PREVIEW_URL ?? 'about:blank';

/** Local-dev / test auth: an allow-listed email stands in for Google, against the in-memory API. */
export function MockAuth() {
  const toast = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [api] = useState(() => createMockApi(sampleContent()));

  if (!session) {
    const submit = () => {
      const tenantId = DEFAULT_ALLOWLIST[email.toLowerCase()];
      if (!tenantId) {
        setError(`No tenant mapping for ${email}. Ask the platform owner for access.`);
        return;
      }
      setSession({
        email,
        tenantId,
        signOut: () => {
          setSession(null);
          toast.info('Signed out', { duration: 1800 });
        },
      });
      toast.success('Welcome back', { duration: 2600 });
    };
    return (
      <SignIn onGoogle={submit} error={error}>
        <input
          className="signin__input"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </SignIn>
    );
  }

  return (
    <SessionContext.Provider value={session}>
      <AdminWorkspace api={api} uploader={mockUploader} previewUrl={PREVIEW_URL} />
    </SessionContext.Provider>
  );
}
