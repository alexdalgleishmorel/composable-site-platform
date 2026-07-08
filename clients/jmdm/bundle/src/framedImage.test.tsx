import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FramedImg, frameStyle, renderMap } from './renderers';

describe('framed images (aspect ratio + focal point)', () => {
  it('positions an object-form image by its focal point', () => {
    const { container } = render(
      <FramedImg
        image={{ url: 'https://cdn.example/x.png', aspectRatio: '1:1', focalX: 20, focalY: 80 }}
        alt="x"
      />,
    );
    const img = container.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('https://cdn.example/x.png');
    expect(img.style.objectPosition).toBe('20% 80%');
  });

  it('renders a legacy bare-URL string centred (no data loss)', () => {
    const { container } = render(<FramedImg image="https://cdn.example/legacy.png" alt="x" />);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('https://cdn.example/legacy.png');
    expect(img.style.objectPosition).toBe('50% 50%');
  });

  it('frameStyle gives the per-image aspect ratio, the 4:5 default, or none', () => {
    expect(frameStyle({ url: 'https://cdn.example/x.png', aspectRatio: '3:2' })).toEqual({
      aspectRatio: '3 / 2',
    });
    expect(frameStyle('https://cdn.example/legacy.png')).toEqual({ aspectRatio: '4 / 5' });
    expect(frameStyle(undefined)).toBeUndefined();
  });
});

describe('image zoom (scale-then-pan)', () => {
  it('applies a scale transform anchored at the focal point when zoomed', () => {
    const { container } = render(
      <FramedImg
        image={{ url: 'https://cdn.example/x.png', focalX: 30, focalY: 70, zoom: 150 }}
        alt="x"
      />,
    );
    const img = container.querySelector('img')!;
    expect(img.style.transform).toBe('scale(1.5)');
    expect(img.style.transformOrigin).toBe('30% 70%');
  });

  it('omits the transform entirely at zoom 100 (default/legacy images)', () => {
    const { container } = render(<FramedImg image="https://cdn.example/legacy.png" alt="x" />);
    const img = container.querySelector('img')!;
    expect(img.style.transform).toBe('');
  });

  it('applies zoom to the About page image too', () => {
    const RichText = renderMap.richText!;
    const { container } = render(
      <RichText
        data={{
          paragraphs: [],
          image: { url: 'https://cdn.example/about.png', focalX: 40, focalY: 60, zoom: 200 },
        }}
      />,
    );
    const img = container.querySelector('img')!;
    expect(img.style.transform).toBe('scale(2)');
    expect(img.style.transformOrigin).toBe('40% 60%');
    // The wrapper (not the img) clips the zoomed-in image to the frame.
    const wrapper = img.parentElement!;
    expect(wrapper.style.overflow).toBe('hidden');
  });
});
