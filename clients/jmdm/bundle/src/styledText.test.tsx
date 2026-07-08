import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { hasText, StyledP } from './renderers';

describe('StyledP', () => {
  it('renders a legacy plain-string value unstyled', () => {
    const { container } = render(<StyledP text="Hello there" />);
    const p = container.querySelector('p')!;
    expect(p.textContent).toBe('Hello there');
    expect(p.style.fontWeight).toBe('');
    expect(p.style.fontStyle).toBe('');
  });

  it('applies bold via font-weight', () => {
    const { container } = render(<StyledP text={{ text: 'Bold text', style: 'bold' }} />);
    const p = container.querySelector('p')!;
    expect(p.style.fontWeight).toBe('700');
    expect(p.style.fontStyle).toBe('');
  });

  it('applies italic via font-style', () => {
    const { container } = render(<StyledP text={{ text: 'Italic text', style: 'italic' }} />);
    const p = container.querySelector('p')!;
    expect(p.style.fontStyle).toBe('italic');
    expect(p.style.fontWeight).toBe('');
  });

  it('passes through a className (e.g. for the product description)', () => {
    const { container } = render(<StyledP text="x" className="product__desc" />);
    expect(container.querySelector('p.product__desc')).toBeTruthy();
  });
});

describe('hasText', () => {
  it('is false for undefined, an empty string, and an empty styled object', () => {
    expect(hasText(undefined)).toBe(false);
    expect(hasText('')).toBe(false);
    expect(hasText({ text: '', style: 'bold' })).toBe(false); // truthy object, empty text
  });

  it('is true for any non-empty text, in either shape', () => {
    expect(hasText('hi')).toBe(true);
    expect(hasText({ text: 'hi', style: 'italic' })).toBe(true);
  });
});
