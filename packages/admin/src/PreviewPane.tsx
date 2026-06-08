import { postPreview } from '@csp/bundle-kit';
import type { TenantContent } from '@csp/core';
import { useEffect, useRef, useState } from 'react';
import {
  CollapseRight,
  DeviceIcon,
  ExpandLeft,
  EyeIcon,
  InfoIcon,
  LockIcon,
  ReloadIcon,
  WarningIcon,
  type DeviceKind,
} from './icons';

/**
 * The live-preview pane (§7, README §5): the client's *real deployed site* embedded in a framed
 * browser. On debounced content change the admin posts the working document into the iframe via
 * `postMessage`; the bundle re-renders from it — full WYSIWYG, none of the §2 re-coupling. This stays
 * **live** (it reflects edits as you type); the save-state indicator and the notice below mark what's
 * published vs. only previewed.
 *
 * The chrome (browser frame, device toggles, collapse rail, notice) is recreated from the design
 * handoff. All chrome props are optional so the pane still renders standalone (and under test).
 */
const DEVICE_WIDTH: Record<DeviceKind, number | null> = { desktop: null, tablet: 800, mobile: 390 };

export function PreviewPane({
  previewUrl,
  content,
  debounceMs = 200,
  siteName,
  domain,
  pageTitle,
  pageSlug,
  dirty = false,
  collapsed = false,
  onToggleCollapsed,
  pulseKey,
}: {
  previewUrl: string;
  content: TenantContent | null;
  debounceMs?: number;
  siteName?: string;
  domain?: string;
  pageTitle?: string;
  pageSlug?: string;
  dirty?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Bump this (e.g. a publish counter) to pulse the "live" pip after a publish. */
  pulseKey?: number;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<DeviceKind>('desktop');
  const [pulse, setPulse] = useState(false);

  // Live WYSIWYG: debounced post of the working document into the bundle iframe.
  useEffect(() => {
    if (!content) return;
    const target = frameRef.current?.contentWindow;
    if (!target) return;
    const handle = setTimeout(() => postPreview(target, content), debounceMs);
    return () => clearTimeout(handle);
  }, [content, debounceMs]);

  // Pulse the "live" pip whenever a publish happens.
  useEffect(() => {
    if (pulseKey === undefined) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 800);
    return () => clearTimeout(t);
  }, [pulseKey]);

  const base = domain ? `https://${domain}` : previewUrl;
  const url = base + (pageSlug && pageSlug !== '/' ? pageSlug : '');
  const tabTitle = [siteName, pageTitle].filter(Boolean).join(' — ') || siteName || 'Live preview';
  const width = DEVICE_WIDTH[device];
  const reload = () => {
    if (frameRef.current) frameRef.current.src = frameRef.current.src;
  };

  return (
    <div className={'preview' + (collapsed ? ' preview--collapsed' : '')}>
      {collapsed ? (
        <button className="prail focusable" onClick={onToggleCollapsed} title="Show live preview">
          <span className="prail__expand">
            <ExpandLeft />
          </span>
          <span className="prail__label">Live preview</span>
          {dirty && <span className="prail__dot" title="Unpublished changes" />}
        </button>
      ) : (
        <>
          <div className="preview__head">
            <span className="preview__headtitle">
              <EyeIcon />
              Live preview
            </span>
            <button
              className="preview__collapse focusable"
              onClick={onToggleCollapsed}
              title="Collapse preview"
            >
              <CollapseRight />
              Collapse
            </button>
          </div>

          <div className={'preview__notice' + (dirty ? ' preview__notice--warn' : '')}>
            <span className="preview__noticeicon">{dirty ? <WarningIcon /> : <InfoIcon />}</span>
            <span className="preview__noticetext">
              {dirty ? (
                <>
                  <strong>Unsaved changes.</strong> Edits show here live, but won’t be public until
                  you <strong>Save&nbsp;&amp;&nbsp;publish</strong>.
                </>
              ) : (
                <>
                  This preview updates <strong>live</strong> as you edit.
                  Save&nbsp;&amp;&nbsp;publish to make changes public.
                </>
              )}
            </span>
          </div>
        </>
      )}

      {/* Keep the iframe mounted while collapsed (hide via CSS) so it doesn't reload. */}
      <div className="browser glass" style={collapsed ? { display: 'none' } : undefined}>
        <div className="browser__chrome">
          <div className="browser__lights">
            <span />
            <span />
            <span />
          </div>
          <div className="browser__tab">
            <span className="browser__favicon" />
            <span className="browser__tabtitle">{tabTitle}</span>
          </div>
          <button className="browser__navbtn focusable" title="Reload" onClick={reload}>
            <ReloadIcon />
          </button>
          <div className="browser__url">
            <LockIcon className="browser__lock" />
            <span className="browser__urltext">{url}</span>
            <span className={'browser__live' + (pulse ? ' is-pulse' : '')}>
              <span className="browser__livepip" />
              live
            </span>
          </div>
          <div className="browser__devices">
            {(Object.keys(DEVICE_WIDTH) as DeviceKind[]).map((kind) => (
              <button
                key={kind}
                className={'devbtn focusable' + (device === kind ? ' devbtn--active' : '')}
                title={kind[0]!.toUpperCase() + kind.slice(1)}
                onClick={() => setDevice(kind)}
              >
                <DeviceIcon kind={kind} />
              </button>
            ))}
          </div>
        </div>
        <div className="browser__viewport scroll">
          <div className="browser__frame" style={width ? { width, margin: '0 auto' } : undefined}>
            <iframe
              ref={frameRef}
              className="browser__iframe"
              src={previewUrl}
              title="Live preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
