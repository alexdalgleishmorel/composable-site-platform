import type { TenantContent } from '@csp/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Site } from './App';

const content = (): TenantContent => ({
  tenantId: 'jmdm.studio',
  siteMeta: { siteName: 'jmdm' },
  pages: [
    {
      id: 'home',
      slug: '/',
      title: 'Home',
      blocks: [
        {
          id: 'grid',
          type: 'projectGrid',
          order: 0,
          data: {
            projects: [
              {
                id: 'quiet-furniture',
                title: 'Quiet Furniture',
                images: [
                  'https://cdn.example/one.jpg',
                  'https://cdn.example/two.jpg',
                  'https://cdn.example/three.jpg',
                ],
                order: 0,
              },
              {
                id: 'many-images',
                title: 'Many Images',
                images: Array.from(
                  { length: 6 },
                  (_, i) => `https://cdn.example/many-${i + 1}.jpg`,
                ),
                order: 1,
              },
            ],
          },
        },
      ],
    },
    {
      id: 'shop-page',
      slug: '/shop',
      title: 'Shop',
      blocks: [
        {
          id: 'shop',
          type: 'shop',
          order: 0,
          data: {
            enabled: true,
            currency: 'CAD',
            items: [
              {
                id: 'lemon-bowl',
                name: 'Lemon Bowl',
                priceCents: 14000,
                images: ['https://cdn.example/bowl.jpg'],
                inStock: true,
                order: 0,
              },
            ],
          },
        },
      ],
    },
  ],
  updatedAt: '2026-07-01T00:00:00.000Z',
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Site content={content()} />
    </MemoryRouter>,
  );
}

describe('project detail — sub-image click swaps the main image', () => {
  it('shows the first image as the main image by default', () => {
    renderAt('/projects/quiet-furniture');
    const main = document.querySelector('.product__image-main img') as HTMLImageElement;
    expect(main.src).toBe('https://cdn.example/one.jpg');
  });

  it('clicking a thumbnail replaces the main image', () => {
    renderAt('/projects/quiet-furniture');
    const thumbs = document.querySelectorAll('.product__image-thumb');
    expect(thumbs).toHaveLength(3);

    fireEvent.click(thumbs[2]!);

    const main = document.querySelector('.product__image-main img') as HTMLImageElement;
    expect(main.src).toBe('https://cdn.example/three.jpg');
    expect(thumbs[2]!.className).toContain('product__image-thumb--active');
  });

  it('clicking the main image opens a fullscreen lightbox of the selected image', () => {
    renderAt('/projects/quiet-furniture');
    fireEvent.click(document.querySelectorAll('.product__image-thumb')[1]!); // select image two
    fireEvent.click(document.querySelector('.product__image-main')!);

    const lightboxImg = document.querySelector('.lightbox__img') as HTMLImageElement;
    expect(lightboxImg.src).toBe('https://cdn.example/two.jpg');
  });

  it('closes the lightbox via the close button, backdrop click, or Escape', async () => {
    renderAt('/projects/quiet-furniture');
    fireEvent.click(document.querySelector('.product__image-main')!);
    expect(document.querySelector('.lightbox')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => expect(document.querySelector('.lightbox')).toBeNull());

    fireEvent.click(document.querySelector('.product__image-main')!);
    fireEvent.click(document.querySelector('.lightbox')!); // backdrop, not the image itself
    await waitFor(() => expect(document.querySelector('.lightbox')).toBeNull());

    fireEvent.click(document.querySelector('.product__image-main')!);
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(document.querySelector('.lightbox')).toBeNull());
  });

  it('clicking the lightbox image itself does not close it', () => {
    renderAt('/projects/quiet-furniture');
    fireEvent.click(document.querySelector('.product__image-main')!);
    fireEvent.click(document.querySelector('.lightbox__img')!);
    expect(document.querySelector('.lightbox')).toBeTruthy();
  });

  const lightboxImg = () => (document.querySelector('.lightbox__img') as HTMLImageElement).src;

  it('ArrowRight / ArrowDown step to the next image and wrap past the last', () => {
    renderAt('/projects/quiet-furniture');
    fireEvent.click(document.querySelector('.product__image-main')!);
    expect(lightboxImg()).toBe('https://cdn.example/one.jpg');

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(lightboxImg()).toBe('https://cdn.example/two.jpg');

    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(lightboxImg()).toBe('https://cdn.example/three.jpg');

    fireEvent.keyDown(window, { key: 'ArrowRight' }); // wraps past the last image
    expect(lightboxImg()).toBe('https://cdn.example/one.jpg');
  });

  it('ArrowLeft / ArrowUp step to the previous image and wrap before the first', () => {
    renderAt('/projects/quiet-furniture');
    fireEvent.click(document.querySelector('.product__image-main')!);
    expect(lightboxImg()).toBe('https://cdn.example/one.jpg');

    fireEvent.keyDown(window, { key: 'ArrowLeft' }); // wraps before the first image
    expect(lightboxImg()).toBe('https://cdn.example/three.jpg');

    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(lightboxImg()).toBe('https://cdn.example/two.jpg');
  });

  it('keeps the main image and the active thumbnail in sync after keyboard navigation', () => {
    renderAt('/projects/quiet-furniture');
    fireEvent.click(document.querySelector('.product__image-main')!);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    const main = document.querySelector('.product__image-main img') as HTMLImageElement;
    expect(main.src).toBe('https://cdn.example/two.jpg');
    const thumbs = document.querySelectorAll('.product__image-thumb');
    expect(thumbs[1]!.className).toContain('product__image-thumb--active');
  });
});

describe('project detail — the thumbnail gallery is not capped at 4', () => {
  it('renders a thumbnail for every image, not just the first 4', () => {
    renderAt('/projects/many-images');
    expect(document.querySelectorAll('.product__image-thumb')).toHaveLength(6);
  });

  it('clicking a thumbnail past the 4th still swaps the main image', () => {
    renderAt('/projects/many-images');
    fireEvent.click(document.querySelectorAll('.product__image-thumb')[5]!);
    const main = document.querySelector('.product__image-main img') as HTMLImageElement;
    expect(main.src).toBe('https://cdn.example/many-6.jpg');
    expect(document.querySelectorAll('.product__image-thumb')[5]!.className).toContain(
      'product__image-thumb--active',
    );
  });

  it('arrow-key navigation in the lightbox still reaches images past the 4th', () => {
    renderAt('/projects/many-images');
    fireEvent.click(document.querySelector('.product__image-main')!); // opens on image 1
    for (let i = 0; i < 5; i++) fireEvent.keyDown(window, { key: 'ArrowRight' }); // -> image 6
    const lightboxImg = document.querySelector('.lightbox__img') as HTMLImageElement;
    expect(lightboxImg.src).toBe('https://cdn.example/many-6.jpg');
  });
});

describe('shop item detail — main image opens a fullscreen lightbox', () => {
  it('clicking the main image shows it in the lightbox', () => {
    renderAt('/shop/lemon-bowl');
    fireEvent.click(document.querySelector('.product__image-main')!);
    const lightboxImg = document.querySelector('.lightbox__img') as HTMLImageElement;
    expect(lightboxImg.src).toBe('https://cdn.example/bowl.jpg');
  });

  it('arrow keys are a no-op with a single image (wraps to itself)', () => {
    renderAt('/shop/lemon-bowl');
    fireEvent.click(document.querySelector('.product__image-main')!);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    const lightboxImg = document.querySelector('.lightbox__img') as HTMLImageElement;
    expect(lightboxImg.src).toBe('https://cdn.example/bowl.jpg');
    expect(document.querySelector('.lightbox')).toBeTruthy();
  });
});
