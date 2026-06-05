import { useState } from 'react';
import { createMockApi, type ContentApi } from './api';
import { AuthProvider, useAuth } from './auth';
import { Editor } from './Editor';
import { sampleContent } from './mockContent';
import './admin.css';

function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="signin"
      onSubmit={(e) => {
        e.preventDefault();
        setError(signIn(email));
      }}
    >
      <h1>Admin</h1>
      <p className="admin__muted">
        Sign in with your Google account to edit your site. (Mock sign-in until Cognito + Google
        land in #14 — enter an allow-listed email.)
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

function Gate({ api }: { api: ContentApi }) {
  const { session } = useAuth();
  return session ? <Editor api={api} /> : <SignIn />;
}

export function App({ api }: { api?: ContentApi }) {
  // Default to the in-memory mock API for local dev/tests; production injects the HTTP API (#14).
  const [resolvedApi] = useState<ContentApi>(() => api ?? createMockApi(sampleContent()));
  return (
    <AuthProvider>
      <Gate api={resolvedApi} />
    </AuthProvider>
  );
}
