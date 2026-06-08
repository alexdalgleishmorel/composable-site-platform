import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ColorField, move, SelectField, StringListField } from './fields';

describe('move()', () => {
  it('reorders without mutating, and is a no-op out of bounds', () => {
    const items = ['a', 'b', 'c'];
    expect(move(items, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(move(items, 2, 0)).toEqual(['c', 'a', 'b']);
    expect(move(items, 0, -1)).toBe(items); // no-op
    expect(items).toEqual(['a', 'b', 'c']); // original untouched
  });
});

function Harness() {
  const [values, setValues] = useState<string[]>(['one', 'two']);
  return (
    <>
      <StringListField
        label="Items"
        values={values}
        onChange={setValues}
        addLabel="item"
        placeholder="item"
      />
      <output data-testid="state">{values.join('|')}</output>
    </>
  );
}

describe('StringListField', () => {
  it('edits, adds, reorders, and removes entries', () => {
    render(<Harness />);
    const state = () => screen.getByTestId('state').textContent;

    fireEvent.change(screen.getAllByPlaceholderText('item')[0]!, { target: { value: 'ONE' } });
    expect(state()).toBe('ONE|two');

    fireEvent.click(screen.getByText('+ item'));
    expect(state()).toBe('ONE|two|');

    // Reorder is drag-only; the grip is keyboard-operable (↓ moves a row down).
    fireEvent.keyDown(screen.getAllByLabelText('Reorder item')[0]!, { key: 'ArrowDown' });
    expect(state()).toBe('two|ONE|');

    // Remove the last row.
    fireEvent.click(screen.getAllByTitle('Remove item')[2]!);
    expect(state()).toBe('two|ONE');
  });
});

describe('ColorField', () => {
  it('edits via the hex text input and the swatch, and falls back to black for invalid hex', () => {
    function H() {
      const [v, setV] = useState<string | undefined>('#38BDF8');
      return (
        <>
          <ColorField label="Accent" value={v} onChange={setV} />
          <output data-testid="c">{v}</output>
        </>
      );
    }
    const { container } = render(<H />);
    const c = () => screen.getByTestId('c').textContent;
    const swatch = container.querySelector('.csp-color-field__swatch') as HTMLInputElement;
    const hex = container.querySelector('.csp-color-field__hex') as HTMLInputElement;

    fireEvent.change(swatch, { target: { value: '#ff0000' } });
    expect(c()).toBe('#ff0000');

    fireEvent.change(hex, { target: { value: 'nope' } });
    expect(c()).toBe('nope');
    // Invalid hex → swatch shows black rather than crashing.
    expect(swatch.value).toBe('#000000');
  });
});

describe('SelectField', () => {
  it('renders bare and labelled options and reports the chosen value', () => {
    function H() {
      const [v, setV] = useState('a');
      return (
        <>
          <SelectField
            label="Motif"
            value={v}
            options={['a', 'b', { value: 'c', label: 'Cee' }]}
            onChange={setV}
          />
          <output data-testid="s">{v}</output>
        </>
      );
    }
    render(<H />);
    expect(screen.getByText('Cee')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c' } });
    expect(screen.getByTestId('s').textContent).toBe('c');
  });
});
