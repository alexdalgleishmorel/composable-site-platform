/* jmdm — project detail page.
   Mirrors the shop product detail layout EXACTLY (same .product__* shell:
   hero header + two-column body with an image column and an info column),
   minus the commerce-only blocks (price / stock / add-to-bag). */

function ProjectDetail({ slug, go }) {
  const { adminMode, catalog, updateProject, deleteProject, addPhoto, updatePhoto, deletePhoto } = window.useAdmin();
  const idx = catalog.findIndex((p) => p.slug === slug);
  const item = idx >= 0 ? catalog[idx] : null;

  if (!item) {
    return (
      <div className="page-enter" style={{ padding: "60px 32px", textAlign: "center" }}>
        <h2 style={{ fontSize: 48, textTransform: "uppercase" }}>Not found.</h2>
        <button className="btn" onClick={() => go("/")}>← back to index</button>
      </div>
    );
  }

  const prev = catalog[(idx + catalog.length - 1) % catalog.length];
  const next = catalog[(idx + 1) % catalog.length];

  const set = (patch) => updateProject(item.cat, patch);
  const [zoom, setZoom] = React.useState(null);
  const [activeIdx, setActiveIdx] = React.useState(0);

  const photos = item.photos || [];
  const fallbackPhoto = { kind: window.pickKind(item), label: item.title.toLowerCase(), num: "01.jpg" };
  const activePhoto = adminMode ? (photos[0] || fallbackPhoto) : (photos[activeIdx] || photos[0] || fallbackPhoto);

  return (
    <div className="product page-enter">
      {/* hero header */}
      <header className="product__head">
        <div className="product__head__left">
          <h1 className="product__title">
            {adminMode ? (
              <window.InlineText admin className="inline-edit--title"
                value={item.title} onChange={(v) => set({ title: v })} placeholder="Project title" />
            ) : (
              <span>{item.title}</span>
            )}
          </h1>
          {adminMode ? (
            <window.InlineText admin className="inline-edit--sub product__sub"
              value={item.cat} onChange={(v) => set({ cat: v })} placeholder="JM-000" />
          ) : (
            item.cat && <div className="product__sub">{item.cat}</div>
          )}
        </div>
        <div className="product__head__right">
          {adminMode && (
            <button className="product__delete" onClick={() => {
              if (confirm("Delete “" + (item.title || item.cat) + "”? This can't be undone.")) {
                deleteProject(item.cat);
                go("/");
              }
            }} aria-label="delete project">× delete</button>
          )}
          <button className="product__close" onClick={() => go("/")} aria-label="close">× close</button>
        </div>
      </header>

      <div className="product__body">
        {/* IMAGE COLUMN */}
        <section className="product__images">
          <div className="product__image-main" onClick={() => setZoom(activePhoto)}>
            <Placeholder kind={activePhoto.kind} label={activePhoto.label} num={activePhoto.num} />
          </div>
          {/* public gallery: click a thumb to make it the main image */}
          {!adminMode && photos.length > 1 && (
            <div className="product__image-thumbs">
              {photos.map((ph, i) => (
                <div key={i} className={"product__image-thumb" + (i === activeIdx ? " is-active" : "")} onClick={() => setActiveIdx(i)}>
                  <Placeholder kind={ph.kind} label={ph.label} num={ph.num} />
                </div>
              ))}
            </div>
          )}
          {/* admin: edit photos (main = photo 01, rest are thumbs) */}
          {adminMode && photos.slice(1).length > 0 && (
            <div className="product__image-thumbs">
              {photos.slice(1).map((ph, i) => (
                <div key={i} className="product__image-thumb">
                  <Placeholder kind={ph.kind} label={ph.label} num={ph.num} />
                  <window.DeleteBtn onClick={() => deletePhoto(item.cat, i + 1)} />
                </div>
              ))}
              <button className="product__image-add" onClick={() => addPhoto(item.cat)} aria-label="add photo">
                <span style={{ fontSize: 32, lineHeight: 0.8, fontWeight: 300 }}>+</span>
              </button>
            </div>
          )}
          {adminMode && photos.length <= 1 && (
            <div className="product__image-thumbs">
              <button className="product__image-add" onClick={() => addPhoto(item.cat)} aria-label="add photo">
                <span style={{ fontSize: 32, lineHeight: 0.8, fontWeight: 300 }}>+</span>
                <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>add photo</span>
              </button>
            </div>
          )}
        </section>

        {/* INFO COLUMN */}
        <section className="product__info">
          {/* DETAILS */}
          <div className="product__section">
            <h3 className="product__section__h">Details</h3>
            <dl className="product__details">
              <dt>year</dt>
              <dd>{adminMode ?
                <window.InlineText admin className="inline-edit--meta" value={String(item.year || "")} onChange={(v) => set({ year: parseInt(v, 10) || v })} />
                : item.year}</dd>

              <dt>type</dt>
              <dd>{adminMode ? (
                <select className="inline-edit inline-edit--meta" value={item.type} onChange={(e) => set({ type: e.target.value })}>
                  <option value="installation">installation</option>
                  <option value="furniture">furniture</option>
                  <option value="object">object</option>
                  <option value="lighting">lighting</option>
                  <option value="interior design">interior design</option>
                  <option value="architecture">architecture</option>
                </select>
              ) : item.type}</dd>

              <dt>medium</dt>
              <dd>{adminMode ?
                <window.InlineText admin className="inline-edit--meta" value={item.discipline || ""} onChange={(v) => set({ discipline: v })} placeholder="Furniture / Wood" />
                : (item.discipline || "—")}</dd>
            </dl>
          </div>

          {/* DESCRIPTION */}
          <div className="product__section">
            <h3 className="product__section__h">Description</h3>
            {adminMode ? (
              <window.InlineText admin multiline className="product__desc inline-edit--multi"
                value={item.description}
                placeholder="Write a description of this project."
                onChange={(v) => set({ description: v })} />
            ) : (
              <p className="product__desc">{item.description}</p>
            )}
          </div>
        </section>
      </div>

      <window.Lightbox photo={zoom} onClose={() => setZoom(null)} />
    </div>
  );
}

window.ProjectDetail = ProjectDetail;
