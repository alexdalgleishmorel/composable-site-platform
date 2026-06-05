/* jmdm — Admin layer (inline editing version)
   ----------------------------------------------------------
   Tweaks panel exposes one toggle: Admin mode. When on,
   every editable surface (titles, descriptions, photos, CV
   entries, bio, currently) grows in-place edit affordances.

   No modals — all edits happen inline on the page.          */

const { createContext, useContext } = React;

const AdminContext = createContext(null);
const STORAGE_KEY = "jmdm-admin-state-v2";

const MOCK_ORDERS = [
  { id: "ORD-0114", date: "2026-05-22", customer: "Helene W.",     items: 2, total: 308,  status: "paid",     ship: "Toronto, ON" },
  { id: "ORD-0113", date: "2026-05-19", customer: "Marc-André R.", items: 1, total: 1850, status: "shipped",  ship: "Montréal, QC" },
  { id: "ORD-0112", date: "2026-05-16", customer: "Sarah K.",      items: 3, total: 162,  status: "shipped",  ship: "Halifax, NS" },
  { id: "ORD-0111", date: "2026-05-12", customer: "Tomás L.",      items: 1, total: 320,  status: "paid",     ship: "Vancouver, BC" },
  { id: "ORD-0110", date: "2026-05-09", customer: "Jia P.",        items: 2, total: 96,   status: "refunded", ship: "Toronto, ON" },
];

const PH_KINDS = ["stripe", "dot", "cross", "solid", "lemon"];

function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch (_) {}
  return null;
}
function persistState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
}

function AdminProvider({ children }) {
  const [adminMode, setAdminMode] = React.useState(false);
  const seed = React.useMemo(() => {
    const p = loadState();
    return {
      catalog:   p?.catalog   ?? window.CATALOG,
      cv:        p?.cv        ?? window.CV,
      currently: p?.currently ?? window.CURRENTLY,
      shopNotes: p?.shopNotes ?? window.SHOPNOTES,
      contact:   p?.contact   ?? window.CONTACT,
      shopEnabled: p?.shopEnabled ?? true,    // enabled by default in this prototype
    };
  }, []);
  const [catalog,   setCatalog]   = React.useState(seed.catalog);
  const [cv,        setCV]        = React.useState(seed.cv);
  const [currently, setCurrently] = React.useState(seed.currently);
  const [shopNotes, setShopNotes] = React.useState(seed.shopNotes);
  const [contact,   setContact]   = React.useState(seed.contact);
  const [shopEnabled, setShopEnabled] = React.useState(seed.shopEnabled);

  React.useEffect(() => {
    persistState({ catalog, cv, currently, shopNotes, contact, shopEnabled });
  }, [catalog, cv, currently, shopNotes, contact, shopEnabled]);

  // ---------- catalog ----------
  const nextCat = () => {
    const nums = catalog.map(c => parseInt((c.cat || "").replace(/\D/g, ""), 10) || 0);
    return "JM-" + String(Math.max(0, ...nums) + 1).padStart(3, "0");
  };

  const addProject = (payload = {}) => {
    const cat = payload.cat || nextCat();
    const status = payload.status || "archive";
    const entry = {
      cat,
      slug: payload.slug || cat.toLowerCase(),
      title: "Untitled work",
      sub: "",
      year: new Date().getFullYear(),
      type: "object",
      status,
      price: status === "shop" ? 0 : undefined,
      discipline: "",
      description: "Click to write a description.",
      photos: [{ kind: "stripe", label: "new", num: "01.jpg" }],
      ...payload,
    };
    setCatalog(prev => [entry, ...prev]);
    return entry;
  };

  const updateProject = (cat, patch) => {
    setCatalog(prev => prev.map(p => p.cat === cat ? { ...p, ...patch } : p));
  };

  const deleteProject = (cat) => {
    setCatalog(prev => prev.filter(p => p.cat !== cat));
  };

  // photos for one project
  const addPhoto = (cat) => {
    setCatalog(prev => prev.map(p => {
      if (p.cat !== cat) return p;
      const i = (p.photos || []).length;
      const kind = PH_KINDS[i % PH_KINDS.length];
      return { ...p, photos: [...(p.photos || []), { kind, label: "photo " + String(i + 1).padStart(2, "0"), num: String(i + 1).padStart(2, "0") + ".jpg" }] };
    }));
  };
  const updatePhoto = (cat, index, patch) => {
    setCatalog(prev => prev.map(p => p.cat === cat ? { ...p, photos: p.photos.map((ph, i) => i === index ? { ...ph, ...patch } : ph) } : p));
  };
  const deletePhoto = (cat, index) => {
    setCatalog(prev => prev.map(p => p.cat === cat ? { ...p, photos: p.photos.filter((_, i) => i !== index) } : p));
  };

  // ---------- cv ----------
  const addCV = (which, entry) => setCV(prev => ({ ...prev, [which]: [{ year: "", title: "New entry", sub: "", ...entry }, ...prev[which]] }));
  const updateCV = (which, i, patch) => setCV(prev => ({ ...prev, [which]: prev[which].map((e, ix) => ix === i ? { ...e, ...patch } : e) }));
  const deleteCV = (which, i) => setCV(prev => ({ ...prev, [which]: prev[which].filter((_, ix) => ix !== i) }));

  const updateBio = (i, text) => setCV(prev => ({ ...prev, bio: prev.bio.map((p, ix) => ix === i ? text : p) }));
  const addBio = () => setCV(prev => ({ ...prev, bio: [...prev.bio, "New paragraph."] }));
  const deleteBio = (i) => setCV(prev => ({ ...prev, bio: prev.bio.filter((_, ix) => ix !== i) }));

  // ---------- currently ----------
  const updateCurrently = (i, patch) => setCurrently(prev => prev.map((c, ix) => ix === i ? { ...c, ...patch } : c));
  const addCurrently = () => setCurrently(prev => [...prev, { label: "new", body: "Something Jack is doing right now." }]);
  const deleteCurrently = (i) => setCurrently(prev => prev.filter((_, ix) => ix !== i));

  // ---------- shop notes (Shipping / Note from the studio) ----------
  const updateShopNote = (i, patch) => setShopNotes(prev => prev.map((n, ix) => ix === i ? { ...n, ...patch } : n));

  // ---------- contact (shared by About + footer) ----------
  const updateContact = (patch) => setContact(prev => ({ ...prev, ...patch }));

  const resetAll = () => {
    if (!confirm("Reset all admin edits back to defaults?")) return;
    setCatalog(window.CATALOG);
    setCV(window.CV);
    setCurrently(window.CURRENTLY);
    setShopNotes(window.SHOPNOTES);
    setContact(window.CONTACT);
    setShopEnabled(true);
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  };

  const value = {
    adminMode, setAdminMode,
    catalog, addProject, updateProject, deleteProject,
    addPhoto, updatePhoto, deletePhoto,
    cv, addCV, updateCV, deleteCV,
    updateBio, addBio, deleteBio,
    currently, updateCurrently, addCurrently, deleteCurrently,
    shopNotes, updateShopNote,
    contact, updateContact,
    shopEnabled, setShopEnabled,
    orders: MOCK_ORDERS,
    resetAll,
  };
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}

// ============================================================
// InlineText — a span that becomes a single-line input when clicked
// in admin mode. Plain <span> when adminMode is off.
// ============================================================
function InlineText({ value, onChange, placeholder = "—", as = "span", className = "", admin, multiline = false, ...rest }) {
  const ref = React.useRef(null);

  if (!admin) {
    return React.createElement(as, { className, ...rest }, value || placeholder);
  }

  if (multiline) {
    return (
      <textarea
        ref={ref}
        className={"inline-edit inline-edit--multi " + className}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      />
    );
  }
  return (
    <input
      ref={ref}
      className={"inline-edit " + className}
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      {...rest}
    />
  );
}

// ============================================================
// DeleteBtn — small × in the corner
// ============================================================
function DeleteBtn({ onClick, label = "delete", className = "" }) {
  return (
    <button
      className={"del-btn " + className}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClick && onClick(); }}
      aria-label={label}
      title={label}>
      ×
    </button>
  );
}

// ============================================================
// AddTile — the "+ add" placeholder
// ============================================================
function AddTile({ label, onClick, className = "" }) {
  return (
    <button className={"tile tile--add " + className} onClick={onClick}>
      <span className="tile--add__plus" aria-hidden="true">+</span>
      <span className="tile--add__label">{label}</span>
    </button>
  );
}

Object.assign(window, {
  AdminContext, AdminProvider, useAdmin,
  InlineText, DeleteBtn, AddTile,
  MOCK_ORDERS, PH_KINDS,
});
