import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderEditForm } from '../../testing/renderEditForm';
import { noteCards } from './index';
import { noteCardsDefault, noteCardsSchema } from './schema';

describe('noteCards schema', () => {
  it('accepts the default and populated cards', () => {
    expect(noteCardsSchema.safeParse(noteCardsDefault()).success).toBe(true);
    expect(
      noteCardsSchema.safeParse({
        heading: 'currently',
        cards: [{ label: 'making', body: 'side tables' }],
      }).success,
    ).toBe(true);
  });

  it('requires each card to have label and body', () => {
    expect(noteCardsSchema.safeParse({ cards: [{ label: 'making' }] }).success).toBe(false);
  });
});

describe('noteCards EditForm', () => {
  it('adds a card and edits label + body', () => {
    const ui = renderEditForm(noteCards.EditForm, noteCardsDefault());

    fireEvent.click(screen.getByText('+ card'));
    fireEvent.change(screen.getByPlaceholderText('e.g. making'), { target: { value: 'reading' } });
    fireEvent.change(screen.getByPlaceholderText('Card text'), {
      target: { value: 'The Poetics of Space' },
    });

    expect(ui.data().cards).toEqual([{ label: 'reading', body: 'The Poetics of Space' }]);
    expect(noteCardsSchema.safeParse(ui.data()).success).toBe(true);
  });
});
