import type { TenantContent } from '@csp/core';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { postPreview } from './preview';
import { useContent } from './useContent';

const content = (siteName: string): TenantContent => ({
  tenantId: 'jmdm.org',
  siteMeta: { siteName },
  pages: [],
  updatedAt: '2026-06-05T00:00:00.000Z',
});

function Probe({ apiBaseUrl, tenantId }: { apiBaseUrl: string; tenantId?: string }) {
  const { content: c, error, previewing } = useContent(apiBaseUrl, { tenantId });
  if (error) return <div>error:{error.message}</div>;
  if (!c) return <div>loading</div>;
  return (
    <div>
      {previewing ? 'preview:' : 'live:'}
      {c.siteMeta.siteName}
    </div>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('useContent', () => {
  it('fetches GET /content with the tenant query param on load', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(content('live-jmdm')) }),
    );
    render(<Probe apiBaseUrl="https://api.test" tenantId="jmdm.studio" />);
    await waitFor(() => expect(screen.getByText('live:live-jmdm')).toBeTruthy());
    expect(globalThis.fetch as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      'https://api.test/content?tenant=jmdm.studio',
    );
  });

  it('defaults the tenant to the current hostname (www-stripped)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(content('live-jmdm')) }),
    );
    // jsdom serves these tests from http://localhost, so the default tenant is "localhost".
    render(<Probe apiBaseUrl="https://api.test" />);
    await waitFor(() => expect(screen.getByText('live:live-jmdm')).toBeTruthy());
    expect(globalThis.fetch as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      'https://api.test/content?tenant=localhost',
    );
  });

  it('surfaces a fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    render(<Probe apiBaseUrl="https://api.test" />);
    await waitFor(() => expect(screen.getByText(/error:GET \/content failed: 503/)).toBeTruthy());
  });

  it('re-renders from an admin preview postMessage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(content('live-jmdm')) }),
    );
    render(<Probe apiBaseUrl="https://api.test" />);
    await waitFor(() => expect(screen.getByText('live:live-jmdm')).toBeTruthy());

    postPreview(window, content('edited-jmdm'));
    await waitFor(() => expect(screen.getByText('preview:edited-jmdm')).toBeTruthy());
  });
});
