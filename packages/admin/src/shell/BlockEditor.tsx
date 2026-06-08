import type { BlockRegistry } from '@csp/blocks';
import type { Block } from '@csp/core';
import { useRef, useState } from 'react';
import { blockMeta } from '../blockMeta';
import { useConfirm } from '../confirm';

/**
 * The left pane (README §3): the page's block cards with drag-to-reorder, plus the "Add a block" row.
 * Deleting a block goes through the confirm modal before it takes effect.
 */
import { BlockCard } from './BlockCard';

export function BlockEditor({
  pageTitle,
  blocks,
  registry,
  justAddedId,
  onPatchBlock,
  onRemoveBlock,
  onReorder,
  onAddBlock,
}: {
  pageTitle: string;
  blocks: Block[];
  registry: BlockRegistry;
  justAddedId: string | null;
  onPatchBlock: (id: string, data: unknown) => void;
  onRemoveBlock: (id: string) => void;
  onReorder: (next: Block[]) => void;
  onAddBlock: (type: string) => void;
}) {
  const confirm = useConfirm();
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const dropAt = (i: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragging(null);
    setOverIndex(null);
    if (from == null || from === i) return;
    const next = blocks.slice();
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved!);
    onReorder(next);
  };

  const requestDelete = async (block: Block) => {
    const name = blockMeta(block.type, registry.get(block.type)?.label).name;
    const ok = await confirm({
      title: `Delete the ${name} block?`,
      message: `This removes the block and everything in it from “${pageTitle}.” You can’t undo this.`,
      confirmLabel: 'Delete block',
    });
    if (ok) onRemoveBlock(block.id);
  };

  return (
    <div className="editor-pane scroll">
      <div className="editor-pane__inner">
        <div className="pane-head">
          <h1 className="pane-head__title">{pageTitle}</h1>
          <span className="pane-head__count">
            {blocks.length} block{blocks.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="block-stack">
          {blocks.map((block, i) => (
            <BlockCard
              key={block.id}
              block={block}
              def={registry.get(block.type)}
              anim={block.id === justAddedId}
              onPatch={(data) => onPatchBlock(block.id, data)}
              onDelete={() => void requestDelete(block)}
              drag={{
                isOver: overIndex === i && dragging !== i,
                isDragging: dragging === i,
                onGripDragStart: () => {
                  dragIndex.current = i;
                  setDragging(i);
                },
                onGripDragEnd: () => {
                  dragIndex.current = null;
                  setDragging(null);
                  setOverIndex(null);
                },
                onCardDragOver: (e) => {
                  if (dragging == null) return;
                  e.preventDefault();
                  if (overIndex !== i) setOverIndex(i);
                },
                onCardDrop: () => dropAt(i),
              }}
            />
          ))}
        </div>

        <div className="addblock">
          <span className="addblock__label">Add a block</span>
          <div className="addblock__chips">
            {registry.list().map((def) => {
              const meta = blockMeta(def.type, def.label);
              return (
                <button
                  key={def.type}
                  className="chip focusable"
                  aria-label={`Add ${meta.name} block`}
                  onClick={() => onAddBlock(def.type)}
                >
                  <span className="chip__glyph">{meta.glyph}</span>
                  <span className="chip__text">
                    <span className="chip__name">{meta.name}</span>
                    <span className="chip__blurb">{meta.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
