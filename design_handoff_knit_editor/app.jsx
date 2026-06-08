// app.jsx — SignIn + App root (auth, theme/density, save+validation, toasts, tweaks).
// Depends (window): TopBar, PageTabs, BlockEditor, Preview, seedSite, uid, BLOCK_TYPES,
//                    ToastProvider, useToast, useTweaks, Tweaks* controls
const { useState: useA, useEffect: useAE, useMemo: useAM } = React;

const KNIT_USER = { email: "jack.dalgleishmorel@gmail.com", initials: "JD", name: "Jack Dalgleish-Morel" };

/* ---------------- Knit wordmark ---------------- */
function KnitLogo({ size = 30 }) {
  return (
    <span className="knitlogo" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8c4 0 4 8 8 8s4-8 8-8" />
        <path d="M4 16c4 0 4-8 8-8s4 8 8 8" opacity="0.45" />
      </svg>
    </span>
  );
}

/* ---------------- SIGN-IN ---------------- */
function SignIn({ onSignIn }) {
  const [busy, setBusy] = useA(false);
  const go = () => { setBusy(true); setTimeout(onSignIn, 950); };
  return (
    <div className="signin">
      <div className="signin__card glass anim-rise">
        <div className="signin__logo"><KnitLogo size={40} /></div>
        <h1 className="signin__name">Knit</h1>
        <p className="signin__sub">The shared editor for every site you publish. Sign in to pick up where you left off.</p>
        <button className={"gbtn focusable" + (busy ? " gbtn--busy" : "")} onClick={go} disabled={busy}>
          {busy ? <span className="spinner spinner--dark" /> : (
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.1z" /><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9h-7.3v5.7C8.1 41.1 15.4 46 24 46z" /><path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.2-2.9.7-4.2v-5.7H4.5C3 17.1 2.1 20.4 2.1 24s.9 6.9 2.4 9.9l7.3-5.7z" /><path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.3 29.9 2 24 2 15.4 2 8.1 6.9 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" /></svg>
          )}
          {busy ? "Signing in…" : "Sign in with Google"}
        </button>
        <p className="signin__legal">Google is the only sign-in method for Knit.</p>
      </div>
      <div className="signin__foot">Knit · platform editor</div>
    </div>
  );
}

/* ---------------- default block factory ---------------- */
function freshBlock(type) {
  const base = { id: uid(), type };
  return {
    richtext: { ...base, heading: "", body: "" },
    projectgrid: { ...base, projects: [] },
    shop: { ...base, items: [] },
    shopnotes: { ...base, body: "" },
    entrylist: { ...base, entries: [] },
    notecards: { ...base, cards: [] },
  }[type];
}

/* ---------------- validation ---------------- */
function validate(site) {
  const errs = [];
  site.pages.forEach((page) => {
    page.blocks.forEach((b) => {
      const loc = `${page.title} · ${BLOCK_TYPES[b.type].name}`;
      if (b.type === "projectgrid")
        (b.projects || []).forEach((p, i) => {
          if (!p.title || !p.title.trim()) errs.push({ where: `${loc} · JM-${String(i + 1).padStart(3, "0")}`, what: "needs a title" });
          if (p.link && !/^https?:\/\//i.test(p.link)) errs.push({ where: `${loc} · ${p.title || "project " + (i + 1)}`, what: "link must start with http://" });
        });
      if (b.type === "shop")
        (b.items || []).forEach((it, i) => {
          if (!it.name || !it.name.trim()) errs.push({ where: `${loc} · item ${i + 1}`, what: "needs a name" });
          if (!it.price || !it.price.trim()) errs.push({ where: `${loc} · ${it.name || "item " + (i + 1)}`, what: "needs a price" });
        });
      if (b.type === "richtext" && !(b.body || "").trim() && !(b.heading || "").trim())
        errs.push({ where: loc, what: "is empty" });
    });
  });
  return errs;
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "density": "regular"
}/*EDITMODE-END*/;

/* ---------------- APP ROOT ---------------- */
function App() {
  const toast = useToast();
  const [t, setTweak] = useTweaks({ ...TWEAK_DEFAULTS, dark: window.matchMedia("(prefers-color-scheme: dark)").matches });

  const [signedIn, setSignedIn] = useA(false);
  const [site, setSite] = useA(seedSite);
  const [published, setPublished] = useA(() => seedSite()); /* what the live site currently shows */
  const [dirty, setDirty] = useA(false);
  const [saving, setSaving] = useA(false);
  const [justAdded, setJustAdded] = useA(null);
  const [previewCollapsed, setPreviewCollapsed] = useA(false);

  /* apply theme + density to <html>; suppress transitions during the swap
     so the theme change is instant (and never freezes mid-transition) */
  useAE(() => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", t.dark ? "dark" : "light");
    const dens = { compact: 0.86, regular: 1, comfy: 1.18 }[t.density] ?? 1;
    root.style.setProperty("--density", String(dens));
    const id = requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
    return () => cancelAnimationFrame(id);
  }, [t.dark, t.density]);

  const activePage = site.pages.find((p) => p.id === site.activePageId) || site.pages[0];

  const setPageBlocks = (blocks) => {
    setSite((s) => ({ ...s, pages: s.pages.map((p) => (p.id === s.activePageId ? { ...p, blocks } : p)) }));
    setDirty(true);
  };

  const selectPage = (id) => setSite((s) => ({ ...s, activePageId: id }));

  const addBlock = (type) => {
    const nb = freshBlock(type);
    setSite((s) => ({ ...s, pages: s.pages.map((p) => (p.id === s.activePageId ? { ...p, blocks: [...p.blocks, nb] } : p)) }));
    setDirty(true);
    setJustAdded(nb.id);
    setTimeout(() => setJustAdded(null), 700);
    toast.info(`${BLOCK_TYPES[type].name} block added`, { duration: 2000 });
  };

  // surface block deletes as light confirmations by diffing counts
  const onBlocksChange = (blocks) => {
    const before = activePage.blocks.length;
    setPageBlocks(blocks);
    if (blocks.length < before) toast.info("Block removed", { duration: 1800, dedupe: "blockrm" });
  };

  const addPage = () => {
    const n = site.pages.length + 1;
    const np = { id: "p_" + Date.now(), title: "New page", navLabel: "page", path: "/page-" + n, works: "", blocks: [] };
    setSite((s) => ({ ...s, pages: [...s.pages, np], activePageId: np.id }));
    setDirty(true);
    toast.info("Page added", { duration: 1800 });
  };

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      const errs = validate(site);
      setSaving(false);
      if (errs.length) {
        toast.error("Couldn’t publish — please fix:", { items: errs.slice(0, 6), dedupe: "save" });
      } else {
        setDirty(false);
        setPublished(JSON.parse(JSON.stringify(site))); /* push edits live → preview updates */
        toast.success("Changes published", { message: "Your live preview is now up to date.", dedupe: "save" });
      }
    }, 1000);
  };

  const signOut = () => { setSignedIn(false); toast.info("Signed out", { duration: 1800 }); };

  if (!signedIn) return <SignIn onSignIn={() => { setSignedIn(true); toast.success("Welcome back, Jack", { duration: 2600 }); }} />;

  return (
    <div className="app">
      <TopBar
        site={site} user={KNIT_USER} dirty={dirty} saving={saving}
        onSave={save} onSignOut={signOut}
        theme={t.dark ? "dark" : "light"} onSetTheme={(m) => setTweak("dark", m === "dark")}
      />
      <PageTabs pages={site.pages} activeId={site.activePageId} onSelect={selectPage} onAdd={addPage} />
      <main className="workspace">
        <BlockEditor page={activePage} onChange={onBlocksChange} onAddBlock={addBlock} justAddedId={justAdded} />
        {!previewCollapsed && <div className="workspace__divider" />}
        <Preview
          site={site} published={published} dirty={dirty}
          collapsed={previewCollapsed} onToggleCollapsed={() => setPreviewCollapsed((c) => !c)}
        />
      </main>

      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)} />
        <TweakRadio label="Density" value={t.density} options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>
    </div>
  );
}

function Root() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </ToastProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
