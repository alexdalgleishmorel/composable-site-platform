import type {
  EntryListData,
  NoteCardsData,
  ProjectGridData,
  RichTextData,
  ShopData,
  ShopNotesData,
} from '@csp/blocks';
import type { RenderComponent, RenderMap } from '@csp/bundle-kit';
import { Link } from 'react-router-dom';

/** A striped placeholder standing in for imagery until S3 migration lands (#23). */
export function Placeholder({ label, lemon }: { label?: string; lemon?: boolean }) {
  return <div className={lemon ? 'ph ph--lemon' : 'ph'}>{label}</div>;
}

export function formatPrice(cents: number, currency: string): string {
  return `$${(cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 0 })} ${currency}`;
}

const RichTextRender: RenderComponent<RichTextData> = ({ data }) => (
  <section className="block prose">
    {data.heading && <h2 className="block__h">{data.heading}</h2>}
    {data.image && <img src={data.image} alt="" style={{ maxWidth: '100%', marginBottom: 16 }} />}
    {data.paragraphs.map((p, i) => (
      <p key={i}>{p}</p>
    ))}
  </section>
);

const ProjectGridRender: RenderComponent<ProjectGridData> = ({ data }) => {
  const projects = [...data.projects].sort((a, b) => a.order - b.order);
  return (
    <section className="block">
      <div className="index-label">
        <span>index of works</span>
        <span>·</span>
        <span>2020 — 2024</span>
        <span className="count">{String(projects.length).padStart(2, '0')} works</span>
      </div>
      <div className="grid">
        {projects.map((project) => (
          <Link className="tile" to={`/projects/${project.id}`} key={project.id}>
            <Placeholder
              label={project.tags?.[0]?.toLowerCase()}
              lemon={project.id === 'lemon-bowl'}
            />
            <div className="tile__title">{project.title || '(untitled)'}</div>
            <div className="tile__meta">{project.summary ?? project.tags?.join(' / ') ?? '—'}</div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const EntryListRender: RenderComponent<EntryListData> = ({ data }) => (
  <section className="block">
    {data.heading && <h2 className="block__h">{data.heading}</h2>}
    <div>
      {data.entries.map((entry, i) => (
        <div className="cv__row" key={i}>
          <div className="cv__year">{entry.year}</div>
          <div>
            <div className="cv__title">{entry.title}</div>
            {entry.subtitle && <div className="cv__sub">{entry.subtitle}</div>}
          </div>
        </div>
      ))}
    </div>
  </section>
);

const NoteCardsRender: RenderComponent<NoteCardsData> = ({ data }) => (
  <section className="block">
    {data.heading && <h2 className="block__h">{data.heading}</h2>}
    <div className="cards">
      {data.cards.map((card, i) => (
        <div key={i}>
          <div className="card__label">{card.label}</div>
          <div>{card.body}</div>
        </div>
      ))}
    </div>
  </section>
);

const ShopNotesRender: RenderComponent<ShopNotesData> = ({ data }) => (
  <div className="shop__note">
    {data.notes.map((note, i) => (
      <div key={i}>
        <h4 className="block__h">{note.heading}</h4>
        <p>{note.body}</p>
      </div>
    ))}
  </div>
);

const ShopRender: RenderComponent<ShopData> = ({ data }) => {
  // Beta: when the shop is disabled it isn't customer-facing — show the wireframe's "coming soon".
  if (!data.enabled) {
    return (
      <section className="block coming-soon">
        <div className="beta">beta</div>
        <div className="coming-soon__big">coming soon</div>
        <p>
          Furniture, lighting, and small editions. Made in batches of one, ten, or thirty — never
          more.
        </p>
      </section>
    );
  }
  const items = [...data.items].sort((a, b) => a.order - b.order);
  return (
    <section className="block">
      <div className="grid">
        {items.map((item) => (
          <Link className="tile" to={`/shop/${item.id}`} key={item.id}>
            <Placeholder label={item.name.toLowerCase()} />
            <div className="tile__title">{item.name}</div>
            <div className="price">
              {formatPrice(item.priceCents, data.currency)}{' '}
              <span className="cur">· {item.inStock ? 'in stock' : 'sold out'}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

/** The bundle's bespoke render map — the presentation plane keyed by block `type` (§2). */
export const renderMap: RenderMap = {
  richText: RichTextRender,
  projectGrid: ProjectGridRender,
  entryList: EntryListRender,
  noteCards: NoteCardsRender,
  shopNotes: ShopNotesRender,
  shop: ShopRender,
};
