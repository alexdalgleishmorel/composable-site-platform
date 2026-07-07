import type {
  EntryListData,
  ImageValue,
  NoteCardsData,
  Project,
  ProjectGridData,
  RichTextData,
  ShopData,
} from '@csp/blocks';
import { imageUrl } from '@csp/blocks';
import { findPage, PageRenderer } from '@csp/bundle-kit';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import { useSiteContent } from './content-context';
import { catalogNumber, dollars, Placeholder, pickKind } from './Placeholder';
import { CurrentlyCards, CvRows, FramedImg, frameStyle, renderMap } from './renderers';

/**
 * A fullscreen, uncropped view of one image from a gallery — closes on backdrop click, the close
 * button, or Escape; Left/Up and Right/Down step to the previous/next image, wrapping at the ends.
 * Portalled to `document.body` so it always covers the viewport regardless of any ancestor's
 * `page-enter` animation (a non-`none` `transform`, even at rest, would otherwise contain it).
 */
function Lightbox({
  images,
  index,
  alt,
  onNavigate,
  onClose,
}: {
  images: ImageValue[];
  index: number;
  alt: string;
  onNavigate: (index: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (images.length <= 1) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        onNavigate((index - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        onNavigate((index + 1) % images.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [images.length, index, onNavigate, onClose]);

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <button type="button" className="lightbox__close" onClick={onClose}>
        × close
      </button>
      <img
        className="lightbox__img"
        src={imageUrl(images[index]!)}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}

export function NotFound() {
  return (
    <div className="not-found page-enter">
      <h1 className="product__title">not found</h1>
      <p>
        <Link to="/">← index</Link>
      </p>
    </div>
  );
}

/** Home ("/") and Shop ("/shop") are single-block pages rendered through the shared BlockRenderer. */
function PageBySlug({ slug }: { slug: string }) {
  const content = useSiteContent();
  const page = findPage(content, slug);
  if (!page) return <NotFound />;
  return (
    <div className="page-enter">
      <PageRenderer renderers={renderMap} page={page} />
    </div>
  );
}

export const Home = () => <PageBySlug slug="/" />;
export const Shop = () => <PageBySlug slug="/shop" />;

/** About is bespoke composition (the wireframe's 4-column grid), not a generic block stack. */
export function About() {
  const content = useSiteContent();
  const { siteMeta } = content;
  const page = findPage(content, '/about');
  if (!page) return <NotFound />;

  const bio = page.blocks.find((b) => b.type === 'richText')?.data as RichTextData | undefined;
  const cvs = page.blocks.filter((b) => b.type === 'entryList').map((b) => b.data as EntryListData);
  const currently = page.blocks.find((b) => b.type === 'noteCards')?.data as
    | NoteCardsData
    | undefined;
  const [selected, press] = cvs;

  return (
    <div className="about page-enter">
      <div className="about__body">
        <div />
        <div className="about__col about__bio">
          <h4 className="about__col__h">{bio?.heading ?? 'background'}</h4>
          {bio?.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className="about__col">
          <h4 className="about__col__h">contact</h4>
          <div className="contact-block">
            {siteMeta.contactEmail && (
              <div>
                <b>email</b> <a href={`mailto:${siteMeta.contactEmail}`}>{siteMeta.contactEmail}</a>
              </div>
            )}
            {siteMeta.socialLinks?.map((l) => (
              <div key={l.url}>
                <b>instagram</b>{' '}
                <a href={l.url} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              </div>
            ))}
            {siteMeta.studioLocation && (
              <div>
                <b>studio</b> {siteMeta.studioLocation}
              </div>
            )}
            {siteMeta.hours && (
              <div>
                <b>hours</b> {siteMeta.hours}
              </div>
            )}
          </div>
        </div>

        <div />
        <div />
        {selected && (
          <div className="about__col">
            <h4 className="about__col__h">{selected.heading ?? 'selected works'}</h4>
            <CvRows entries={selected.entries} />
          </div>
        )}
        {press && (
          <div className="about__col">
            <h4 className="about__col__h">{press.heading ?? 'press / writing'}</h4>
            <CvRows entries={press.entries} />
          </div>
        )}

        <div />
        <div />
        {currently && (
          <div className="about__currently">
            <h4 className="about__col__h about__currently__h">
              {currently.heading ?? 'currently'}
            </h4>
            <CurrentlyCards cards={currently.cards} />
          </div>
        )}
        <div />
      </div>
    </div>
  );
}

function useProjects(): Project[] {
  const content = useSiteContent();
  const block = findPage(content, '/')?.blocks.find((b) => b.type === 'projectGrid');
  return (block?.data as ProjectGridData | undefined)?.projects ?? [];
}

export function ProjectDetail() {
  const { slug } = useParams();
  const project = useProjects().find((p) => p.id === slug);
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  // A different project can route in without unmounting this component (react-router keeps the
  // instance across param changes on the same route) — reset the picked image / modal each time.
  useEffect(() => {
    setSelected(0);
    setLightbox(false);
  }, [project?.id]);

  if (!project) return <NotFound />;
  const mainImage = project.images[selected];

  return (
    <div className="product page-enter">
      <header className="product__head">
        <div className="product__head__left">
          <div className="product__cat">{catalogNumber(project.order)}</div>
          <h1 className="product__title">{project.title || '(untitled)'}</h1>
          <div className="product__sub">{project.summary ?? project.tags?.join(' / ') ?? ''}</div>
        </div>
        <Link className="product__close" to="/">
          × close
        </Link>
      </header>
      <div className="product__body">
        <section className="product__images">
          <button
            type="button"
            className="product__image-main"
            style={frameStyle(mainImage)}
            disabled={!mainImage}
            onClick={() => setLightbox(true)}
          >
            {mainImage ? (
              <>
                <FramedImg image={mainImage} alt={project.title} />
                <span className="product__image-main__hint">view full size</span>
              </>
            ) : (
              <Placeholder kind={pickKind(project.id)} label={project.tags?.[0]?.toLowerCase()} />
            )}
          </button>
          {project.images.length > 1 && (
            <div className="product__image-thumbs">
              {project.images.slice(0, 4).map((src, i) => (
                <button
                  type="button"
                  key={i}
                  className={
                    'product__image-thumb' + (i === selected ? ' product__image-thumb--active' : '')
                  }
                  aria-current={i === selected}
                  aria-label={`Show image ${i + 1} of ${project.images.length}`}
                  onClick={() => setSelected(i)}
                >
                  <FramedImg image={src} alt="" />
                </button>
              ))}
            </div>
          )}
          {lightbox && mainImage && (
            <Lightbox
              images={project.images}
              index={selected}
              alt={project.title}
              onNavigate={setSelected}
              onClose={() => setLightbox(false)}
            />
          )}
        </section>
        <section className="product__info">
          {project.tags && project.tags.length > 0 && (
            <div className="product__section">
              <h3 className="product__section__h">Details</h3>
              <dl className="product__details">
                <dt>discipline</dt>
                <dd>{project.tags.join(' / ')}</dd>
              </dl>
            </div>
          )}
          {project.body && (
            <div className="product__section">
              <h3 className="product__section__h">Description</h3>
              <p className="product__desc">{project.body}</p>
            </div>
          )}
          {project.link && (
            <div className="product__link">
              <a href={project.link} target="_blank" rel="noreferrer">
                view →
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function ShopDetail() {
  const { slug } = useParams();
  const content = useSiteContent();
  const shop = findPage(content, '/shop')?.blocks.find((b) => b.type === 'shop')?.data as
    | ShopData
    | undefined;
  const item = shop?.items.find((i) => i.id === slug);
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  useEffect(() => {
    setSelected(0);
    setLightbox(false);
  }, [item?.id]);

  if (!shop || !item) return <NotFound />;
  const mainImage = item.images[selected];

  return (
    <div className="product page-enter">
      <header className="product__head">
        <div className="product__head__left">
          <div className="product__cat">{catalogNumber(item.order)}</div>
          <h1 className="product__title">{item.name}</h1>
        </div>
        <Link className="product__close" to={shop.enabled ? '/shop' : '/'}>
          × close
        </Link>
      </header>
      <div className="product__body">
        <section className="product__images">
          <button
            type="button"
            className="product__image-main"
            style={frameStyle(mainImage)}
            disabled={!mainImage}
            onClick={() => setLightbox(true)}
          >
            {mainImage ? (
              <>
                <FramedImg image={mainImage} alt={item.name} />
                <span className="product__image-main__hint">view full size</span>
              </>
            ) : (
              <Placeholder kind={pickKind(item.id)} label={item.name.toLowerCase()} />
            )}
          </button>
          {lightbox && mainImage && (
            <Lightbox
              images={item.images}
              index={selected}
              alt={item.name}
              onNavigate={setSelected}
              onClose={() => setLightbox(false)}
            />
          )}
        </section>
        <section className="product__info">
          <div className="product__price">
            <span className="product__price__num">${dollars(item.priceCents)}</span>
            <span className="product__price__cur">{shop.currency}</span>
          </div>
          <div className="product__stock">
            <span className="product__stock__dot" />
            {item.inStock ? 'in stock' : 'sold out'}
          </div>
          {item.description && (
            <div className="product__section">
              <h3 className="product__section__h">Description</h3>
              <p className="product__desc">{item.description}</p>
            </div>
          )}
          {/* Checkout deferred (ADR 0001 / §5) — beta shows the price, no purchase. */}
          {!shop.enabled && <span className="beta-tag">beta — checkout opens later</span>}
        </section>
      </div>
    </div>
  );
}
