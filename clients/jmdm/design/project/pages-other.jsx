/* jmdm — shop / about / rationale pages. Admin-aware, inline-editable. */

// ============================================================
// SHOP
// ============================================================
function ShopPage({ go, cart, addToCart }) {
  const { adminMode, catalog, addProject, updateProject, deleteProject, orders, shopEnabled, setShopEnabled, shopNotes, updateShopNote } = window.useAdmin();
  const items = catalog.filter((i) => i.status === "shop");
  const isEmpty = items.length === 0 && !adminMode;
  const { shown, sentinelRef } = window.useInfiniteScroll(items.length, 3, 6);
  const visible = items.slice(0, shown);

  const nextCat = () => {
    const nums = catalog.map((c) => parseInt((c.cat || "").replace(/\D/g, ""), 10) || 0);
    return "JM-" + String(Math.max(0, ...nums) + 1).padStart(3, "0");
  };

  // Create a new product and open it directly in its expanded (detail) view.
  const addNewProduct = () => {
    const cat = nextCat();
    const slug = cat.toLowerCase();
    const entry = addProject({ cat, slug, title: "", description: "", status: "shop", price: 0 });
    const dest = (entry && entry.slug) || slug;
    setTimeout(() => go("/shop/" + dest), 60);
  };

  return (
    <div className="shop page-enter">
      <div className="shop__note shop__note--top" data-comment-anchor="5ab65b909a-div-106-9">
        <div></div>
        {shopNotes.map((n, i) =>
        <div key={i}>
            {adminMode ?
            <>
                <window.InlineText admin className="shop__note__h inline-edit--note-h"
              value={n.h} onChange={(v) => updateShopNote(i, { h: v })} placeholder="Heading" />
                <window.InlineText admin multiline className="inline-edit--note-body"
              value={n.body} onChange={(v) => updateShopNote(i, { body: v })} placeholder="Body" />
              </> :
            <>
                <h4 className="shop__note__h">{n.h}</h4>
                <p>{n.body}</p>
              </>
            }
          </div>
        )}
        <div></div>
      </div>

      {adminMode &&
      <>
          <div className="visibility-bar">
            <div className="visibility-bar__left">
              <span className="visibility-bar__label">Shop visibility</span>
              <button
              className={"visibility-toggle " + (shopEnabled ? "is-on" : "")}
              onClick={() => setShopEnabled(!shopEnabled)}
              aria-pressed={shopEnabled}>
                <span className="visibility-toggle__knob"></span>
              </button>
              <span className={"visibility-status " + (shopEnabled ? "is-public" : "is-hidden")}>
                {shopEnabled ? "PUBLIC · visible in nav" : "HIDDEN · in beta, admin-only"}
              </span>
            </div>
            <div className="visibility-bar__right">
              {shopEnabled ? "🔓 customers can browse" : "🔒 not yet customer-facing"}
            </div>
          </div>
          <div className="index-label">
            <span>Shop · {items.length} {items.length === 1 ? "product" : "products"}</span>
            <span className="index-label__sep">·</span>
            <span className="index-label__admin">/ admin mode</span>
          </div>
        </>
      }

      {isEmpty ?
      <div className="shop__empty">
          <div className="shop__empty__inner">
            <div className="shop__empty__label">/ nothing in stock yet /</div>
            <div className="shop__empty__head">COMING SOON</div>
            <div className="shop__empty__sub">
              Furniture, lighting, and small editions. Made in batches of one, ten, or thirty — never more.
            </div>
          </div>
        </div> :

      <>
          <div className={"grid-view " + (adminMode ? "is-admin" : "")} data-density="lg">
            {visible.map((it) =>
          <ShopTile
            key={it.cat}
            item={it}
            addToCart={addToCart}
            go={go}
            adminMode={adminMode}
            onUpdate={(patch) => updateProject(it.cat, patch)}
            onDelete={() => deleteProject(it.cat)} />

          )}
            {adminMode &&
          <window.AddTile label="add product" onClick={addNewProduct} />
          }
          </div>
          {shown < items.length &&
        <div ref={sentinelRef} className="infinite-sentinel infinite-sentinel--silent" aria-hidden="true"></div>}
        </>
      }

      {adminMode && <OrdersPanel orders={orders} />}
    </div>);

}

function ShopTile({ item, addToCart, go, adminMode, onUpdate, onDelete }) {
  const [qty, setQty] = React.useState(1);
  const edMatch = item.sub?.match(/ed\. of (\d+)/);
  const onTileClick = (e) => {
    if (adminMode) return;
    go("/shop/" + item.slug);
  };
  return (
    <div className={"tile tile--shop " + (adminMode ? "tile--editable" : "")} onClick={onTileClick}>
      {adminMode &&
      <>
          <window.DeleteBtn onClick={onDelete} />
          <button className="tile__open" onClick={(e) => {e.stopPropagation();go("/shop/" + item.slug);}} title="open product">↗</button>
        </>
      }

      <div
        className="tile__img-wrap"
        onClick={(e) => {if (adminMode) {e.stopPropagation();go("/shop/" + item.slug);}}}
        style={adminMode ? { cursor: "pointer" } : undefined}>
        <Placeholder kind={window.pickKind(item)} label={item.title?.toLowerCase() || ""} />
        {item.photos?.[1] &&
        <div className="tile__img-hover">
            <Placeholder kind={item.photos[1].kind} label={item.title?.toLowerCase() || ""} />
          </div>
        }
      </div>

      {adminMode ?
      <>
          <window.InlineText admin className="inline-edit--tile-title" value={item.title} onChange={(v) => onUpdate({ title: v })} placeholder="Title" />
          <window.InlineText admin className="inline-edit--tile-sub" value={item.sub} onChange={(v) => onUpdate({ sub: v })} placeholder="Subtitle" />
        </> :

      <>
          <div className="tile__title">{item.title || "(untitled)"}</div>
          <div className="tile__meta">{item.sub || item.discipline}</div>
        </>
      }

      <div className="tile__shop">
        <div className="tile__price">
          {adminMode ?
          <div className="tile__price__num">$
              <window.InlineText admin className="inline-edit--price" value={String(item.price ?? "")} onChange={(v) => onUpdate({ price: parseFloat(v) || 0 })} placeholder="0" />
              <span className="tile__price__cur">CAD</span>
            </div> :

          <div className="tile__price__num">${item.price} <span className="tile__price__cur">CAD</span></div>
          }
          <div className="tile__price__stock">in stock{edMatch ? " · ed. " + edMatch[1] : ""}</div>
        </div>
        {!adminMode &&
        <div className="tile__qty">
            <div className="qty">
              <button onClick={(e) => {e.stopPropagation();setQty((q) => Math.max(1, q - 1));}} aria-label="decrease quantity">−</button>
              <span className="qty__val">{qty}</span>
              <button onClick={(e) => {e.stopPropagation();setQty((q) => q + 1);}} aria-label="increase quantity">+</button>
            </div>
            <button className="btn" onClick={(e) => {e.stopPropagation();addToCart(item, qty);}}>add to bag</button>
          </div>
        }
      </div>
    </div>);

}

// ============================================================
// ORDERS — admin only
// ============================================================
function OrdersPanel({ orders }) {
  return (
    <section className="orders">
      <div className="orders__head">
        <h3>Orders</h3>
        <div className="orders__head__meta">{orders.length} recent · last 30 days</div>
      </div>
      <div className="orders__table">
        <div className="orders__row orders__row--head">
          <span>order</span>
          <span>date</span>
          <span>customer</span>
          <span>ship to</span>
          <span className="orders__num">items</span>
          <span className="orders__num">total</span>
          <span>status</span>
        </div>
        {orders.map((o) =>
        <div key={o.id} className="orders__row">
            <span className="orders__id">{o.id}</span>
            <span>{o.date}</span>
            <span>{o.customer}</span>
            <span>{o.ship}</span>
            <span className="orders__num">{o.items}</span>
            <span className="orders__num">${o.total}</span>
            <span className={"orders__status orders__status--" + o.status}>{o.status}</span>
          </div>
        )}
      </div>
      <div className="orders__foot">
        <span>mock data · checkout opens autumn 2026</span>
      </div>
    </section>);

}

// ============================================================
// ABOUT — inline-editable in admin mode
// ============================================================
function AboutPage({ go }) {
  const {
    adminMode, cv, currently,
    updateBio, addBio, deleteBio,
    addCV, updateCV, deleteCV,
    updateCurrently, addCurrently, deleteCurrently,
    contact, updateContact
  } = window.useAdmin();

  return (
    <div className="about page-enter">
      {adminMode &&
      <div className="index-label">
          <span>About · profile</span>
          <span className="index-label__sep">·</span>
          <span className="index-label__admin">/ admin mode</span>
        </div>
      }

      <div className="about__body">
        <div></div>

        {/* BIO */}
        <div className="about__col about__bio">
          <h4 className="about__col__h">background</h4>
          {cv.bio.map((p, i) =>
          adminMode ?
          <div key={i} className="bio-edit">
                <window.DeleteBtn onClick={() => deleteBio(i)} />
                <window.InlineText admin multiline className="admin-input--bio"
            value={p} onChange={(v) => updateBio(i, v)} />
              </div> :

          <p key={i}>{p}</p>

          )}
          {adminMode &&
          <button className="add-row" onClick={addBio}>+ add paragraph</button>
          }
        </div>

        {/* CONTACT */}
        <div className="about__col" data-comment-anchor="35eba7e65b-div-273-9">
          <h4 className="about__col__h">contact</h4>
          <div className="contact-block">
            {adminMode ?
            <>
                <div><b>email</b> <window.InlineText admin className="inline-edit--meta" value={contact.email} onChange={(v) => updateContact({ email: v })} placeholder="email" /></div>
                <div><b>instagram</b> <window.InlineText admin className="inline-edit--meta" value={contact.instagram} onChange={(v) => updateContact({ instagram: v })} placeholder="@handle" /></div>
                <div><b>studio</b> <window.InlineText admin className="inline-edit--meta" value={contact.studio} onChange={(v) => updateContact({ studio: v })} placeholder="location" /></div>
                <div><b>hours</b> <window.InlineText admin className="inline-edit--meta" value={contact.hours} onChange={(v) => updateContact({ hours: v })} placeholder="hours" /></div>
              </> :
            <>
                <div><b>email</b> <a href={"mailto:" + contact.email}>{contact.email}</a></div>
                <div><b>instagram</b> <a href={"https://instagram.com/" + contact.instagram.replace(/^@/, "")} target="_blank" rel="noreferrer">{contact.instagram}</a></div>
                <div><b>studio</b> {contact.studio}</div>
                <div><b>hours</b> {contact.hours}</div>
              </>
            }
          </div>
        </div>

        <div></div>

        <div></div>

        {/* SELECTED WORKS */}
        <div className="about__col">
          <h4 className="about__col__h">
            selected works · 2020 — present
          </h4>
          <div className="cv">
            {cv.selected.map((e, i) =>
            <CVRow key={i} entry={e} adminMode={adminMode}
            onUpdate={(patch) => updateCV("selected", i, patch)}
            onDelete={() => deleteCV("selected", i)} />
            )}
          </div>
          {adminMode &&
          <button className="add-row" onClick={() => addCV("selected", {})}>+ add entry</button>
          }
        </div>

        {/* PRESS */}
        <div className="about__col">
          <h4 className="about__col__h">
            press / writing
          </h4>
          <div className="cv">
            {cv.press.map((e, i) =>
            <CVRow key={i} entry={e} adminMode={adminMode}
            onUpdate={(patch) => updateCV("press", i, patch)}
            onDelete={() => deleteCV("press", i)} />
            )}
          </div>
          {adminMode &&
          <button className="add-row" onClick={() => addCV("press", {})}>+ add entry</button>
          }
        </div>

        <div></div>

        <div></div>

        {/* CURRENTLY */}
        <div style={{ gridColumn: "2 / 4" }}>
          <h4 className="about__col__h" style={{ margin: "40px 0 18px" }}>
            currently
          </h4>
          <div className="currently-grid">
            {currently.map((c, i) =>
            <div key={i} className={adminMode ? "currently currently--edit" : "currently"}>
                {adminMode && <window.DeleteBtn onClick={() => deleteCurrently(i)} />}
                {adminMode ?
              <>
                    <window.InlineText admin className="admin-input--label" value={c.label} onChange={(v) => updateCurrently(i, { label: v })} />
                    <window.InlineText admin multiline className="admin-input--body" value={c.body} onChange={(v) => updateCurrently(i, { body: v })} />
                  </> :

              <>
                    <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--mute)", marginBottom: 4 }}>{c.label}</div>
                    <div>{c.body}</div>
                  </>
              }
              </div>
            )}
            {adminMode &&
            <button className="currently currently--add" onClick={addCurrently}>
                <span style={{ fontSize: 40, fontWeight: 300, lineHeight: 1 }}>+</span>
                <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 6 }}>add</span>
              </button>
            }
          </div>
        </div>

        <div></div>
      </div>
    </div>);

}

function CVRow({ entry, adminMode, onUpdate, onDelete }) {
  if (!adminMode) {
    return (
      <React.Fragment>
        <div className="cv__year">{entry.year}</div>
        <div className="cv__entry">
          <div className="cv__entry__title">{entry.title}</div>
          <div className="cv__entry__sub">{entry.sub}</div>
        </div>
      </React.Fragment>);

  }
  return (
    <React.Fragment>
      <div className="cv__year">
        <window.InlineText admin className="inline-edit--year" value={entry.year} onChange={(v) => onUpdate({ year: v })} />
      </div>
      <div className="cv__entry cv__entry--edit">
        <window.DeleteBtn onClick={onDelete} />
        <window.InlineText admin className="inline-edit--cv-title" value={entry.title} onChange={(v) => onUpdate({ title: v })} placeholder="Title" />
        <window.InlineText admin className="inline-edit--cv-sub" value={entry.sub} onChange={(v) => onUpdate({ sub: v })} placeholder="Subtitle" />
      </div>
    </React.Fragment>);

}

// ============================================================
// RATIONALE
// ============================================================
function RationalePage({ go }) {
  return (
    <div className="rationale page-enter">
      <div>
        <h1 className="rationale__title">DESIGN RATIONALE / JMDM v1</h1>

        <h3>The premise</h3>
        <p>The site is built around one idea: <span className="pull">it is a catalog, not a portfolio</span>. The homepage is a single index of every work — projects, objects, prints, writings, and eventually shop items — sharing one numbering system.</p>

        <h3>Admin mode</h3>
        <p>Toggleable via the Tweaks panel. Every catalog entry, photo, CV row, bio paragraph, and "currently" card is editable in place — no separate CMS, no modals. Click a field, type. Delete with the × in the corner. Add new entries with the dashed "+ add" tile or row. State persists to localStorage.</p>

        <h3>What I chose</h3>
        <ul>
          <li><b>The catalog/index as homepage.</b> A 3-column grid of every work, with infinite scroll.</li>
          <li><b>Lemon as punctuation.</b> The wordmark "jmdm" rests in front of the lemon.</li>
          <li><b>Arial as the only typeface.</b> CAPS for titles, lowercase for everything else.</li>
        </ul>

        <p style={{ marginTop: 30 }}>
          <button className="btn" onClick={() => go("/")}>← back to index</button>
        </p>
      </div>
    </div>);

}

Object.assign(window, { ShopPage, AboutPage, RationalePage, ShopTile, OrdersPanel });