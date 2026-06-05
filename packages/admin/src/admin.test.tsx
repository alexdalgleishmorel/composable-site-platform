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
    // The Home page's seeded projectGrid block renders from the registry.
    expect(screen.getByText('Project grid')).toBeTruthy();
  });

  it('adds a block from the registry and saves successfully', async () => {
    render(<App />);
    await signIn('alex.dalgleishmorel@gmail.com');
    await screen.findByText('Demo Site');

    // No Shop block yet (the "+ Shop" add button text isn't an exact "Shop" match).
    expect(screen.queryByText('Shop')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '+ Shop' }));
    expect(screen.getByText('Shop')).toBeTruthy(); // block card header label

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('Saved.')).toBeTruthy());
  });

  it('switches pages via the page tabs', async () => {
    render(<App />);
    await signIn('alex.dalgleishmorel@gmail.com');
    await screen.findByText('Demo Site');

    fireEvent.click(screen.getByRole('button', { name: /About \/about/i }));
    expect(screen.getByText('Rich text')).toBeTruthy(); // About page's richText block
  });
});
