import { registry } from '@csp/blocks';
import { useEffect, useMemo, useState } from 'react';
import type { AdminApi, TenantSummary } from './api';
import { blockMeta } from './blockMeta';
import { KnitLogo } from './icons';
import { AccountMenu } from './shell/AccountMenu';
import { useTheme } from './theme';
import { useToast } from './toasts';

/** Every registered block type, in registry order, with editor presentation metadata. */
const ALL_TYPES = registry.list().map((d) => ({ type: d.type, meta: blockMeta(d.type, d.label) }));

/**
 * The platform-owner console: the list of active clients and, per client, which block types they may
 * use. Provisioning is owner-controlled and stored in `csp-tenants`; it only ever *restricts* — a
 * client with no allow-list gets every block. Reuses the glass shell (top bar + account menu + theme)
 * so it feels like one product with the editor.
 */
export function OwnerConsole({
  adminApi,
  email,
  signOut,
  ownTenantId,
  onEditOwnSite,
}: {
  adminApi: AdminApi;
  email: string;
  signOut: () => void;
  ownTenantId: string | null;
  onEditOwnSite?: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const [tenants, setTenants] = useState<TenantSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    adminApi.listTenants().then((t) => active && setTenants(t));
    return () => {
      active = false;
    };
  }, [adminApi]);

  const selected = tenants?.find((t) => t.tenantId === selectedId) ?? null;

  /** Apply a saved allow-list to the local list so counts stay in sync without a refetch. */
  const applyBlocks = (tenantId: string, blocks: string[] | null) =>
    setTenants(
      (prev) =>
        prev?.map((t) => (t.tenantId === tenantId ? { ...t, blocks: blocks ?? undefined } : t)) ??
        prev,
    );

  return (
    <div className="app">
      <header className="topbar glass">
        <div className="topbar__left">
          <div className="brandmark" title="Knit">
            <span className="brandmark__logo" aria-hidden="true">
              <KnitLogo size={22} />
            </span>
            <span className="brandmark__name">Knit</span>
          </div>
          <span className="topbar__sep" />
          <div className="site-id">
            <span className="site-id__name">Platform admin</span>
            <span className="site-id__dot">·</span>
            <span className="site-id__domain">Clients &amp; provisioning</span>
          </div>
        </div>
        <div className="topbar__right">
          {ownTenantId && onEditOwnSite && (
            <button className="ghost focusable" onClick={onEditOwnSite}>
              Edit my own site
            </button>
          )}
          <AccountMenu email={email} theme={theme} onSetTheme={setTheme} onSignOut={signOut} />
        </div>
      </header>

      <main className="owner">
        {tenants == null ? (
          <div className="admin__loading">Loading clients…</div>
        ) : selected ? (
          <ProvisionPanel
            tenant={selected}
            onClose={() => setSelectedId(null)}
            onSave={async (blocks) => {
              const res = await adminApi.setTenantBlocks(selected.tenantId, blocks);
              return { ok: res.ok, blocks };
            }}
            onSaved={(blocks) => applyBlocks(selected.tenantId, blocks)}
          />
        ) : (
          <ClientList tenants={tenants} onSelect={setSelectedId} />
        )}
      </main>
    </div>
  );
}

/** The clients overview — one card per active client, with an enabled-blocks summary. */
function ClientList({
  tenants,
  onSelect,
}: {
  tenants: TenantSummary[];
  onSelect: (tenantId: string) => void;
}) {
  return (
    <div className="owner__inner">
      <div className="pane-head">
        <h1 className="pane-head__title">Active clients</h1>
        <span className="pane-head__count">
          {tenants.length} client{tenants.length === 1 ? '' : 's'}
        </span>
      </div>

      {tenants.length === 0 ? (
        <p className="csp-field__hint">No clients yet. They appear here once onboarded.</p>
      ) : (
        <div className="client-grid">
          {tenants.map((t) => {
            const enabled = t.blocks ? t.blocks.length : ALL_TYPES.length;
            return (
              <button
                key={t.tenantId}
                className="client-card focusable"
                onClick={() => onSelect(t.tenantId)}
              >
                <div className="client-card__head">
                  <span className="client-card__name">{t.displayName}</span>
                  <span className={`client-card__status client-card__status--${t.status}`}>
                    {t.status}
                  </span>
                </div>
                <span className="client-card__domain">{t.tenantId}</span>
                {t.emails.length > 0 && (
                  <span className="client-card__email">{t.emails.join(', ')}</span>
                )}
                <span className="client-card__blocks">
                  {t.blocks ? `${enabled} of ${ALL_TYPES.length} blocks` : 'All blocks'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** The per-client provisioning panel: a master "All blocks" toggle plus a per-type checklist. */
function ProvisionPanel({
  tenant,
  onClose,
  onSave,
  onSaved,
}: {
  tenant: TenantSummary;
  onClose: () => void;
  onSave: (blocks: string[] | null) => Promise<{ ok: boolean; blocks: string[] | null }>;
  onSaved: (blocks: string[] | null) => void;
}) {
  const toast = useToast();
  // Initial draft: `null` ⇒ all allowed (no restriction); otherwise the explicit subset.
  const initial = useMemo(() => (tenant.blocks ? new Set(tenant.blocks) : null), [tenant.blocks]);
  const [restrict, setRestrict] = useState(initial != null);
  const [chosen, setChosen] = useState<Set<string>>(
    initial ?? new Set(ALL_TYPES.map((t) => t.type)),
  );
  const [saving, setSaving] = useState(false);

  const toggle = (type: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  // When restricted, at least one type must be selected (an empty allow-list is meaningless and the
  // backend would read it as "all" anyway).
  const blocked = restrict && chosen.size === 0;

  const save = async () => {
    const blocks = restrict ? [...chosen] : null;
    setSaving(true);
    const res = await onSave(blocks);
    setSaving(false);
    if (res.ok) {
      onSaved(blocks);
      toast.success('Provisioning saved', {
        message: blocks ? `${blocks.length} block type(s) enabled.` : 'All blocks enabled.',
        dedupe: 'provision',
      });
      onClose();
    } else {
      toast.error('Couldn’t save provisioning', { dedupe: 'provision' });
    }
  };

  return (
    <div className="owner__inner">
      <button className="owner__back focusable" onClick={onClose} aria-label="Back to clients">
        ‹ Clients
      </button>
      <div className="pane-head">
        <h1 className="pane-head__title">{tenant.displayName}</h1>
        <span className="pane-head__count">{tenant.tenantId}</span>
      </div>

      <label className="provision__master">
        <input
          type="checkbox"
          checked={!restrict}
          onChange={(e) => setRestrict(!e.target.checked)}
        />
        <span>
          <strong>All blocks</strong>
          <span className="csp-field__hint">
            This client can add every block type. Uncheck to restrict.
          </span>
        </span>
      </label>

      <fieldset className="provision__grid" disabled={!restrict}>
        {ALL_TYPES.map(({ type, meta }) => (
          <label
            key={type}
            className={'provision__item' + (restrict ? '' : ' provision__item--off')}
          >
            <input
              type="checkbox"
              checked={!restrict || chosen.has(type)}
              onChange={() => toggle(type)}
              disabled={!restrict}
            />
            <span className="provision__glyph">{meta.glyph}</span>
            <span className="provision__text">
              <span className="provision__name">{meta.name}</span>
              <span className="provision__blurb">{meta.blurb}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {blocked && (
        <p className="csp-field__hint provision__warn">
          Select at least one block, or re-enable “All blocks”.
        </p>
      )}

      <div className="provision__actions">
        <button className="ghost focusable" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button
          className="primary focusable"
          onClick={() => void save()}
          disabled={saving || blocked}
        >
          {saving ? 'Saving…' : 'Save provisioning'}
        </button>
      </div>
    </div>
  );
}
