import type {
  EntryListData,
  NoteCardsData,
  Project,
  ProjectGridData,
  RichTextData,
  ShopData,
  ShopNotesData,
} from '@csp/blocks';
import type { RenderComponent, RenderMap } from '@csp/bundle-kit';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { catalogNumber, dollars, Placeholder, pickKind } from './Placeholder';

/** A single index tile — the catalog entry. */
export function ProjectTile({ project, to }: { project: Project; to: string }) {
  return (
    <Link className="tile" to={to}>
      <div className="tile__cat">{catalogNumber(project.order)}</div>
      <div className="tile__img-wrap">
        {project.images[0] ? (
          <img src={project.images[0]} alt={project.title} />
        ) : (
          <Placeholder kind={pickKind(project.id)} label={project.tags?.[0]?.toLowerCase()} />
        )}
      </div>
      <div className="tile__title">{project.title || '(untitled)'}</div>
      <div className="tile__meta">{project.summary ?? project.tags?.join(' / ') ?? '—'}</div>
    </Link>
  );
}

const ProjectGridRender: RenderComponent<ProjectGridData> = ({ data }) => {
  const projects = [...data.projects].sort((a, b) => a.order - b.order);
  return (
    <div className="index">
      <div className="index-label">
        <span>Index of works</span>
        <span className="index-label__sep">·</span>
        <span>2019 — 2024</span>
        <span className="index-label__count">{String(projects.length).padStart(2, '0')} works</span>
      </div>
      <div className="grid-view" data-density="lg">
        {projects.map((project) => (
          <ProjectTile key={project.id} project={project} to={`/projects/${project.id}`} />
        ))}
      </div>
      <div className="infinite-end">end of index</div>
    </div>
  );
};

const ShopNotesRender: RenderComponent<ShopNotesData> = ({ data }) => (
  <div className="shop__note shop__note--top">
    <div />
    {data.notes.map((note, i) => (
      <div key={i}>
        <h4 className="shop__note__h">{note.heading}</h4>
        <p>{note.body}</p>
      </div>
    ))}
    <div />
  </div>
);

const ShopRender: RenderComponent<ShopData> = ({ data }) => {
  // Beta: when the shop is disabled it isn't customer-facing — the wireframe's "coming soon".
  if (!data.enabled) {
    return (
      <div className="shop__empty">
        <div className="shop__empty__inner">
          <div className="shop__empty__label">/ nothing in stock yet /</div>
          <div className="shop__empty__head">coming soon</div>
          <div className="shop__empty__sub">
            Furniture, lighting, and small editions. Made in batches of one, ten, or thirty — never
            more.
          </div>
        </div>
      </div>
    );
  }
  const items = [...data.items].sort((a, b) => a.order - b.order);
  return (
    <div className="grid-view" data-density="lg">
      {items.map((item) => (
        <Link className="tile tile--shop" to={`/shop/${item.id}`} key={item.id}>
          <div className="tile__cat">{catalogNumber(item.order)}</div>
          <div className="tile__img-wrap">
            {item.images[0] ? (
              <img src={item.images[0]} alt={item.name} />
            ) : (
              <Placeholder kind={pickKind(item.id)} label={item.name.toLowerCase()} />
            )}
          </div>
          <div className="tile__title">{item.name}</div>
          <div className="tile__shop">
            <div className="tile__price__num">
              ${dollars(item.priceCents)} <span className="tile__price__cur">{data.currency}</span>
            </div>
            <div className="tile__price__stock">{item.inStock ? 'in stock' : 'sold out'}</div>
          </div>
        </Link>
      ))}
    </div>
  );
};

/** richText, entryList, noteCards also have generic renderers (the bespoke About composes them in a
    grid; these cover any other page that uses the blocks). */
const RichTextRender: RenderComponent<RichTextData> = ({ data }) => (
  <section className="about__body">
    <div />
    <div className="about__col about__bio about__currently">
      {data.heading && <h4 className="about__col__h">{data.heading}</h4>}
      {data.image && <img src={data.image} alt="" style={{ maxWidth: '100%', marginBottom: 16 }} />}
      {data.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
    <div />
  </section>
);

export function CvRows({ entries }: { entries: EntryListData['entries'] }) {
  return (
    <div className="cv">
      {entries.map((e, i) => (
        <Fragment key={i}>
          <div className="cv__year">{e.year}</div>
          <div className="cv__entry">
            <div className="cv__entry__title">{e.title}</div>
            {e.subtitle && <div className="cv__entry__sub">{e.subtitle}</div>}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

const EntryListRender: RenderComponent<EntryListData> = ({ data }) => (
  <section className="about__body">
    <div />
    <div className="about__col about__currently">
      {data.heading && <h4 className="about__col__h">{data.heading}</h4>}
      <CvRows entries={data.entries} />
    </div>
    <div />
  </section>
);

export function CurrentlyCards({ cards }: { cards: NoteCardsData['cards'] }) {
  return (
    <div className="currently-grid">
      {cards.map((c, i) => (
        <div className="currently" key={i}>
          <div className="currently__label">{c.label}</div>
          <div>{c.body}</div>
        </div>
      ))}
    </div>
  );
}

const NoteCardsRender: RenderComponent<NoteCardsData> = ({ data }) => (
  <section className="about__body">
    <div className="about__currently">
      {data.heading && <h4 className="about__col__h">{data.heading}</h4>}
      <CurrentlyCards cards={data.cards} />
    </div>
  </section>
);

/** The bundle's bespoke render map — the presentation plane keyed by block `type` (§2). */
export const renderMap: RenderMap = {
  projectGrid: ProjectGridRender,
  shopNotes: ShopNotesRender,
  shop: ShopRender,
  richText: RichTextRender,
  entryList: EntryListRender,
  noteCards: NoteCardsRender,
};
