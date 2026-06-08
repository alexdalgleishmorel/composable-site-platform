// toasts.jsx — Knit toast system (success / error / info), liquid-glass.
// Exports: ToastProvider, useToast, ToastViewport (mounted by provider).
const { createContext, useContext, useState, useCallback, useRef, useEffect } = React;

const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);

/* ---- icons (simple glyphs, no faux illustration) ---- */
function ToastIcon({ variant }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };
  if (variant === "success")
    return <svg {...common} stroke="currentColor"><path d="M20 6 9 17l-5-5" /></svg>;
  if (variant === "error")
    return <svg {...common} stroke="currentColor"><path d="M12 8v5" /><circle cx="12" cy="16.5" r="0.4" fill="currentColor" stroke="currentColor" /><path d="M10.3 3.9 2.7 17.5A1.6 1.6 0 0 0 4.1 20h15.8a1.6 1.6 0 0 0 1.4-2.5L13.7 3.9a1.6 1.6 0 0 0-2.8 0Z" /></svg>;
  return <svg {...common} stroke="currentColor"><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="7.6" r="0.4" fill="currentColor" stroke="currentColor" /></svg>;
}

function ToastCard({ t, onClose }) {
  const [leaving, setLeaving] = useState(false);
  const close = useCallback(() => { setLeaving(true); setTimeout(() => onClose(t.id), 240); }, [t.id, onClose]);

  useEffect(() => {
    if (t.duration > 0) {
      const id = setTimeout(close, t.duration);
      return () => clearTimeout(id);
    }
  }, [t.duration, close]);

  const accent = { success: "var(--ok)", error: "var(--err)", info: "var(--accent)" }[t.variant];
  const soft = { success: "var(--ok-soft)", error: "var(--err-soft)", info: "var(--accent-soft)" }[t.variant];

  return (
    <div
      role={t.variant === "error" ? "alert" : "status"}
      className={"toast" + (leaving ? " toast--leaving" : "")}
      style={{ "--toast-accent": accent, "--toast-soft": soft }}
    >
      <div className="toast__bar" />
      <div className="toast__icon"><ToastIcon variant={t.variant} /></div>
      <div className="toast__body">
        <div className="toast__title">{t.title}</div>
        {t.message && <div className="toast__msg">{t.message}</div>}
        {t.items && t.items.length > 0 && (
          <ul className="toast__list">
            {t.items.map((it, i) => (
              <li key={i}><span className="toast__where">{it.where}</span>{it.what}</li>
            ))}
          </ul>
        )}
        {t.action && (
          <button className="toast__action" onClick={() => { t.action.onClick(); close(); }}>
            {t.action.label}
          </button>
        )}
      </div>
      <button className="toast__close focusable" aria-label="Dismiss" onClick={close}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
      {t.duration > 0 && <div className="toast__timer" style={{ animationDuration: t.duration + "ms" }} />}
    </div>
  );
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(1);

  const remove = useCallback((id) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const push = useCallback((opts) => {
    const id = idRef.current++;
    const variant = opts.variant || "info";
    const defaultDur = variant === "error" ? 0 : variant === "success" ? 3200 : 2400;
    setToasts((ts) => [
      ...ts.filter((t) => !(opts.dedupe && t.dedupe === opts.dedupe)),
      { id, variant, duration: opts.duration ?? defaultDur, ...opts },
    ]);
    return id;
  }, []);

  const api = {
    push,
    success: (title, opts = {}) => push({ ...opts, variant: "success", title }),
    error: (title, opts = {}) => push({ ...opts, variant: "error", title }),
    info: (title, opts = {}) => push({ ...opts, variant: "info", title }),
    dismiss: remove,
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-viewport" aria-live="polite">
        {toasts.map((t) => <ToastCard key={t.id} t={t} onClose={remove} />)}
      </div>
    </ToastCtx.Provider>
  );
}

Object.assign(window, { ToastProvider, useToast });
