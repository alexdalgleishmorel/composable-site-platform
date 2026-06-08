import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { InfoIcon, TrashIcon } from './icons';

/**
 * Promise-based glass confirmation modal (README §7). `useConfirm()` returns
 * `confirm({ title, message, confirmLabel, danger })` → `Promise<boolean>`. Centered dialog over a
 * blurred scrim; Esc cancels, Enter confirms; entrance is transform-only so the resting state is
 * always visible. Deleting a block must go through this before it takes effect.
 */
export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Defaults to true — danger styling (red icon + danger-gradient confirm). */
  danger?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const [leaving, setLeaving] = useState(false);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (opts) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setLeaving(false);
        setState(opts ?? {});
      }),
    [],
  );

  const close = useCallback((value: boolean) => {
    setLeaving(true);
    setTimeout(() => {
      setState(null);
      setLeaving(false);
      if (resolver.current) {
        resolver.current(value);
        resolver.current = null;
      }
    }, 160);
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        close(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, close]);

  const danger = state ? state.danger !== false : false;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className={'modal-scrim' + (leaving ? ' modal-scrim--leaving' : '')}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close(false);
          }}
        >
          <div
            className={'modal' + (leaving ? ' modal--leaving' : '')}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cf-title"
          >
            <div className={'modal__icon' + (danger ? ' modal__icon--danger' : '')}>
              {danger ? <TrashIcon size={22} /> : <InfoIcon size={22} />}
            </div>
            <h2 className="modal__title" id="cf-title">
              {state.title ?? 'Are you sure?'}
            </h2>
            {state.message && <p className="modal__msg">{state.message}</p>}
            <div className="modal__actions">
              <button className="btn-cancel" onClick={() => close(false)}>
                {state.cancelLabel ?? 'Cancel'}
              </button>
              <button
                className={'btn-confirm' + (danger ? ' btn-confirm--danger' : '')}
                autoFocus
                onClick={() => close(true)}
              >
                {state.confirmLabel ?? 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
