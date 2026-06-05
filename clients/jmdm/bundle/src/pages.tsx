import type { ProjectGridData, ShopData } from '@csp/blocks';
import { PageRenderer, findPage } from '@csp/bundle-kit';
import { Link, useParams } from 'react-router-dom';
import { useSiteContent } from './content-context';
import { Placeholder, formatPrice, renderMap } from './renderers';

/** Render a page by slug through the shared BlockRenderer (the §7 contract). */
function PageBySlug({ slug }: { slug: string }) {
  const content = useSiteContent();
  const page = findPage(content, slug);
  if (!page) return <NotFound />;
  return <PageRenderer renderers={renderMap} page={page} />;
}

export const Home = () => <PageBySlug slug="/" />;
export const About = () => <PageBySlug slug="/about" />;
export const Shop = () => <PageBySlug slug="/shop" />;

function useProjects(): ProjectGridData['projects'] {
  const content = useSiteContent();
  const block = findPage(content, '/')?.blocks.find((b) => b.type === 'projectGrid');
  return (block?.data as ProjectGridData | undefined)?.projects ?? [];
}

export function ProjectDetail() {
  const { slug } = useParams();
  const project = useProjects().find((p) => p.id === slug);
  if (!project) return <NotFound />;
  return (
    <article className="detail">
      <Link className="detail__back" to="/">
        ← index
      </Link>
      <h1 className="detail__title">{project.title || '(untitled)'}</h1>
      {project.tags && <div className="detail__tags">{project.tags.join(' / ')}</div>}
      {project.images.length > 0 ? (
        project.images.map((src) => <img key={src} src={src} alt="" style={{ maxWidth: '100%' }} />)
      ) : (
        <Placeholder label={project.tags?.[0]?.toLowerCase()} />
      )}
      {project.body && (
        <p className="prose" style={{ marginTop: 18 }}>
          {project.body}
        </p>
      )}
      {project.link && (
        <p>
          <a href={project.link} target="_blank" rel="noreferrer">
            view →
          </a>
        </p>
      )}
    </article>
  );
}

export function ShopDetail() {
  const { slug } = useParams();
  const content = useSiteContent();
  const shop = findPage(content, '/shop')?.blocks.find((b) => b.type === 'shop')?.data as
    | ShopData
    | undefined;
  const item = shop?.items.find((i) => i.id === slug);
  if (!shop || !item) return <NotFound />;
  return (
    <article className="detail">
      <Link className="detail__back" to={shop.enabled ? '/shop' : '/'}>
        ← back
      </Link>
      <h1 className="detail__title">{item.name}</h1>
      {item.images.length > 0 ? (
        item.images.map((src) => <img key={src} src={src} alt="" style={{ maxWidth: '100%' }} />)
      ) : (
        <Placeholder label={item.name.toLowerCase()} />
      )}
      {item.description && (
        <p className="prose" style={{ marginTop: 18 }}>
          {item.description}
        </p>
      )}
      <p className="price" style={{ marginTop: 12 }}>
        {formatPrice(item.priceCents, shop.currency)}
      </p>
      {/* Checkout is deferred (ADR 0001 / §5) — beta shops show the price but no purchase. */}
      {!shop.enabled && <span className="beta">beta — checkout opens later</span>}
    </article>
  );
}

export function NotFound() {
  return (
    <div className="detail">
      <h1 className="detail__title">not found</h1>
      <Link className="detail__back" to="/">
        ← index
      </Link>
    </div>
  );
}
