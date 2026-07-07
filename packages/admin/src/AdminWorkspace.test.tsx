import type { TenantContent } from '@csp/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminWorkspace } from './AdminWorkspace';
import type { ContentApi, SaveResult } from './api';
import { ConfirmProvider } from './confirm';
import { sampleContent } from './mockContent';
import { SessionContext } from './session';
import { ThemeProvider } from './theme';
import { ToastProvider } from './toasts';

const clone = (c: TenantContent): TenantContent => JSON.parse(JSON.stringify(c)) as TenantContent;

/** A transport bound to a fixed server snapshot. A *fresh* instance models the new `api` object
 *  CognitoGate used to hand down on every OIDC silent token renewal (the data-loss trigger). */
function apiReturning(server: TenantContent): ContentApi {
  return {
    async getContent() {
      return clone(server);
    },
    async putContent(): Promise<SaveResult> {
      return { ok: true };
    },
  };
}

const tree = (api: ContentApi) => (
  <ThemeProvider>
    <ToastProvider>
      <ConfirmProvider>
        <SessionContext.Provider
          value={{ email: 'jack@example.com', tenantId: 'jmdm.studio', signOut: () => {} }}
        >
          <AdminWorkspace api={api} uploader={null} previewUrl="about:blank" />
        </SessionContext.Provider>
      </ConfirmProvider>
    </ToastProvider>
  </ThemeProvider>
);

describe('AdminWorkspace — unpublished edits survive a transport swap', () => {
  it('does not re-fetch and clobber the working document when `api` identity changes', async () => {
    const server = sampleContent();
    const { rerender } = render(tree(apiReturning(server)));

    // Loaded: the seeded Home page's projectGrid block card is shown.
    await screen.findByText('Project grid', { selector: '.blockcard__type' });

    // Make an unpublished edit: add a Shop block (absent from the server snapshot).
    fireEvent.click(screen.getByRole('button', { name: 'Add Shop block' }));
    expect(screen.getAllByText('Shop', { selector: '.blockcard__type' })).toHaveLength(1);

    // Simulate a token renewal: a brand-new api object with the (unchanged) server content.
    rerender(tree(apiReturning(server)));

    // The unpublished Shop block must still be there — a background re-fetch must not wipe it.
    await waitFor(() =>
      expect(screen.getAllByText('Shop', { selector: '.blockcard__type' })).toHaveLength(1),
    );
    expect(screen.getByText('Project grid', { selector: '.blockcard__type' })).toBeTruthy();
  });
});
