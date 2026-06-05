import type { TenantContent } from '@csp/core';
import { useEffect, useState } from 'react';
import { isPreviewMessage } from './preview';

export interface ContentState {
  content: TenantContent | null;
  error: Error | null;
  loading: boolean;
  /** True once a preview payload from the admin app has taken over (no live refetch). */
  previewing: boolean;
}

export interface UseContentOptions {
  /**
   * The tenant to request. The shared API is called cross-origin, so the request's Host header is the
   * API's domain — not the site's; the bundle must therefore name its own tenant. Defaults to the
   * current hostname with any `www.` stripped (i.e. the live domain == the tenantId, §1).
   */
  tenantId?: string;
}

function defaultTenantId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.location.hostname.replace(/^www\./, '');
}

/**
 * The bundle's content source (§7): fetch `GET {apiBaseUrl}/content?tenant=<tenantId>` on load, and
 * listen for the admin app's preview `postMessage` to re-render from the working payload instead of
 * refetching.
 */
export function useContent(apiBaseUrl: string, options?: UseContentOptions): ContentState {
  const [content, setContent] = useState<TenantContent | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const tenantId = options?.tenantId ?? defaultTenantId();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = `${apiBaseUrl}/content${tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : ''}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`GET /content failed: ${res.status}`);
        return res.json() as Promise<TenantContent>;
      })
      .then((fetched) => {
        // A preview may have already taken over while the fetch was in flight; don't clobber it.
        if (!cancelled) setContent((current) => current ?? fetched);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, tenantId]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (isPreviewMessage(event.data)) {
        setContent(event.data.content);
        setPreviewing(true);
        setLoading(false);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return { content, error, loading, previewing };
}

/** Find a page by slug — a small helper for bundle route composition. */
export function findPage(content: TenantContent, slug: string) {
  return content.pages.find((page) => page.slug === slug);
}
