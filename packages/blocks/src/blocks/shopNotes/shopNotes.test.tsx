import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderEditForm } from '../../testing/renderEditForm';
import { shopNotes } from './index';
import { shopNotesDefault, shopNotesSchema } from './schema';

describe('shopNotes schema', () => {
  it('accepts the default and populated notes', () => {
    expect(shopNotesSchema.safeParse(shopNotesDefault()).success).toBe(true);
    expect(
      shopNotesSchema.safeParse({
        notes: [{ heading: 'Shipping', body: 'Ships from the studio.' }],
      }).success,
    ).toBe(true);
  });

  it('requires each note to have heading and body', () => {
    expect(shopNotesSchema.safeParse({ notes: [{ heading: 'Shipping' }] }).success).toBe(false);
  });
});

describe('shopNotes EditForm', () => {
  it('adds a note and edits heading + body', () => {
    const ui = renderEditForm(shopNotes.EditForm, shopNotesDefault());

    fireEvent.click(screen.getByText('+ note'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Shipping'), {
      target: { value: 'Note from the studio' },
    });
    fireEvent.change(screen.getByPlaceholderText('Note text'), {
      target: { value: 'Editions are kept small.' },
    });

    expect(ui.data().notes).toEqual([
      { heading: 'Note from the studio', body: 'Editions are kept small.' },
    ]);
    expect(shopNotesSchema.safeParse(ui.data()).success).toBe(true);
  });
});
