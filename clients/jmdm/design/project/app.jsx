/* jmdm — app router. Wraps everything in AdminProvider and
   exposes a single Tweaks toggle: Admin mode. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "adminMode": false
}/*EDITMODE-END*/;

function AppShell() {
  return (
    <window.AdminProvider>
      <App />
    </window.AdminProvider>
  );
}

function App() {
  const [route, setRoute] = React.useState(window.location.hash.slice(1) || "/");
  const [cart, setCart] = React.useState([]);
  const [bagOpen, setBagOpen] = React.useState(false);
  const { adminMode, setAdminMode, resetAll, shopEnabled } = window.useAdmin();

  // Tweak state — drives admin mode
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => { setAdminMode(!!tweaks.adminMode); }, [tweaks.adminMode]);

  React.useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash.slice(1) || "/");
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (r) => { window.location.hash = r; };

  const addToCart = (item, qty) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.item.cat === item.cat);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { item, qty }];
    });
  };

  const removeFromCart = (i) => {
    setCart(prev => prev.filter((_, idx) => idx !== i));
  };

  let page = null;
  const shopVisible = adminMode || shopEnabled;
  if (route === "/" || route === "/projects") {
    page = <IndexPage go={go} />;
  } else if (route.startsWith("/projects/")) {
    const slug = route.replace("/projects/", "");
    page = <ProjectDetail slug={slug} go={go} />;
  } else if (route.startsWith("/shop/")) {
    // Individual product detail page
    if (!shopVisible) {
      page = <IndexPage go={go} />;
      setTimeout(() => { if (window.location.hash.startsWith("#/shop")) window.location.hash = "/"; }, 0);
    } else {
      const slug = route.replace("/shop/", "");
      page = <ProductDetail slug={slug} go={go} addToCart={addToCart} />;
    }
  } else if (route === "/shop") {
    if (!shopVisible) {
      page = <IndexPage go={go} />;
      setTimeout(() => { if (window.location.hash === "#/shop") window.location.hash = "/"; }, 0);
    } else {
      page = <ShopPage go={go} cart={cart} addToCart={addToCart} />;
    }
  } else if (route === "/about") {
    page = <AboutPage go={go} />;
  } else if (route === "/rationale") {
    page = <RationalePage go={go} />;
  } else {
    page = <IndexPage go={go} />;
  }

  return (
    <div className={"app " + (adminMode ? "is-admin" : "")}>
      <Masthead route={route} go={go} />
      <main className="frame-main" key={route}>
        {page}
      </main>
      <Foot go={go} />
      {(route === "/shop" || route.startsWith("/shop/")) && shopVisible && (
        <FloatingBag
          cart={cart}
          removeFromCart={removeFromCart}
          open={bagOpen}
          setOpen={setBagOpen}
        />
      )}

      {/* Tweaks panel — single admin toggle */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Admin" />
        <window.TweakToggle
          label="Admin mode"
          help="When on, enables in-place editing of projects, shop, and about."
          value={!!tweaks.adminMode}
          onChange={(v) => setTweak('adminMode', v)} />
        <window.TweakButton
          label="Reset all edits"
          onClick={resetAll}>
          reset to defaults
        </window.TweakButton>
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppShell />);
