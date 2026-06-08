import type { ReactNode } from 'react';
import { GoogleG, KnitLogo } from '../icons';

/**
 * The sign-in screen (README §1): a single glass card over the gradient backdrop. Presentational —
 * each auth backend wires `onGoogle`. The mock backend passes its email field as `children`.
 */
export function SignIn({
  onGoogle,
  busy = false,
  error,
  children,
}: {
  onGoogle: () => void;
  busy?: boolean;
  error?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="signin">
      <div className="signin__card glass anim-rise">
        <div className="signin__logo">
          <KnitLogo size={40} />
        </div>
        <h1 className="signin__name">Knit</h1>
        <p className="signin__sub">
          The shared editor for every site you publish. Sign in to pick up where you left off.
        </p>
        {children && <div className="signin__extra">{children}</div>}
        <button
          type="button"
          className={'gbtn focusable' + (busy ? ' gbtn--busy' : '')}
          onClick={onGoogle}
          disabled={busy}
        >
          {busy ? <span className="spinner spinner--dark" /> : <GoogleG />}
          {busy ? 'Signing in…' : 'Sign in with Google'}
        </button>
        <p className="signin__legal">Google is the only sign-in method for Knit.</p>
        {error && <p className="signin__err">{error}</p>}
      </div>
      <div className="signin__foot">Knit · platform editor</div>
    </div>
  );
}
