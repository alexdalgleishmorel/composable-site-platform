import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FramedImg, frameStyle } from './renderers';

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
