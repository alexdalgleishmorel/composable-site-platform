// blocks.jsx — block types, seed content, BlockCard, per-type forms, BlockEditor.
// Depends (window): Field, TextField, TextArea, NumberField, Toggle, ImageUpload, RepeatableList, IconBtn
const { useState: useStateB } = React;

/* ---------- block type registry ---------- */
const BLOCK_TYPES = {
  richtext:    { name: "Rich text",   glyph: "¶",  blurb: "Heading + paragraphs" },
  projectgrid: { name: "Project grid", glyph: "▦", blurb: "Catalogue of works" },
  shop:        { name: "Shop",        glyph: "$",  blurb: "Items for sale" },
  shopnotes:   { name: "Shop notes",  glyph: "✎",  blurb: "Fine print" },
  entrylist:   { name: "Entry list",  glyph: "≣",  blurb: "CV / timeline" },
  notecards:   { name: "Note cards",  glyph: "❏",  blurb: "Short notes" },
};

let _uid = 100;
const uid = () => "b" + _uid++;

/* ---------- seed site content ---------- */
function seedSite() {
  return {
    name: "jmdm",
    domain: "jmdm.studio",
    activePageId: "p_index",
    pages: [
      {
        id: "p_index", title: "Index of works", navLabel: "projects", path: "/", works: "14 works",
        blocks: [
          { id: uid(), type: "richtext", heading: "", body: "An index of objects made between 2019 and 2024 — furniture, fixtures, and the occasional mistake kept on purpose." },
          {
            id: uid(), type: "projectgrid", projects: [
              { title: "Quiet Furniture", summary: "Three plywood objects for small rooms", body: "A set of three plywood objects designed to occupy small rooms without occupying attention.", images: [], link: "", tags: ["Furniture"] },
              { title: "Hallway Table", summary: "One-off, white oak + bronze", body: "A small table for a hallway, sized for a single object.", images: [], link: "", tags: ["Furniture"] },
            ],
          },
        ],
      },
      {
        id: "p_about", title: "About", navLabel: "about", path: "/about", works: "studio",
        blocks: [
          { id: uid(), type: "richtext", heading: "About", body: "jmdm is a one-person studio working between furniture and fixtures.\n\nWork is made slowly, in small batches, mostly in plywood and oak." },
          { id: uid(), type: "entrylist", entries: [
            { year: "2024", label: "Group show — Objects at Rest" },
            { year: "2022", label: "Residency, Northern Workshops" },
            { year: "2019", label: "Studio founded" },
          ] },
        ],
      },
      {
        id: "p_shop", title: "Shop", navLabel: "shop", path: "/shop", works: "4 available",
        blocks: [
          { id: uid(), type: "shop", items: [
            { name: "Stool No.4", price: "£240", sold: false },
            { name: "Wall hook (pair)", price: "£60", sold: true },
          ] },
          { id: uid(), type: "shopnotes", body: "Made to order. Allow 4–6 weeks. Shipping within the UK only." },
        ],
      },
    ],
  };
}

/* ---------- per-type form bodies ---------- */
function blockSummary(b) {
  if (b.type === "richtext") return b.heading || (b.body || "").slice(0, 40) || "Empty";
  if (b.type === "projectgrid") return (b.projects?.length || 0) + " project" + (b.projects?.length === 1 ? "" : "s");
  if (b.type === "shop") return (b.items?.length || 0) + " item" + (b.items?.length === 1 ? "" : "s");
  if (b.type === "entrylist") return (b.entries?.length || 0) + " entries";
  if (b.type === "notecards") return (b.cards?.length || 0) + " cards";
  if (b.type === "shopnotes") return "Fine print";
  return "";
}

function BlockForm({ block, patch }) {
  const t = block.type;
  const set = (k) => (v) => patch({ [k]: v });

  if (t === "richtext")
    return (
      <div className="form-grid">
        <TextField id={block.id + "h"} label="Heading" hint="optional" value={block.heading} onChange={set("heading")} placeholder="Section heading" />
        <TextArea id={block.id + "b"} label="Body" value={block.body} onChange={set("body")} placeholder="Write a paragraph…" rows={4} />
      </div>
    );

  if (t === "projectgrid")
    return (
      <RepeatableList
        label="Projects" hint="shown as a catalogue"
        items={block.projects || []} onChange={set("projects")}
        addLabel="Add project"
        makeItem={() => ({ title: "", summary: "", body: "", images: [], link: "", tags: [] })}
        rowLabel={(p, i) => "JM-" + String(i + 1).padStart(3, "0")}
        renderRow={(p, upd) => {
          const f = (k) => (v) => upd({ ...p, [k]: v });
          return (
            <div className="form-grid">
              <TextField label="Title" value={p.title} onChange={f("title")} placeholder="Project title" />
              <TextField label="Summary" value={p.summary} onChange={f("summary")} placeholder="One line" />
              <TextArea label="Body" value={p.body} onChange={f("body")} placeholder="Describe the work…" rows={2} />
              <RepeatableList
                label="Images" hint="drag-drop or browse"
                items={p.images || []} onChange={f("images")} addLabel="Add image"
                makeItem={() => ""}
                renderRow={(img, updImg) => (
                  <ImageUpload value={img} onChange={(url) => updImg(url)} />
                )}
              />
              <TextField label="External link" value={p.link} onChange={f("link")} placeholder="https://…" mono />
              <RepeatableList
                label="Tags" items={p.tags || []} onChange={f("tags")} addLabel="Add tag"
                makeItem={() => ""}
                renderRow={(tag, updTag) => (
                  <TextField value={tag} onChange={updTag} placeholder="Tag" />
                )}
              />
            </div>
          );
        }}
      />
    );

  if (t === "shop")
    return (
      <RepeatableList
        label="Items" items={block.items || []} onChange={set("items")} addLabel="Add item"
        makeItem={() => ({ name: "", price: "", sold: false })}
        renderRow={(it, upd) => {
          const f = (k) => (v) => upd({ ...it, [k]: v });
          return (
            <div className="form-grid">
              <TextField label="Name" value={it.name} onChange={f("name")} placeholder="Item name" />
              <div className="form-row">
                <TextField label="Price" value={it.price} onChange={f("price")} placeholder="£0" />
                <Toggle label="Sold out" value={it.sold} onChange={f("sold")} />
              </div>
            </div>
          );
        }}
      />
    );

  if (t === "shopnotes")
    return (
      <div className="form-grid">
        <TextArea label="Notes" value={block.body} onChange={set("body")} placeholder="Lead time, shipping, returns…" rows={3} />
      </div>
    );

  if (t === "entrylist")
    return (
      <RepeatableList
        label="Entries" hint="CV / timeline" items={block.entries || []} onChange={set("entries")} addLabel="Add entry"
        makeItem={() => ({ year: "", label: "" })}
        renderRow={(e, upd) => {
          const f = (k) => (v) => upd({ ...e, [k]: v });
          return (
            <div className="form-row form-row--year">
              <NumberField label="Year" value={e.year} onChange={f("year")} min={1900} max={2100} step={1} />
              <TextField label="Entry" value={e.label} onChange={f("label")} placeholder="What happened" />
            </div>
          );
        }}
      />
    );

  if (t === "notecards")
    return (
      <RepeatableList
        label="Cards" items={block.cards || []} onChange={set("cards")} addLabel="Add card"
        makeItem={() => ({ title: "", text: "" })}
        renderRow={(c, upd) => {
          const f = (k) => (v) => upd({ ...c, [k]: v });
          return (
            <div className="form-grid">
              <TextField label="Title" value={c.title} onChange={f("title")} placeholder="Card title" />
              <TextArea label="Text" value={c.text} onChange={f("text")} rows={2} placeholder="Short note" />
            </div>
          );
        }}
      />
    );

  return null;
}

/* ---------- block card shell ---------- */
function BlockCard({ block, index, onDelete, patch, anim, isOver, isDragging, onGripDragStart, onGripDragEnd, onCardDragOver, onCardDrop }) {
  const [open, setOpen] = useStateB(true);
  const meta = BLOCK_TYPES[block.type];
  const Ic = window.FieldIcons;

  return (
    <section
      className={"blockcard" + (anim ? " anim-rise" : "") + (isOver ? " blockcard--over" : "") + (isDragging ? " blockcard--dragging" : "")}
      data-screen-label={"Block: " + meta.name}
      onDragOver={onCardDragOver}
      onDrop={onCardDrop}
    >
      <header className="blockcard__head">
        <div className="blockcard__grip focusable" draggable onDragStart={onGripDragStart} onDragEnd={onGripDragEnd} title="Drag to reorder" aria-label="Drag to reorder block">
          {Ic.grip}
        </div>
        <button className="blockcard__disclose focusable" onClick={() => setOpen((o) => !o)} aria-expanded={open} title={open ? "Collapse" : "Expand"}>
          <span className={"blockcard__chev" + (open ? " is-open" : "")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </span>
          <span className="blockcard__glyph" aria-hidden="true">{meta.glyph}</span>
          <span className="blockcard__titles">
            <span className="blockcard__type">{meta.name}</span>
            <span className="blockcard__sub">{blockSummary(block)}</span>
          </span>
        </button>
        <div className="blockcard__tools">
          <IconBtn title="Delete block" danger onClick={onDelete}>{Ic.x}</IconBtn>
        </div>
      </header>
      <div className={"blockcard__bodywrap" + (open ? " is-open" : "")}>
        <div className="blockcard__body">
          <BlockForm block={block} patch={patch} />
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { BLOCK_TYPES, seedSite, BlockForm, BlockCard, blockSummary, uid });
