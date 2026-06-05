import { registry } from '@csp/blocks';
import { newId, type Block, type TenantContent } from '@csp/core';
import { useEffect, useState } from 'react';
import type { ContentApi, SaveResult } from './api';
import { useSession } from './session';

const reindex = (blocks: Block[]): Block[] => blocks.map((b, i) => ({ ...b, order: i }));

/**
 * The shared block-list editor. Renders each block's shared `EditForm` from the registry — it never
 * touches a client's bespoke render, which is exactly why one admin serves every tenant (§2/§7).
 *
 * `onContentChange` lets the live-preview wiring (#19) observe the working document.
 */
export function Editor({
  api,
  onContentChange,
}: {
  api: ContentApi;
  onContentChange?: (content: TenantContent) => void;
}) {
  const session = useSession();
  const [content, setContentState] = useState<TenantContent | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);

  useEffect(() => {
    let active = true;
    api.getContent().then((c) => {
      if (active) setContentState(c);
    });
    return () => {
      active = false;
    };
  }, [api]);

  function setContent(next: TenantContent) {
    setContentState(next);
    setResult(null);
    onContentChange?.(next);
  }

  if (!content) return <div className="admin__loading">Loading content…</div>;

  const page = content.pages[pageIndex]!;

  function mutatePage(updater: (blocks: Block[]) => Block[]) {
    const pages = content!.pages.map((p, i) =>
      i === pageIndex ? { ...p, blocks: reindex(updater(p.blocks)) } : p,
    );
    setContent({ ...content!, pages });
  }

  const updateBlock = (blockId: string, data: unknown) =>
    mutatePage((blocks) => blocks.map((b) => (b.id === blockId ? { ...b, data } : b)));
  const removeBlock = (blockId: string) =>
    mutatePage((blocks) => blocks.filter((b) => b.id !== blockId));
  const moveBlock = (index: number, dir: -1 | 1) =>
    mutatePage((blocks) => {
      const to = index + dir;
      if (to < 0 || to >= blocks.length) return blocks;
      const next = blocks.slice();
      [next[index], next[to]] = [next[to]!, next[index]!];
      return next;
    });
  const addBlock = (type: string) =>
    mutatePage((blocks) => [
      ...blocks,
      { id: newId(), type, order: blocks.length, data: registry.require(type).defaultData() },
    ]);

  async function save() {
    setSaving(true);
    setResult(await api.putContent({ ...content!, updatedAt: '2026-06-05T00:00:00.000Z' }));
    setSaving(false);
  }

  return (
    <div className="admin">
      <header className="admin__bar">
        <div>
          <strong>{content.siteMeta.siteName}</strong>{' '}
          <span className="admin__muted">· {content.tenantId}</span>
        </div>
        <div className="admin__bar-right">
          <span className="admin__muted">{session.email}</span>
          <button className="admin__save" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="admin__link" onClick={session.signOut}>
            sign out
          </button>
        </div>
      </header>

      {result && (
        <div
          className={result.ok ? 'admin__toast admin__toast--ok' : 'admin__toast admin__toast--err'}
        >
          {result.ok
            ? 'Saved.'
            : `Cannot save — ${result.issues?.length ?? 0} issue(s): ${result.issues
                ?.map((i) => `${i.path}: ${i.message}`)
                .join('; ')}`}
        </div>
      )}

      <nav className="admin__pages">
        {content.pages.map((p, i) => (
          <button
            key={p.id}
            className={i === pageIndex ? 'admin__tab admin__tab--active' : 'admin__tab'}
            onClick={() => setPageIndex(i)}
          >
            {p.title} <span className="admin__muted">{p.slug}</span>
          </button>
        ))}
      </nav>

      <div className="admin__editor">
        {page.blocks.map((block, index) => {
          const def = registry.get(block.type);
          return (
            <section className="block-card" key={block.id}>
              <header className="block-card__head">
                <span className="block-card__type">{def?.label ?? block.type}</span>
                <div className="block-card__controls">
                  <button
                    title="Move up"
                    disabled={index === 0}
                    onClick={() => moveBlock(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    title="Move down"
                    disabled={index === page.blocks.length - 1}
                    onClick={() => moveBlock(index, 1)}
                  >
                    ↓
                  </button>
                  <button title="Delete block" onClick={() => removeBlock(block.id)}>
                    ×
                  </button>
                </div>
              </header>
              {def ? (
                <def.EditForm data={block.data} onChange={(data) => updateBlock(block.id, data)} />
              ) : (
                <div className="admin__muted">Unknown block type “{block.type}”.</div>
              )}
            </section>
          );
        })}

        <div className="add-block">
          <span className="admin__muted">Add a block:</span>
          {registry.list().map((def) => (
            <button key={def.type} className="add-block__btn" onClick={() => addBlock(def.type)}>
              + {def.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
