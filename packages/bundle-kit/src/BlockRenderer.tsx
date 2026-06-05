/* eslint-disable @typescript-eslint/no-explicit-any -- the render map is heterogeneous (one entry
   per block type, each with its own data shape), so the value type is erased to `any` exactly like
   the block registry. `BlockRenderer` narrows `block.data` back to the component's `T` at the call. */
import type { Block, Page } from '@csp/core';
import type { FC } from 'react';

/**
 * A bespoke render component for a block type — the *presentation* plane (§2). Lives in the client
 * bundle, never in the shared library. It receives validated `data` and decides only HOW it looks.
 */
export type RenderComponent<T = unknown> = FC<{ data: T }>;

/** A bundle's map of block `type` -> its bespoke render component (the join key, §2). */
export type RenderMap = Record<string, RenderComponent<any>>;

/**
 * Render a single block by looking up its `type` in the bundle's render map. An unrecognised type
 * renders nothing — a bundle is free to implement only the block types it uses.
 */
export function BlockRenderer({ renderers, block }: { renderers: RenderMap; block: Block }) {
  const Render = renderers[block.type];
  if (!Render) return null;
  return <Render data={block.data} />;
}

/** Render a page's blocks in `order`. */
export function PageRenderer({ renderers, page }: { renderers: RenderMap; page: Page }) {
  const ordered = [...page.blocks].sort((a, b) => a.order - b.order);
  return (
    <>
      {ordered.map((block) => (
        <BlockRenderer key={block.id} renderers={renderers} block={block} />
      ))}
    </>
  );
}
