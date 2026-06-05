import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { move, StringListField } from './fields';

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

    // Move the first row down.
    fireEvent.click(screen.getAllByTitle('Move down')[0]!);
    expect(state()).toBe('two|ONE|');

    // Remove the last row.
    fireEvent.click(screen.getAllByTitle('Remove')[2]!);
    expect(state()).toBe('two|ONE');
  });
});
