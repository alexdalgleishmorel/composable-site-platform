import { useState } from 'react';
import { createMockAdminApi, createMockApi, type TenantSummary } from './api';
import { DEFAULT_ALLOWLIST, DEFAULT_OWNERS } from './auth';
import { sampleContent } from './mockContent';
import { RoleRouter } from './RoleRouter';
import { SignIn } from './shell/SignIn';
import { useToast } from './toasts';
import { mockUploader } from './uploader';

const PREVIEW_URL: string = import.meta.env.VITE_PREVIEW_URL ?? 'about:blank';

/** A few clients so the owner console (and its provisioning) is exercisable without a backend. The
 * tenant the mock user signs into (jmdm.studio) is unrestricted; one demo client is restricted. */
const MOCK_TENANTS: TenantSummary[] = [
  {
    tenantId: 'jmdm.studio',
    displayName: 'JMDM Studio',
    status: 'active',
    emails: ['jack.dalgleishmorel@gmail.com'],
  },
  {
    tenantId: 'demo-studio.com',
    displayName: 'Demo Studio',
    status: 'active',
    blocks: ['richText', 'projectGrid', 'linkList'],
    emails: ['demo@example.com'],
  },
  {
    tenantId: 'acme.example',
    displayName: 'Acme Co.',
    status: 'active',
    emails: ['owner@acme.example'],
  },
];

/** Local-dev / test auth: an allow-listed email stands in for Google, against the in-memory API. */
export function MockAuth() {
  const toast = useToast();
  const [identity, setIdentity] = useState<{ email: string; tenantId: string | null } | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [api] = useState(() => createMockApi(sampleContent()));

  if (!identity) {
    const submit = () => {
      const lower = email.toLowerCase();
      const tenantId = DEFAULT_ALLOWLIST[lower] ?? null;
      const isOwner = DEFAULT_OWNERS.some((o) => o.toLowerCase() === lower);
      if (!tenantId && !isOwner) {
        setError(`No tenant mapping for ${email}. Ask the platform owner for access.`);
        return;
      }
      setIdentity({ email, tenantId });
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

  const adminApi = createMockAdminApi({
    email: identity.email,
    tenantId: identity.tenantId,
    owners: DEFAULT_OWNERS,
    tenants: MOCK_TENANTS,
  });

  return (
    <RoleRouter
      adminApi={adminApi}
      identity={{
        email: identity.email,
        signOut: () => {
          setIdentity(null);
          toast.info('Signed out', { duration: 1800 });
        },
      }}
      makeContentApi={() => api}
      makeUploader={() => mockUploader}
      previewUrlFor={() => PREVIEW_URL}
    />
  );
}
