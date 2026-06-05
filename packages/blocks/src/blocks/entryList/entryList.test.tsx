import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderEditForm } from '../../testing/renderEditForm';
import { entryList } from './index';
import { entryListDefault, entryListSchema } from './schema';

describe('entryList schema', () => {
  it('accepts the default and populated entries', () => {
    expect(entryListSchema.safeParse(entryListDefault()).success).toBe(true);
    expect(
      entryListSchema.safeParse({
        heading: 'selected works',
        entries: [{ year: '2024', title: 'Quiet Furniture', subtitle: 'Studio West' }],
      }).success,
    ).toBe(true);
  });

  it('requires entries to be an array', () => {
    expect(entryListSchema.safeParse({ entries: 'nope' }).success).toBe(false);
  });
});

describe('entryList EditForm', () => {
  it('sets a heading and adds an entry', () => {
    const ui = renderEditForm(entryList.EditForm, entryListDefault());

    fireEvent.change(screen.getByPlaceholderText('e.g. selected works'), {
      target: { value: 'press / writing' },
    });
    fireEvent.click(screen.getByText('+ entry'));
    fireEvent.change(screen.getByPlaceholderText('2024'), { target: { value: '2023' } });
    fireEvent.change(screen.getByPlaceholderText('Entry title'), {
      target: { value: 'Apartamento' },
    });

    expect(ui.data().heading).toBe('press / writing');
    expect(ui.data().entries).toEqual([{ year: '2023', title: 'Apartamento' }]);
    expect(entryListSchema.safeParse(ui.data()).success).toBe(true);
  });
});
