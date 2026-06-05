/* jmdm — shop product detail page.
   A full-screen commerce-focused view of a shop item.
   Independent of /projects/{slug} — those are an OPTIONAL "related project" link. */

function ProductDetail({ slug, go, addToCart }) {
  const { adminMode, catalog, updateProject, deleteProject, addPhoto, updatePhoto, deletePhoto, shopEnabled, setShopEnabled } = window.useAdmin();
  const idx = catalog.findIndex((p) => p.slug === slug && p.status === "shop");
  const item = idx >= 0 ? catalog[idx] : null;
  const [qty, setQty] = React.useState(1);
  const [zoom, setZoom] = React.useState(null);
  const [activeIdx, setActiveIdx] = React.useState(0);

  if (!item) {
    return (
      <div className="page-enter" style={{ padding: "60px 32px", textAlign: "center" }}>
        <h2 style={{ fontSize: 48, textTransform: "uppercase" }}>Product not found.</h2>
        <button className="btn" onClick={() => go("/shop")}>← back to shop</button>
      </div>
    );
  }

  const set = (patch) => updateProject(item.cat, patch);
  const shopProducts = catalog.filter((p) => p.status === "shop");
  const productIdx = shopProducts.findIndex(p => p.cat === item.cat);
  const prev = shopProducts[(productIdx + shopProducts.length - 1) % shopProducts.length];
  const next = shopProducts[(productIdx + 1) % shopProducts.length];

  const edMatch = item.sub?.match(/ed\. of (\d+)/);

  const photos = item.photos || [];
  const fallbackPhoto = { kind: pickKind(item), label: item.title.toLowerCase(), num: "01.jpg" };
  const activePhoto = adminMode ? (photos[0] || fallbackPhoto) : (photos[activeIdx] || photos[0] || fallbackPhoto);

  return (
    <div className="product page-enter">
      {/* hero header */}
      <header className="product__head">
        <div className="product__head__left">
          <h1 className="product__title">
            {adminMode ? (
              <window.InlineText admin className="inline-edit--title"
                value={item.title} onChange={(v) => set({ title: v })} placeholder="Product title" />
            ) : (
              <span>{item.title}</span>
            )}
          </h1>
          {adminMode ? (
            <window.InlineText admin className="inline-edit--sub product__sub"
              value={item.sub} onChange={(v) => set({ sub: v })} placeholder="Subtitle" />
          ) : (
            item.sub && <div className="product__sub">{item.sub}</div>
          )}
        </div>
        <div className="product__head__right">
          {adminMode && (
            <button className="product__delete" onClick={() => {
              if (confirm("Delete “" + (item.title || item.cat) + "”? This can't be undone.")) {
                deleteProject(item.cat);
                go("/shop");
              }
            }} aria-label="delete product">× delete</button>
          )}
          <button className="product__close" onClick={() => go("/shop")} aria-label="close">× close</button>
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
          {/* PRICE */}
          <div className="product__price">
            <span className="product__price__num">$
              {adminMode ? (
                <window.InlineText admin className="inline-edit--price"
                  value={String(item.price ?? "")} onChange={(v) => set({ price: parseFloat(v) || 0 })} />
              ) : (item.price ?? "—")}
            </span>
            <span className="product__price__cur">CAD</span>
          </div>
          <div className="product__stock">
            <span className="product__stock__dot"></span>
            in stock{edMatch ? " · ed. " + edMatch[1] : ""}
          </div>

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
                placeholder="Write a description of this product."
                onChange={(v) => set({ description: v })} />
            ) : (
              <p className="product__desc">{item.description}</p>
            )}
          </div>

          {/* RELATED PROJECT — intentionally omitted: shop items and
              projects are fully decoupled, no cross-linking. */}

          {/* ADD TO BAG */}
          {!adminMode && (
            <div className="product__buy">
              <div className="qty product__qty">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="decrease quantity">−</button>
                <span className="qty__val">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} aria-label="increase quantity">+</button>
              </div>
              <button className="btn product__add-btn" onClick={() => addToCart(item, qty)}>
                add {qty > 1 ? `${qty} ` : ""}to bag
              </button>
            </div>
          )}

          {!adminMode && (
            <div className="product__ship-note">
              Ships from the studio in Toronto. {item.type === "object" ? "Furniture dispatched within four weeks." : "Smaller editions ship within seven days."}
            </div>
          )}
        </section>
      </div>

      {/* prev / next navigation removed */}

      <window.Lightbox photo={zoom} onClose={() => setZoom(null)} />
    </div>
  );
}

window.ProductDetail = ProductDetail;
