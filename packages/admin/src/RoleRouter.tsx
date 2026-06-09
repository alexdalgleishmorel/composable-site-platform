import type { Uploader } from '@csp/blocks';
import { useEffect, useState } from 'react';
import type { AdminApi, ContentApi, WhoAmI } from './api';
import { OwnerConsole } from './OwnerConsole';
import { AdminWorkspace } from './AdminWorkspace';
import { SessionContext } from './session';

/** Identity common to both auth backends (Cognito and the local mock). */
export interface Identity {
  email: string;
  signOut: () => void;
}

/**
 * Post-sign-in router. Calls `GET /admin/whoami` and sends platform owners to the {@link OwnerConsole}
 * (clients + block provisioning) and everyone else to their tenant's {@link AdminWorkspace}, with the
 * "Add a block" menu filtered to the tenant's provisioned types. An owner who also owns a tenant can
 * jump into their own editor and back. The auth backend supplies the transports via factories so this
 * branching is shared, not duplicated per backend.
 */
export function RoleRouter({
  adminApi,
  identity,
  makeContentApi,
  makeUploader,
  previewUrlFor,
}: {
  adminApi: AdminApi;
  identity: Identity;
  makeContentApi: (tenantId: string) => ContentApi;
  makeUploader: (tenantId: string) => Uploader | null;
  previewUrlFor: (tenantId: string) => string;
}) {
  const [who, setWho] = useState<WhoAmI | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingOwn, setEditingOwn] = useState(false);

  useEffect(() => {
    let active = true;
    adminApi
      .whoami()
      .then((w) => active && setWho(w))
      .catch(() => active && setError('Could not load your account. Please try again.'));
    return () => {
      active = false;
    };
  }, [adminApi]);

  if (error) return <div className="admin__error">{error}</div>;
  if (!who) return <div className="admin__loading">Signing in…</div>;

  const editor = (tenantId: string, allowedTypes: string[] | null, onBack?: () => void) => (
    <SessionContext.Provider value={{ email: identity.email, tenantId, signOut: identity.signOut }}>
      <AdminWorkspace
        api={makeContentApi(tenantId)}
        uploader={makeUploader(tenantId)}
        previewUrl={previewUrlFor(tenantId)}
        allowedTypes={allowedTypes}
        onBack={onBack}
      />
    </SessionContext.Provider>
  );

  if (who.isOwner) {
    if (editingOwn && who.tenantId) {
      return editor(who.tenantId, who.blocks, () => setEditingOwn(false));
    }
    return (
      <OwnerConsole
        adminApi={adminApi}
        email={identity.email}
        signOut={identity.signOut}
        ownTenantId={who.tenantId}
        onEditOwnSite={who.tenantId ? () => setEditingOwn(true) : undefined}
      />
    );
  }

  if (!who.tenantId) {
    return (
      <div className="admin__error">
        No tenant is mapped to {identity.email}. Ask the platform owner for access.
      </div>
    );
  }
  return editor(who.tenantId, who.blocks);
}
