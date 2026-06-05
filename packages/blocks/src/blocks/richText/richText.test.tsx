import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderEditForm } from '../../testing/renderEditForm';
import { richText } from './index';
import { richTextDefault, richTextSchema } from './schema';

describe('richText schema', () => {
  it('accepts default data and a fully-populated block', () => {
    expect(richTextSchema.safeParse(richTextDefault()).success).toBe(true);
    expect(
      richTextSchema.safeParse({
        heading: 'About',
        paragraphs: ['one', 'two'],
        image: 'https://cdn.example.com/a.jpg',
      }).success,
    ).toBe(true);
  });

  it('rejects a non-array paragraphs and a non-URL image', () => {
    expect(richTextSchema.safeParse({ paragraphs: 'nope' }).success).toBe(false);
    expect(richTextSchema.safeParse({ paragraphs: [], image: 'not-a-url' }).success).toBe(false);
  });
});

describe('richText EditForm', () => {
  it('edits the heading and adds a paragraph, emitting valid data', () => {
    const ui = renderEditForm(richText.EditForm, richTextDefault());

    fireEvent.change(screen.getByPlaceholderText('Optional heading'), {
      target: { value: 'About' },
    });
    expect(ui.data().heading).toBe('About');

    fireEvent.click(screen.getByText('+ paragraph'));
    fireEvent.change(screen.getAllByPlaceholderText('A paragraph of text')[0]!, {
      target: { value: 'Hello' },
    });

    expect(ui.data().paragraphs.length).toBe(2);
    expect(ui.data().paragraphs[0]).toBe('Hello');
    expect(richTextSchema.safeParse(ui.data()).success).toBe(true);
  });

  it('clears the heading back to undefined when emptied', () => {
    const ui = renderEditForm(richText.EditForm, { heading: 'X', paragraphs: [''] });
    fireEvent.change(screen.getByPlaceholderText('Optional heading'), { target: { value: '' } });
    expect(ui.data().heading).toBeUndefined();
  });
});
