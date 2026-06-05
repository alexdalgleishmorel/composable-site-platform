/**
 * @csp/bundle-kit — the shared runtime contract every client bundle implements (§7).
 *
 * A bundle ships render components, theme, and page composition — NOT schemas or edit forms. This kit
 * gives it the three things it owes the platform:
 *   1. `useContent(apiBaseUrl)` — fetch `GET /content` on load.
 *   2. `BlockRenderer` / `PageRenderer` — render blocks by `type` from the bundle's `RenderMap`.
 *   3. `useContent` also accepts the admin's preview `postMessage` and re-renders from it.
 *
 * The bespoke render components keyed by `type` are the creative (paid) work; everything here is the
 * thin, shared glue.
 */
export { BlockRenderer, PageRenderer } from './BlockRenderer';
export type { RenderComponent, RenderMap } from './BlockRenderer';
export { useContent, findPage } from './useContent';
export type { ContentState } from './useContent';
export { PREVIEW_MESSAGE_TYPE, isPreviewMessage, postPreview } from './preview';
export type { PreviewMessage } from './preview';

export const BUNDLE_KIT_PACKAGE = '@csp/bundle-kit';
