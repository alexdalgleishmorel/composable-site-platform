import type { Page } from '@csp/core';
import { PlusIcon } from '../icons';

/**
 * The page-tabs bar (README §Page tabs). Each tab shows the page title + path (mono, accent when
 * active). A dashed "+" button adds a page.
 */
export function PageTabs({
  pages,
  activeId,
  onSelect,
  onAdd,
}: {
  pages: Page[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="pagetabs glass">
      <div className="pagetabs__scroll scroll">
        {pages.map((p) => (
          <button
            key={p.id}
            className={'pagetab focusable' + (p.id === activeId ? ' pagetab--active' : '')}
            onClick={() => onSelect(p.id)}
          >
            <span className="pagetab__title">{p.title}</span>
            <span className="pagetab__path">{p.slug}</span>
          </button>
        ))}
      </div>
      <button className="pagetab__add focusable" title="Add page" onClick={onAdd}>
        <PlusIcon />
      </button>
    </div>
  );
}
