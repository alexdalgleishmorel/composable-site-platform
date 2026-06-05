/* jmdm — projects / index page
   The homepage. Just the grid, with infinite scroll. Admin-aware. */

function useInfiniteScroll(total, pageSize = 6, initial = null) {
  const [shown, setShown] = React.useState(Math.min(initial ?? pageSize, total));
  const sentinelRef = React.useRef(null);

  React.useEffect(() => {
    setShown(Math.min(initial ?? pageSize, total));
  }, [total, pageSize, initial]);

  React.useEffect(() => {
    if (shown >= total) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setShown((s) => Math.min(s + pageSize, total));
      },
      { rootMargin: "320px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, total, pageSize]);

  return { shown, sentinelRef };
}

window.useInfiniteScroll = useInfiniteScroll;

function IndexPage({ go }) {
  const { adminMode, catalog, addProject, updateProject, deleteProject } = window.useAdmin();
  const items = catalog;
  const { shown, sentinelRef } = useInfiniteScroll(items.length, 6, 9);
  const visible = items.slice(0, shown);

  const nextCat = () => {
    const nums = catalog.map(c => parseInt((c.cat || "").replace(/\D/g, ""), 10) || 0);
    return "JM-" + String(Math.max(0, ...nums) + 1).padStart(3, "0");
  };

  // Create a new project and drop straight into its expanded (detail) view,
  // where every field is inline-editable. No inline draft tile.
  const addNewProject = () => {
    const cat = nextCat();
    const slug = cat.toLowerCase();
    const entry = addProject({ cat, slug, title: "", description: "" });
    const dest = (entry && entry.slug) || slug;
    setTimeout(() => go("/projects/" + dest), 60);
  };

  return (
    <div className="index page-enter">
      <div className="index-label">
        <span>Index of works</span>
        <span className="index-label__sep">·</span>
        <span>2019 — 2024</span>
        <span className="index-label__count">
          {String(shown).padStart(2, "0")} of {items.length}
        </span>
        {adminMode && <span className="index-label__admin">/ admin mode</span>}
      </div>

      <div className={"grid-view " + (adminMode ? "is-admin" : "")} data-density="lg">
        {visible.map((it) => (
          <ProjectTile
            key={it.cat}
            item={it}
            adminMode={adminMode}
            go={go}
            onUpdate={(patch) => updateProject(it.cat, patch)}
            onDelete={() => deleteProject(it.cat)}
          />
        ))}
        {adminMode && (
          <window.AddTile label="add project" onClick={addNewProject} />
        )}
      </div>

      {shown < items.length && (
        <div ref={sentinelRef} className="infinite-sentinel" aria-hidden="true">
          loading more…
        </div>
      )}
    </div>
  );
}

function ProjectTile({ item, adminMode, go, onUpdate, onDelete }) {
  const kind = pickKind(item);
  const onTileClick = (e) => {
    if (adminMode) {
      // In admin mode, only the placeholder image is the gateway to the detail page.
      return;
    }
    go("/projects/" + item.slug);
  };
  return (
    <div className={"tile " + (adminMode ? "tile--editable" : "")} onClick={onTileClick}>
      {adminMode && (
        <>
          <window.DeleteBtn onClick={onDelete} />
          <button className="tile__open" onClick={(e) => { e.stopPropagation(); go("/projects/" + item.slug); }} title="open project">↗</button>
        </>
      )}
      <div className="tile__cat">
        {adminMode ? (
          <window.InlineText admin className="inline-edit--cat" value={item.cat} onChange={(v) => onUpdate({ cat: v })} />
        ) : item.cat}
      </div>
      <div
        className="tile__img-wrap"
        onClick={(e) => { if (adminMode) { e.stopPropagation(); go("/projects/" + item.slug); } }}
        style={adminMode ? { cursor: "pointer" } : undefined}
        title={adminMode ? "open detail to edit photos" : undefined}>
        <Placeholder kind={kind} label={item.type} num={item.year} />
      </div>
      {adminMode ? (
        <>
          <window.InlineText admin className="inline-edit--tile-title" value={item.title} onChange={(v) => onUpdate({ title: v })} placeholder="Title" />
          <window.InlineText admin className="inline-edit--tile-sub" value={item.sub} onChange={(v) => onUpdate({ sub: v })} placeholder="Subtitle" />
        </>
      ) : (
        <>
          <div className="tile__title">{item.title || "(untitled)"}</div>
          <div className="tile__meta">{item.sub || item.discipline || "—"}</div>
        </>
      )}
    </div>
  );
}

window.IndexPage = IndexPage;
window.ProjectTile = ProjectTile;

// ============================================================
// DraftTile — inline create form. Save commits to catalog,
// Cancel discards. No navigation.
// ============================================================
function DraftTile({ draft, onChange, onSave, onCancel, kind = "project" }) {
  return (
    <div className="tile--draft">
      <div className="tile--draft__label">new {kind} · draft</div>

      <div className="tile--draft__field">
        <label>Title</label>
        <input
          className="inline-edit"
          autoFocus
          value={draft.title}
          placeholder="e.g. Quiet Furniture"
          onChange={(e) => onChange({ title: e.target.value })} />
      </div>

      <div className="tile--draft__field">
        <label>Subtitle</label>
        <input
          className="inline-edit"
          value={draft.sub}
          placeholder="e.g. Three plywood objects for small rooms"
          onChange={(e) => onChange({ sub: e.target.value })} />
      </div>

      <div className="tile--draft__field-row">
        <div className="tile--draft__field">
          <label>Year</label>
          <input
            className="inline-edit"
            type="number"
            value={draft.year}
            onChange={(e) => onChange({ year: parseInt(e.target.value, 10) || draft.year })} />
        </div>
        <div className="tile--draft__field">
          <label>Type</label>
          <select
            className="inline-edit"
            value={draft.type}
            onChange={(e) => onChange({ type: e.target.value })}>
            <option value="object">object</option>
            <option value="print">print</option>
            <option value="photo">photo</option>
            <option value="writing">writing</option>
            <option value="project">project</option>
          </select>
        </div>
      </div>

      {kind === "product" && (
        <div className="tile--draft__field">
          <label>Price (CAD)</label>
          <input
            className="inline-edit"
            type="number"
            value={draft.price ?? ""}
            placeholder="0"
            onChange={(e) => onChange({ price: parseFloat(e.target.value) || 0 })} />
        </div>
      )}

      <div className="tile--draft__foot">
        <button className="btn btn--ghost" onClick={onCancel}>cancel</button>
        <button className="btn" onClick={onSave} disabled={!draft.title}>save</button>
      </div>
    </div>
  );
}

window.DraftTile = DraftTile;
