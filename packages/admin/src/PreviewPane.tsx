import { postPreview } from '@csp/bundle-kit';
import type { TenantContent } from '@csp/core';
import { useEffect, useRef } from 'react';

/**
 * The live-preview pane (§7): the client's *real deployed site* embedded in an iframe. On debounced
 * content change the admin posts the working document into the iframe via `postMessage`; the bundle
 * re-renders from it (full WYSIWYG *feel*, none of the §2 re-coupling). On save the iframe reloads
 * clean — handled by the bundle refetching `GET /content`.
 */
export function PreviewPane({
  previewUrl,
  content,
  debounceMs = 200,
}: {
  previewUrl: string;
  content: TenantContent | null;
  debounceMs?: number;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!content) return;
    const target = frameRef.current?.contentWindow;
    if (!target) return;
    const handle = setTimeout(() => postPreview(target, content), debounceMs);
    return () => clearTimeout(handle);
  }, [content, debounceMs]);

  return (
    <div className="preview">
      <div className="preview__bar">
        live preview <span className="admin__muted">{previewUrl}</span>
      </div>
      <iframe ref={frameRef} className="preview__frame" src={previewUrl} title="Live preview" />
    </div>
  );
}
