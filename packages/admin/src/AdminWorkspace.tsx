import { registry, UploaderProvider, type ContentIssue, type Uploader } from '@csp/blocks';
import { newId, type Block, type TenantContent } from '@csp/core';
import { useEffect, useState } from 'react';
import type { ContentApi } from './api';
import { blockMeta } from './blockMeta';
import { PreviewPane } from './PreviewPane';
import { useSession } from './session';
import { useTheme } from './theme';
import { useToast, type ToastItem } from './toasts';
import { BlockEditor } from './shell/BlockEditor';
import { PageTabs } from './shell/PageTabs';
import { TopBar } from './shell/TopBar';

const reindex = (blocks: Block[]): Block[] => blocks.map((b, i) => ({ ...b, order: i }));

/** Map a backend/registry validation issue onto an error-toast line (a located failure). */
const toToastItem = (issue: ContentIssue): ToastItem => ({
  where: issue.path,
  what: issue.message,
});

/**
 * The signed-in editor (App root): owns the working document, page navigation, save + validation,
 * theme, and the toast/confirm wiring. Renders the glass shell — TopBar → PageTabs → workspace
 * (block editor + live preview). One admin serves every tenant; it never touches a client's render.
 */
export function AdminWorkspace({
  api,
  uploader,
  previewUrl,
  allowedTypes = null,
  onBack,
}: {
  api: ContentApi;
  uploader: Uploader | null;
  previewUrl: string;
  /** The tenant's provisioned block types; `null` ⇒ all types. Filters the "Add a block" menu. */
  allowedTypes?: string[] | null;
  /** When set, the top bar shows a "Clients" back link (used when the owner edits their own site). */
  onBack?: () => void;
}) {
  const session = useSession();
  const toast = useToast();
  const { theme, setTheme } = useTheme();

  const [content, setContent] = useState<TenantContent | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [publishCount, setPublishCount] = useState(0);

  useEffect(() => {
    let active = true;
    api.getContent().then((c) => {
      if (!active) return;
      setContent(c);
      setActivePageId(c.pages[0]?.id ?? null);
    });
    return () => {
      active = false;
    };
  }, [api]);

  if (!content) return <div className="admin__loading">Loading content…</div>;

  const activePage = content.pages.find((p) => p.id === activePageId) ?? content.pages[0] ?? null;
  const activeId = activePage?.id ?? null;

  /** Patch the active page's blocks and mark the document dirty. */
  const mutateBlocks = (updater: (blocks: Block[]) => Block[]) => {
    setContent((prev) =>
      prev
        ? {
            ...prev,
            pages: prev.pages.map((p) =>
              p.id === activeId ? { ...p, blocks: reindex(updater(p.blocks)) } : p,
            ),
          }
        : prev,
    );
    setDirty(true);
  };

  const patchBlock = (id: string, data: unknown) =>
    mutateBlocks((blocks) => blocks.map((b) => (b.id === id ? { ...b, data } : b)));

  const removeBlock = (id: string) => {
    mutateBlocks((blocks) => blocks.filter((b) => b.id !== id));
    toast.info('Block removed', { duration: 1800, dedupe: 'blockrm' });
  };

  const reorderBlocks = (next: Block[]) => mutateBlocks(() => next);

  const addBlock = (type: string) => {
    const block: Block = {
      id: newId(),
      type,
      order: 0,
      data: registry.require(type).defaultData(),
    };
    mutateBlocks((blocks) => [...blocks, block]);
    setJustAdded(block.id);
    setTimeout(() => setJustAdded(null), 700);
    toast.info(`${blockMeta(type, registry.get(type)?.label).name} block added`, {
      duration: 2000,
    });
  };

  const addPage = () => {
    const n = content.pages.length + 1;
    const page = { id: newId(), slug: `/page-${n}`, title: 'New page', blocks: [] };
    setContent((prev) => (prev ? { ...prev, pages: [...prev.pages, page] } : prev));
    setActivePageId(page.id);
    setDirty(true);
    toast.info('Page added', { duration: 1800 });
  };

  const save = async () => {
    setSaving(true);
    const result = await api.putContent({ ...content, updatedAt: new Date().toISOString() });
    setSaving(false);
    if (result.ok) {
      setDirty(false);
      setPublishCount((c) => c + 1);
      toast.success('Changes published', {
        message: 'Your live preview is now up to date.',
        dedupe: 'save',
      });
    } else {
      toast.error('Couldn’t publish — please fix:', {
        items: (result.issues ?? []).slice(0, 6).map(toToastItem),
        dedupe: 'save',
      });
    }
  };

  return (
    <UploaderProvider uploader={uploader}>
      <div className="app">
        <TopBar
          siteName={content.siteMeta.siteName}
          domain={session.tenantId}
          email={session.email}
          dirty={dirty}
          saving={saving}
          theme={theme}
          onSave={() => void save()}
          onSetTheme={setTheme}
          onSignOut={session.signOut}
          onBack={onBack}
        />
        <PageTabs
          pages={content.pages}
          activeId={activeId ?? ''}
          onSelect={setActivePageId}
          onAdd={addPage}
        />
        <main className="workspace">
          {activePage ? (
            <BlockEditor
              pageTitle={activePage.title}
              blocks={activePage.blocks}
              registry={registry}
              allowedTypes={allowedTypes}
              justAddedId={justAdded}
              onPatchBlock={patchBlock}
              onRemoveBlock={removeBlock}
              onReorder={reorderBlocks}
              onAddBlock={addBlock}
            />
          ) : (
            <div className="editor-pane">
              <div className="editor-pane__inner">
                <div className="pane-head">
                  <h1 className="pane-head__title">No pages yet</h1>
                </div>
                <p className="csp-field__hint">Use “+” in the tab bar to add your first page.</p>
              </div>
            </div>
          )}
          {!previewCollapsed && <div className="workspace__divider" />}
          <PreviewPane
            previewUrl={previewUrl}
            content={content}
            siteName={content.siteMeta.siteName}
            domain={session.tenantId}
            pageTitle={activePage?.title}
            pageSlug={activePage?.slug}
            dirty={dirty}
            collapsed={previewCollapsed}
            onToggleCollapsed={() => setPreviewCollapsed((c) => !c)}
            pulseKey={publishCount}
          />
        </main>
      </div>
    </UploaderProvider>
  );
}
