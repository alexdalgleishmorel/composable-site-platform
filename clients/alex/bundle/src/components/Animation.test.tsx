import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Animation } from './Animation';

// Stub the Lottie player — exercising its canvas/SVG rendering in jsdom is brittle and beside the
// point; we only need to prove the fetched JSON reaches it.
vi.mock('lottie-react', () => ({
  default: ({ animationData }: { animationData: unknown }) => (
    <div data-testid="lottie" data-loaded={animationData ? 'yes' : 'no'} />
  ),
}));

describe('Animation', () => {
  it('renders a built-in motif by key', () => {
    const { container } = render(
      <Animation animation={{ kind: 'builtin', key: 'pulse' }} accent="#000000" accent2="#ffffff" />,
    );
    expect(container.querySelector('.pulse')).toBeTruthy();
  });

  it('fetches an uploaded Lottie url and hands the JSON to the player', async () => {
    const json = { v: '5.7.4', layers: [] };
    global.fetch = vi
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve(json) }) as unknown as typeof fetch;

    render(
      <Animation
        animation={{ kind: 'lottie', url: 'https://cdn.example/a.json' }}
        accent="#000000"
        accent2="#ffffff"
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId('lottie').getAttribute('data-loaded')).toBe('yes'),
    );
    expect(global.fetch).toHaveBeenCalledWith('https://cdn.example/a.json');
  });
});
