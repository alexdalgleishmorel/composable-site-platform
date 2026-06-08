import type { BlockType } from '@csp/blocks';
import type { Block } from '@csp/core';
import { useState, type DragEvent } from 'react';
import { blockMeta, blockSummary } from '../blockMeta';
import { ChevronRight, TrashIcon } from '../icons';

export interface BlockDrag {
  isOver: boolean;
  isDragging: boolean;
  onGripDragStart: () => void;
  onGripDragEnd: () => void;
  onCardDragOver: (e: DragEvent) => void;
  onCardDrop: () => void;
}

/**
 * One glass block card (README §Block card). Header: drag grip, a disclosure (chevron + glyph + type
 * name + one-line summary) that animates the body open/closed, and a delete button. The body is the
 * block's shared `EditForm` from the registry — the admin never touches a client's bespoke render.
 */
export function BlockCard({
  block,
  def,
  anim,
  onPatch,
  onDelete,
  drag,
}: {
  block: Block;
  def: BlockType<unknown> | undefined;
  anim: boolean;
  onPatch: (data: unknown) => void;
  onDelete: () => void;
  drag: BlockDrag;
}) {
  const [open, setOpen] = useState(true);
  const meta = blockMeta(block.type, def?.label);

  return (
    <section
      className={
        'blockcard' +
        (anim ? ' anim-rise' : '') +
        (drag.isOver ? ' blockcard--over' : '') +
        (drag.isDragging ? ' blockcard--dragging' : '')
      }
      onDragOver={drag.onCardDragOver}
      onDrop={drag.onCardDrop}
    >
      <header className="blockcard__head">
        <button
          className="blockcard__grip focusable"
          draggable
          onDragStart={drag.onGripDragStart}
          onDragEnd={drag.onGripDragEnd}
          title="Drag to reorder block"
          aria-label="Drag to reorder block"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>
        <button
          className="blockcard__disclose focusable"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          title={open ? 'Collapse' : 'Expand'}
        >
          <span className={'blockcard__chev' + (open ? ' is-open' : '')}>
            <ChevronRight />
          </span>
          <span className="blockcard__glyph" aria-hidden="true">
            {meta.glyph}
          </span>
          <span className="blockcard__titles">
            <span className="blockcard__type">{meta.name}</span>
            <span className="blockcard__sub">{blockSummary(block.type, block.data)}</span>
          </span>
        </button>
        <div className="blockcard__tools">
          <button
            className="iconbtn iconbtn--danger focusable"
            title="Delete block"
            aria-label="Delete block"
            onClick={onDelete}
          >
            <TrashIcon />
          </button>
        </div>
      </header>
      <div className={'blockcard__bodywrap' + (open ? ' is-open' : '')}>
        <div className="blockcard__body">
          {def ? (
            <def.EditForm data={block.data} onChange={onPatch} />
          ) : (
            <div className="csp-field__hint">Unknown block type “{block.type}”.</div>
          )}
        </div>
      </div>
    </section>
  );
}
