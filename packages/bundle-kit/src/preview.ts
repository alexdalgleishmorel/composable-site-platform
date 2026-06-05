import type { TenantContent } from '@csp/core';

/**
 * The admin app <-> client bundle preview protocol (§7). The admin posts the working content into the
 * bundle's iframe via `postMessage`; the bundle re-renders from that payload instead of refetching.
 *
 * This is the ONLY integration the bespoke bundle owes the shared admin app.
 */
export const PREVIEW_MESSAGE_TYPE = 'csp:preview';

export interface PreviewMessage {
  type: typeof PREVIEW_MESSAGE_TYPE;
  content: TenantContent;
}

export function isPreviewMessage(value: unknown): value is PreviewMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === PREVIEW_MESSAGE_TYPE &&
    'content' in value
  );
}

/** Helper for the admin side: post a working-content preview into a bundle iframe. */
export function postPreview(target: Window, content: TenantContent): void {
  const message: PreviewMessage = { type: PREVIEW_MESSAGE_TYPE, content };
  target.postMessage(message, '*');
}
