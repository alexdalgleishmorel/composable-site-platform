// confirm.jsx — reusable glass confirmation modal.
// Exports (window): ConfirmProvider, useConfirm  →  const confirm = useConfirm(); await confirm({...})
const { createContext: cC, useContext: uCx, useState: uSt, useCallback: uCb, useRef: uRf, useEffect: uEf } = React;

const ConfirmCtx = cC(null);
const useConfirm = () => uCx(ConfirmCtx);

function ConfirmProvider({ children }) {
  const [state, setState] = uSt(null);
  const [leaving, setLeaving] = uSt(false);
  const resolver = uRf(null);

  const confirm = uCb((opts) => new Promise((res) => { resolver.current = res; setLeaving(false); setState(opts || {}); }), []);

  const close = uCb((val) => {
    setLeaving(true);
    setTimeout(() => {
      setState(null); setLeaving(false);
      if (resolver.current) { resolver.current(val); resolver.current = null; }
    }, 160);
  }, []);

  uEf(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(false); }
      if (e.key === "Enter") { e.preventDefault(); close(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  const danger = state ? state.danger !== false : false;

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <div className={"modal-scrim" + (leaving ? " modal-scrim--leaving" : "")} onMouseDown={(e) => { if (e.target === e.currentTarget) close(false); }}>
          <div className={"modal" + (leaving ? " modal--leaving" : "")} role="dialog" aria-modal="true" aria-labelledby="cf-title">
            <div className={"modal__icon" + (danger ? " modal__icon--danger" : "")}>
              {danger ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6M10 11v6M14 11v6" /></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><circle cx="12" cy="16.2" r="0.4" fill="currentColor" /></svg>
              )}
            </div>
            <h2 className="modal__title" id="cf-title">{state.title || "Are you sure?"}</h2>
            {state.message && <p className="modal__msg">{state.message}</p>}
            <div className="modal__actions">
              <button className="btn-cancel focusable" onClick={() => close(false)}>{state.cancelLabel || "Cancel"}</button>
              <button className={"btn-confirm focusable" + (danger ? " btn-confirm--danger" : "")} autoFocus onClick={() => close(true)}>
                {state.confirmLabel || "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

Object.assign(window, { ConfirmProvider, useConfirm });
