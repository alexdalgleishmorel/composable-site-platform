import { useState } from 'react';
import { MoonIcon, SignOutIcon, SunIcon } from '../icons';
import type { Theme } from '../theme';
import { displayName, initialsOf } from './identity';

/**
 * The account popover (README §Account menu): opens from the avatar as an **opaque** menu with a
 * full-screen click-away scrim. Holds the appearance (Light/Dark) segmented control and Sign out.
 * The avatar is the only account control in the top bar.
 */
export function AccountMenu({
  email,
  theme,
  onSetTheme,
  onSignOut,
}: {
  email: string;
  theme: Theme;
  onSetTheme: (theme: Theme) => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const initials = initialsOf(email);

  return (
    <div className="account">
      <button
        className={'avatar-btn focusable' + (open ? ' avatar-btn--open' : '')}
        onClick={() => setOpen((o) => !o)}
        title="Account"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {initials}
      </button>
      {open && (
        <>
          <div className="account__scrim" onClick={() => setOpen(false)} />
          <div className="account__menu" role="menu">
            <div className="account__head">
              <span className="account__avatar">{initials}</span>
              <div className="account__id">
                <span className="account__name">{displayName(email)}</span>
                <span className="account__email" title={email}>
                  {email}
                </span>
              </div>
            </div>

            <div className="account__section">
              <span className="account__label">Appearance</span>
              <div className="seg" role="radiogroup" aria-label="Theme">
                <button
                  className={'seg__opt focusable' + (theme === 'light' ? ' seg__opt--on' : '')}
                  onClick={() => onSetTheme('light')}
                  role="radio"
                  aria-checked={theme === 'light'}
                >
                  <SunIcon />
                  Light
                </button>
                <button
                  className={'seg__opt focusable' + (theme === 'dark' ? ' seg__opt--on' : '')}
                  onClick={() => onSetTheme('dark')}
                  role="radio"
                  aria-checked={theme === 'dark'}
                >
                  <MoonIcon />
                  Dark
                </button>
              </div>
            </div>

            <div className="account__divider" />
            <button
              className="account__row account__row--danger focusable"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
            >
              <SignOutIcon />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
