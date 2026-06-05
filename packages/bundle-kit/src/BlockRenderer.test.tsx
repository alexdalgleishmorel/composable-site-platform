import type { Block, Page } from '@csp/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BlockRenderer, PageRenderer, type RenderMap } from './BlockRenderer';

const renderers: RenderMap = {
  richText: ({ data }: { data: { heading?: string } }) => <h1>{data.heading}</h1>,
  shop: ({ data }: { data: { currency: string } }) => <span>shop:{data.currency}</span>,
};

const block = (over: Partial<Block>): Block => ({
  id: 'b',
  type: 'richText',
  data: {},
  order: 0,
  ...over,
});

describe('BlockRenderer', () => {
  it('renders the bespoke component mapped to the block type', () => {
    render(
      <BlockRenderer
        renderers={renderers}
        block={block({ type: 'richText', data: { heading: 'About' } })}
      />,
    );
    expect(screen.getByRole('heading', { name: 'About' })).toBeTruthy();
  });

  it('renders nothing for an unmapped block type', () => {
    const { container } = render(
      <BlockRenderer renderers={renderers} block={block({ type: 'mystery' })} />,
    );
    expect(container.innerHTML).toBe('');
  });
});

describe('PageRenderer', () => {
  it('renders blocks sorted by order', () => {
    const page: Page = {
      id: 'p',
      slug: '/',
      title: 'Home',
      blocks: [
        block({ id: '2', type: 'shop', data: { currency: 'CAD' }, order: 1 }),
        block({ id: '1', type: 'richText', data: { heading: 'First' }, order: 0 }),
      ],
    };
    const { container } = render(<PageRenderer renderers={renderers} page={page} />);
    expect(container.textContent).toBe('Firstshop:CAD'); // order 0 before order 1
  });
});
