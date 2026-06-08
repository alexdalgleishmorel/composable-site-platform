import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CloseIcon, InfoIcon, WarningIcon } from './icons';

/**
 * Liquid-glass toast system (README §6). Bottom-right stack with a left accent bar, icon tile, title,
 * optional message and detail list, dismiss button, and a timer bar for auto-dismissing toasts.
 *
 * - success: auto-dismiss ~3.2s   - info: auto-dismiss ~2.4s   - error: persists until dismissed.
 * A `dedupe` key replaces a prior toast with the same key (e.g. repeated saves).
 */
export type ToastVariant = 'success' | 'error' | 'info';

/** One "where → what" line in an error toast (a located validation failure). */
export interface ToastItem {
  where: string;
  what: string;
}

export interface ToastOptions {
  message?: string;
  items?: ToastItem[];
  duration?: number;
  dedupe?: string;
}

interface Toast extends ToastOptions {
  id: number;
  variant: ToastVariant;
  title: string;
  duration: number;
}

interface ToastApi {
  success: (title: string, opts?: ToastOptions) => number;
  error: (title: string, opts?: ToastOptions) => number;
  info: (title: string, opts?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') return <CheckGlyph />;
  if (variant === 'error') return <WarningIcon size={18} />;
  return <InfoIcon size={18} />;
}

function CheckGlyph() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const ACCENT: Record<ToastVariant, string> = {
  success: 'var(--ok)',
  error: 'var(--err)',
  info: 'var(--accent)',
};
const SOFT: Record<ToastVariant, string> = {
  success: 'var(--ok-soft)',
  error: 'var(--err-soft)',
  info: 'var(--accent-soft)',
};

function ToastCard({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  const [leaving, setLeaving] = useState(false);
  const close = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onClose(toast.id), 240);
  }, [toast.id, onClose]);

  useEffect(() => {
    if (toast.duration > 0) {
      const id = setTimeout(close, toast.duration);
      return () => clearTimeout(id);
    }
  }, [toast.duration, close]);

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className={'toast' + (leaving ? ' toast--leaving' : '')}
      style={
        {
          '--toast-accent': ACCENT[toast.variant],
          '--toast-soft': SOFT[toast.variant],
        } as React.CSSProperties
      }
    >
      <div className="toast__bar" />
      <div className="toast__icon">
        <ToastIcon variant={toast.variant} />
      </div>
      <div className="toast__body">
        <div className="toast__title">{toast.title}</div>
        {toast.message && <div className="toast__msg">{toast.message}</div>}
        {toast.items && toast.items.length > 0 && (
          <ul className="toast__list">
            {toast.items.map((it, i) => (
              <li key={i}>
                <span className="toast__where">{it.where}</span>
                {it.what}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button className="toast__close" aria-label="Dismiss" onClick={close}>
        <CloseIcon />
      </button>
      {toast.duration > 0 && (
        <div className="toast__timer" style={{ animationDuration: toast.duration + 'ms' }} />
      )}
    </div>
  );
}

const DEFAULT_DURATION: Record<ToastVariant, number> = { success: 3200, info: 2400, error: 0 };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);

  const remove = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const push = useCallback((variant: ToastVariant, title: string, opts: ToastOptions = {}) => {
    const id = idRef.current++;
    const toast: Toast = {
      id,
      variant,
      title,
      duration: opts.duration ?? DEFAULT_DURATION[variant],
      message: opts.message,
      items: opts.items,
      dedupe: opts.dedupe,
    };
    setToasts((ts) => [...ts.filter((t) => !(opts.dedupe && t.dedupe === opts.dedupe)), toast]);
    return id;
  }, []);

  const api: ToastApi = {
    success: (title, opts) => push('success', title, opts),
    error: (title, opts) => push('error', title, opts),
    info: (title, opts) => push('info', title, opts),
    dismiss: remove,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-viewport" aria-live="polite">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
