import { CheckIcon, KnitLogo } from '../icons';
import type { Theme } from '../theme';
import { AccountMenu } from './AccountMenu';

/**
 * The top bar (README §Top bar). Left: Knit brandmark + site name · domain. Right (only three
 * things): the save-state indicator, the primary "Save & publish" button, and the account avatar.
 */
export function TopBar({
  siteName,
  domain,
  email,
  dirty,
  saving,
  theme,
  onSave,
  onSetTheme,
  onSignOut,
  onBack,
}: {
  siteName: string;
  domain: string;
  email: string;
  dirty: boolean;
  saving: boolean;
  theme: Theme;
  onSave: () => void;
  onSetTheme: (theme: Theme) => void;
  onSignOut: () => void;
  /** When set (owner editing their own site), shows a "Clients" back link to the owner console. */
  onBack?: () => void;
}) {
  return (
    <header className="topbar glass">
      <div className="topbar__left">
        {onBack && (
          <button className="topbar__back focusable" onClick={onBack} aria-label="Back to clients">
            ‹ Clients
          </button>
        )}
        <div className="brandmark" title="Knit">
          <span className="brandmark__logo" aria-hidden="true">
            <KnitLogo size={22} />
          </span>
          <span className="brandmark__name">Knit</span>
        </div>
        <span className="topbar__sep" />
        <div className="site-id">
          <span className="site-id__name">{siteName}</span>
          <span className="site-id__dot">·</span>
          <span className="site-id__domain">{domain}</span>
        </div>
      </div>

      <div className="topbar__right">
        <span className={'saveflag' + (dirty ? ' saveflag--dirty' : '')}>
          <span className="saveflag__dot" />
          {dirty ? 'Unsaved changes' : 'All changes published'}
        </span>

        <button className="primary focusable" onClick={onSave} disabled={saving}>
          {saving ? <span className="spinner" /> : <CheckIcon />}
          {saving ? 'Publishing…' : 'Save & publish'}
        </button>

        <AccountMenu email={email} theme={theme} onSetTheme={onSetTheme} onSignOut={onSignOut} />
      </div>
    </header>
  );
}
