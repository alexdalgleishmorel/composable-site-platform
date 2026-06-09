import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

async function signIn(email: string) {
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
}

// A pure client (maps to jmdm.studio, not a platform owner) — lands in the editor.
const CLIENT = 'jack.dalgleishmorel@gmail.com';
// The platform owner — lands on the owner console.
const OWNER = 'alex.dalgleishmorel@gmail.com';

describe('admin app — sign in', () => {
  it('rejects an unknown email (no tenant, not an owner)', async () => {
    render(<App />);
    await signIn('stranger@example.com');
    expect(screen.getByText(/No tenant mapping/i)).toBeTruthy();
    expect(screen.queryByText('Demo Site')).toBeNull();
  });
});

describe('admin app — client editor', () => {
  it('signs in a client and loads the editor', async () => {
    render(<App />);
    await signIn(CLIENT);
    expect(await screen.findByText('Demo Site')).toBeTruthy();
    // The Home page's seeded projectGrid block renders from the registry (scope past the add chip).
    expect(screen.getByText('Project grid', { selector: '.blockcard__type' })).toBeTruthy();
  });

  it('adds a block from the registry and saves successfully', async () => {
    render(<App />);
    await signIn(CLIENT);
    await screen.findByText('Demo Site');

    // No Shop block card yet (the "Shop" add chip is always present, so scope to card headers).
    const shopCards = () => screen.queryAllByText('Shop', { selector: '.blockcard__type' });
    expect(shopCards()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Add Shop block' }));
    expect(shopCards()).toHaveLength(1); // block card header label

    fireEvent.click(screen.getByRole('button', { name: /save & publish/i }));
    await waitFor(() => expect(screen.getByText('Changes published')).toBeTruthy());
  });

  it('switches pages via the page tabs', async () => {
    render(<App />);
    await signIn(CLIENT);
    await screen.findByText('Demo Site');

    fireEvent.click(screen.getByRole('button', { name: /About \/about/i }));
    // About page's richText block card (scope past the add chip of the same name).
    expect(screen.getByText('Rich text', { selector: '.blockcard__type' })).toBeTruthy();
  });
});

describe('admin app — owner console', () => {
  it('routes the platform owner to the clients list', async () => {
    render(<App />);
    await signIn(OWNER);
    expect(await screen.findByText('Active clients')).toBeTruthy();
    expect(screen.getByText('JMDM Studio')).toBeTruthy();
    expect(screen.getByText('Demo Studio')).toBeTruthy();
    expect(screen.getByText('Acme Co.')).toBeTruthy();
    // The editor must NOT mount for the owner.
    expect(screen.queryByText('Demo Site')).toBeNull();
  });

  it('opens a client and saves block provisioning', async () => {
    render(<App />);
    await signIn(OWNER);
    await screen.findByText('Active clients');

    fireEvent.click(screen.getByRole('button', { name: /Demo Studio/ }));
    // Provisioning panel for that client.
    expect(await screen.findByRole('button', { name: /save provisioning/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /save provisioning/i }));
    await waitFor(() => expect(screen.getByText('Provisioning saved')).toBeTruthy());
    // Returns to the clients list.
    expect(await screen.findByText('Active clients')).toBeTruthy();
  });
});
