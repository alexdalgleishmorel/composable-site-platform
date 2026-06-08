import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

async function signIn(email: string) {
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
}

describe('admin app', () => {
  it('rejects a non-allowlisted email', async () => {
    render(<App />);
    await signIn('stranger@example.com');
    expect(screen.getByText(/No tenant mapping/i)).toBeTruthy();
    expect(screen.queryByText('Demo Site')).toBeNull();
  });

  it('signs in an allowlisted email and loads the editor', async () => {
    render(<App />);
    await signIn('alex.dalgleishmorel@gmail.com');
    expect(await screen.findByText('Demo Site')).toBeTruthy();
    // The Home page's seeded projectGrid block renders from the registry (scope past the add chip).
    expect(screen.getByText('Project grid', { selector: '.blockcard__type' })).toBeTruthy();
  });

  it('adds a block from the registry and saves successfully', async () => {
    render(<App />);
    await signIn('alex.dalgleishmorel@gmail.com');
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
    await signIn('alex.dalgleishmorel@gmail.com');
    await screen.findByText('Demo Site');

    fireEvent.click(screen.getByRole('button', { name: /About \/about/i }));
    // About page's richText block card (scope past the add chip of the same name).
    expect(screen.getByText('Rich text', { selector: '.blockcard__type' })).toBeTruthy();
  });
});
