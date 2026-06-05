/* jmdm — shared components
   Header / wordmark / placeholders / masthead chrome */

const { useState, useEffect, useRef, useMemo } = React;

// ---- wordmark: "jmdm" + lemon sigil as the punctuation
// Lemon-only mark — for non-wordmark uses.
function LemonSigil() {
  return (
    <img
      className="lemon-img"
      src={window.__resources.lemonSvg}
      alt=""
      aria-hidden="true"
      draggable="false" />);


}

// Full jmdm + lemon lockup, supplied as a single SVG by the user.
function Wordmark({ onClick }) {
  return (
    <a className="wordmark" onClick={onClick} aria-label="jmdm — home" data-comment-anchor="4d2ad4b630-a-23-5">
      <img
        className="wordmark__lockup"
        src={window.__resources.lockupSvg}
        alt="jmdm"
        draggable="false" />
      
    </a>);

}

// ---- masthead: jmdm + heavy bar + nav.
//      Original masthead lives in normal flow and scrolls away.
//      A separate fixed MiniNav slides in from the top when collapsed,
//      so the layout never shifts (no flicker).
function Masthead({ route, go }) {
  const tab = (key) => route.startsWith(key) ? "is-active" : "";
  const { adminMode, shopEnabled } = window.useAdmin();
  const shopVisible = adminMode || shopEnabled;
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setCollapsed(prev => {
        if (!prev && y > 140) return true;
        if (prev && y < 60) return false;
        return prev;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className="masthead">
        <div className="masthead__row">
          <Wordmark onClick={() => go("/")} />
          <div className="bar bar--heavy"></div>
          <nav className="nav">
            <a className={tab("/projects") || (route === "/" ? "is-active" : "")} onClick={() => go("/projects")}>projects</a>
            {shopVisible && (
              <a className={tab("/shop") + (adminMode && !shopEnabled ? " is-beta" : "")} onClick={() => go("/shop")}>
                shop{adminMode && !shopEnabled ? <span className="nav__beta">beta</span> : null}
              </a>
            )}
            <a className={tab("/about")} onClick={() => go("/about")}>about</a>
          </nav>
        </div>
      </header>
      <div className={"mini-nav " + (collapsed ? "is-visible" : "")} aria-hidden={!collapsed}>
        <nav className="nav">
          <a className={tab("/projects") || (route === "/" ? "is-active" : "")} onClick={() => go("/projects")}>projects</a>
          {shopVisible && (
            <a className={tab("/shop") + (adminMode && !shopEnabled ? " is-beta" : "")} onClick={() => go("/shop")}>
              shop{adminMode && !shopEnabled ? <span className="nav__beta">beta</span> : null}
            </a>
          )}
          <a className={tab("/about")} onClick={() => go("/about")}>about</a>
        </nav>
      </div>
    </>
  );
}

// ---- Floating bag — a lemon FAB shown only on the shop page.
//      Lives in the bottom-right, expands upward into a panel.
function FloatingBag({ cart, removeFromCart, open, setOpen }) {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const total = cart.reduce((s, c) => s + (c.item.price || 0) * c.qty, 0);
  const ref = React.useRef(null);
  const [pulse, setPulse] = React.useState(false);

  // Pulse the lemon whenever a new item lands in the bag
  React.useEffect(() => {
    if (count === 0) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, [count]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <>
      {open && (
        <div className="fbag-backdrop" onClick={() => setOpen(false)} />
      )}
      <div className={"fbag-modal " + (open ? "is-open" : "")} aria-hidden={!open}>
        <div className="fbag__panel" role="dialog" aria-label="bag" ref={ref}>
          <div className="fbag__panel__head">
            <span>Bag</span>
            <span>{count} {count === 1 ? "item" : "items"}</span>
            <button className="fbag__panel__close" onClick={() => setOpen(false)} aria-label="close">×</button>
          </div>
          <div className="fbag__panel__body">
            {cart.length === 0 ? (
              <div className="fbag__empty">your bag is empty.</div>
            ) : (
              cart.map((c, i) => (
                <div key={i} className="fbag__row">
                  <div className="fbag__row__title">{c.item.title}</div>
                  <div className="fbag__row__meta">{c.item.cat} · qty {c.qty}</div>
                  <div className="fbag__row__price">${(c.item.price || 0) * c.qty}</div>
                  <button className="fbag__row__rm" onClick={() => removeFromCart(i)} aria-label="remove">×</button>
                </div>
              ))
            )}
          </div>
          <div className="fbag__panel__foot">
            <div className="fbag__total">
              <span>subtotal</span>
              <b>${total} CAD</b>
            </div>
            <button className="btn btn--full" disabled style={{opacity: cart.length ? 0.55 : 0.3, cursor: "not-allowed"}}>
              checkout · autumn 2026
            </button>
          </div>
        </div>
      </div>
      <div className={"fbag " + (open ? "is-open" : "")}>
        <button
          className={"fbag__lemon" + (pulse ? " is-pulse" : "")}
          onClick={() => setOpen(!open)}
          aria-label={open ? "close bag" : "open bag"}
          aria-expanded={open}>
          <img src={window.__resources.lemonSvg} alt="" className="fbag__lemon__img" draggable="false" />
          <span className="fbag__lemon__count">{count}</span>
        </button>
      </div>
    </>
  );
}

Object.assign(window, { Wordmark, LemonSigil, Masthead, FloatingBag, Placeholder, RowPreview, Foot, pickKind });

// ---- placeholder image: a small system of B&W tile treatments
function Placeholder({ kind = "stripe", label, num, style }) {
  const klass = `placeholder placeholder--${kind}`;
  return (
    <div className={klass} style={style}>
      {label && <span className="placeholder__label">{label}</span>}
      {num && <span className="placeholder__num">{num}</span>}
    </div>);

}

// pick a placeholder kind for an item deterministically
function pickKind(item) {
  if (item.kind) return item.kind;
  const k = ["stripe", "dot", "cross", "solid", "stripe", "dot"];
  let s = 0;
  for (let i = 0; i < (item.cat || "").length; i++) s += item.cat.charCodeAt(i);
  return k[s % k.length];
}

// ---- floating preview that follows mouse (used by index)
function RowPreview({ active, pos, item }) {
  if (!item) return null;
  const kind = pickKind(item);
  const num = (item.cat || "").split("-").pop() + ".jpg";
  return (
    <div
      className={"row-preview " + (active ? "is-on" : "")}
      style={{ left: pos.x, top: pos.y }}>
      
      <Placeholder kind={kind} label={item.title.toLowerCase()} num={num} />
    </div>);

}

// ---- foot
function Foot({ go }) {
  const { adminMode, setAdminMode } = window.useAdmin();
  return (
    <footer className="foot">
      <div className="foot__col foot__col--contact">
        <h6>contact</h6>
        <a href="mailto:jack.dalgleishmorel@live.ca">jack.dalgleishmorel@live.ca</a>
        <a href="https://instagram.com/jackkme" target="_blank" rel="noreferrer">instagram · @jackkme</a>
      </div>
      <div className="foot__col foot__col--copy">
        <div>© jmdm — jack dalgleish-morel, 2026</div>
        <label className="foot__admin">
          <input
            type="checkbox"
            checked={!!adminMode}
            onChange={(e) => setAdminMode(e.target.checked)} />
          <span>admin mode</span>
          <span className="foot__admin__note">(temporary for demo)</span>
        </label>
      </div>
    </footer>);

}

Object.assign(window, { Wordmark, LemonSigil, Masthead, Placeholder, RowPreview, Foot, pickKind });