// shell.jsx — TopBar, PageTabs, BlockEditor (left), Preview (right).
// Depends (window): BLOCK_TYPES, BlockCard, IconBtn, uid
const { useState: useS, useEffect: useE, useRef: useR } = React;

/* ============ ACCOUNT MENU ============ */
function AccountMenu({ user, theme, onSetTheme, onSignOut }) {
  const [open, setOpen] = useS(false);
  return (
    <div className="account">
      <button
        className={"avatar-btn focusable" + (open ? " avatar-btn--open" : "")}
        onClick={() => setOpen((o) => !o)}
        title="Account" aria-haspopup="true" aria-expanded={open}
      >
        {user.initials}
      </button>
      {open && (
        <React.Fragment>
          <div className="account__scrim" onClick={() => setOpen(false)} />
          <div className="account__menu glass" role="menu">
            <div className="account__head">
              <span className="account__avatar">{user.initials}</span>
              <div className="account__id">
                <span className="account__name">{user.name}</span>
                <span className="account__email" title={user.email}>{user.email}</span>
              </div>
            </div>

            <div className="account__section">
              <span className="account__label">Appearance</span>
              <div className="seg" role="radiogroup" aria-label="Theme">
                <button className={"seg__opt focusable" + (theme === "light" ? " seg__opt--on" : "")} onClick={() => onSetTheme("light")} role="radio" aria-checked={theme === "light"}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
                  Light
                </button>
                <button className={"seg__opt focusable" + (theme === "dark" ? " seg__opt--on" : "")} onClick={() => onSetTheme("dark")} role="radio" aria-checked={theme === "dark"}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
                  Dark
                </button>
              </div>
            </div>

            <div className="account__divider" />
            <button className="account__signout focusable" onClick={() => { setOpen(false); onSignOut(); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
              Sign out
            </button>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

/* ============ TOP BAR ============ */
function TopBar({ site, user, dirty, saving, onSave, onSignOut, theme, onSetTheme }) {
  return (
    <header className="topbar glass">
      <div className="topbar__left">
        <div className="brandmark" title="Knit">
          <span className="brandmark__logo" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8c4 0 4 8 8 8s4-8 8-8" /><path d="M4 16c4 0 4-8 8-8s4 8 8 8" opacity="0.45" />
            </svg>
          </span>
          <span className="brandmark__name">Knit</span>
        </div>
        <span className="topbar__sep" />
        <div className="site-id">
          <span className="site-id__name">{site.name}</span>
          <span className="site-id__dot">·</span>
          <span className="site-id__domain">{site.domain}</span>
        </div>
      </div>

      <div className="topbar__right">
        <span className={"saveflag" + (dirty ? " saveflag--dirty" : "")}>
          <span className="saveflag__dot" />
          {dirty ? "Unsaved changes" : "All changes published"}
        </span>

        <button className={"primary focusable" + (saving ? " primary--busy" : "")} onClick={onSave} disabled={saving}>
          {saving ? <span className="spinner" /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17l9-10" /></svg>}
          {saving ? "Publishing…" : "Save & publish"}
        </button>

        <AccountMenu user={user} theme={theme} onSetTheme={onSetTheme} onSignOut={onSignOut} />
      </div>
    </header>
  );
}

/* ============ PAGE TABS ============ */
function PageTabs({ pages, activeId, onSelect, onAdd }) {
  return (
    <div className="pagetabs glass">
      <div className="pagetabs__scroll scroll">
        {pages.map((p) => (
          <button
            key={p.id}
            className={"pagetab focusable" + (p.id === activeId ? " pagetab--active" : "")}
            onClick={() => onSelect(p.id)}
          >
            <span className="pagetab__title">{p.title}</span>
            <span className="pagetab__path">{p.path}</span>
          </button>
        ))}
      </div>
      <button className="pagetab__add focusable" title="Add page" onClick={onAdd}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>
  );
}

/* ============ BLOCK EDITOR (left pane) ============ */
function BlockEditor({ page, onChange, onAddBlock, justAddedId }) {
  const blocks = page.blocks;
  const confirm = useConfirm();
  const dragIndex = useR(null);
  const [overIndex, setOverIndex] = useS(null);
  const [dragging, setDragging] = useS(null);

  const dropAt = (i) => {
    const from = dragIndex.current;
    dragIndex.current = null; setDragging(null); setOverIndex(null);
    if (from == null || from === i) return;
    const next = blocks.slice();
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    onChange(next);
  };

  const patchBlock = (id, partial) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...partial } : b)));
  const deleteBlock = async (id) => {
    const b = blocks.find((x) => x.id === id);
    const name = BLOCK_TYPES[b.type].name;
    const ok = await confirm({
      title: `Delete the ${name} block?`,
      message: `This removes the block and everything in it from “${page.title}.” You can’t undo this.`,
      confirmLabel: "Delete block",
    });
    if (ok) onChange(blocks.filter((x) => x.id !== id));
  };

  return (
    <div className="editor-pane scroll">
      <div className="editor-pane__inner">
        <div className="pane-head">
          <h1 className="pane-head__title">{page.title}</h1>
          <span className="pane-head__count">{blocks.length} block{blocks.length === 1 ? "" : "s"}</span>
        </div>

        <div className="block-stack">
          {blocks.map((b, i) => (
            <BlockCard
              key={b.id}
              block={b}
              index={i}
              anim={b.id === justAddedId}
              onDelete={() => deleteBlock(b.id)}
              patch={(partial) => patchBlock(b.id, partial)}
              isOver={overIndex === i && dragging !== i}
              isDragging={dragging === i}
              onGripDragStart={() => { dragIndex.current = i; setDragging(i); }}
              onGripDragEnd={() => { dragIndex.current = null; setDragging(null); setOverIndex(null); }}
              onCardDragOver={(e) => { if (dragging == null) return; e.preventDefault(); if (overIndex !== i) setOverIndex(i); }}
              onCardDrop={() => dropAt(i)}
            />
          ))}
        </div>

        <div className="addblock glass">
          <span className="addblock__label">Add a block</span>
          <div className="addblock__chips">
            {Object.entries(BLOCK_TYPES).map(([type, meta]) => (
              <button key={type} className="chip focusable" onClick={() => onAddBlock(type)}>
                <span className="chip__glyph">{meta.glyph}</span>
                <span className="chip__text"><span className="chip__name">{meta.name}</span><span className="chip__blurb">{meta.blurb}</span></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ LIVE PREVIEW (right pane) ============ */
const DEVICES = {
  desktop: { w: null, label: "Desktop", icon: "M3 5h18v11H3zM8 20h8M12 16v4" },
  tablet:  { w: 800, label: "Tablet",  icon: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2" },
  mobile:  { w: 390, label: "Mobile",  icon: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM10.5 18h3" },
};

function Preview({ site, published, dirty, collapsed, onToggleCollapsed }) {
  const iframeRef = useR(null);
  const readyRef = useR(false);
  const [device, setDevice] = useS("desktop");
  const [pulse, setPulse] = useS(false);

  const activeId = site.activePageId;
  const page = published.pages.find((p) => p.id === activeId) || published.pages[0];
  const previewSite = { ...published, activePageId: page.id };

  const post = () => {
    if (iframeRef.current && readyRef.current)
      iframeRef.current.contentWindow.postMessage({ type: "knit:render", site: previewSite }, "*");
  };

  useE(() => {
    const onMsg = (e) => {
      if (e.data && e.data.type === "knit:preview-ready") { readyRef.current = true; post(); }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // preview re-renders ONLY when content is published or the page changes — not on every keystroke
  useE(() => { post(); setPulse(true); const t = setTimeout(() => setPulse(false), 800); return () => clearTimeout(t); }, [published, activeId]);

  const url = "https://" + published.domain + (page.path === "/" ? "" : page.path);
  const w = DEVICES[device].w;
  const reload = () => { readyRef.current = false; if (iframeRef.current) iframeRef.current.src = iframeRef.current.src; };

  return (
    <div className={"preview" + (collapsed ? " preview--collapsed" : "")}>
      {collapsed ? (
        <button className="prail focusable" onClick={onToggleCollapsed} title="Show live preview">
          <span className="prail__expand">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 7l-5 5 5 5M19 7l-5 5 5 5" /></svg>
          </span>
          <span className="prail__label">Live preview</span>
          {dirty && <span className="prail__dot" title="Unpublished changes" />}
        </button>
      ) : (
        <React.Fragment>
          <div className="preview__head">
            <span className="preview__headtitle">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
              Live preview
            </span>
            <button className="preview__collapse focusable" onClick={onToggleCollapsed} title="Collapse preview">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 7l5 5-5 5M5 7l5 5-5 5" /></svg>
              Collapse
            </button>
          </div>

          <div className={"preview__notice" + (dirty ? " preview__notice--warn" : "")}>
            <span className="preview__noticeicon">
              {dirty
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 2.7 17.5A1.6 1.6 0 0 0 4.1 20h15.8a1.6 1.6 0 0 0 1.4-2.5L13.7 3.9a1.6 1.6 0 0 0-2.8 0Z" /><path d="M12 9v4" /><circle cx="12" cy="16.5" r="0.4" fill="currentColor" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="7.6" r="0.4" fill="currentColor" /></svg>}
            </span>
            <span className="preview__noticetext">
              {dirty
                ? <React.Fragment><strong>Unsaved changes.</strong> Your edits won’t show here until you <strong>Save&nbsp;&amp;&nbsp;publish</strong>.</React.Fragment>
                : <React.Fragment>This preview shows your <strong>published</strong> site. New edits appear here only after you publish.</React.Fragment>}
            </span>
          </div>
        </React.Fragment>
      )}

      <div className="browser glass" style={collapsed ? { display: "none" } : null}>
        <div className="browser__chrome">
          <div className="browser__lights"><span /><span /><span /></div>
          <div className="browser__tab">
            <span className="browser__favicon" />
            <span className="browser__tabtitle">{published.name} — {page.title}</span>
            <span className="browser__tabclose">×</span>
          </div>
          <div className="browser__nav">
            <button className="browser__navbtn focusable" title="Reload" onClick={reload}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" /></svg>
            </button>
          </div>
          <div className="browser__url">
            <svg className="browser__lock" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            <span className="browser__urltext">{url}</span>
            <span className={"browser__live" + (pulse ? " is-pulse" : "")}><span className="browser__livepip" />live</span>
          </div>
          <div className="browser__devices">
            {Object.entries(DEVICES).map(([k, d]) => (
              <button key={k} className={"devbtn focusable" + (device === k ? " devbtn--active" : "")} title={d.label} onClick={() => setDevice(k)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d.icon} /></svg>
              </button>
            ))}
          </div>
        </div>
        <div className="browser__viewport scroll">
          <div className="browser__frame" style={w ? { width: w, margin: "0 auto" } : null}>
            <iframe ref={iframeRef} title="Live preview of jmdm.studio" src="client-site.html" className="browser__iframe" />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TopBar, PageTabs, BlockEditor, Preview });
