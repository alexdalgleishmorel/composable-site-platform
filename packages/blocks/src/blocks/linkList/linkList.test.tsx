import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderEditForm } from '../../testing/renderEditForm';
import { linkList } from './index';
import { linkListDefault, linkListSchema } from './schema';

describe('linkList schema', () => {
  it('accepts the empty default and a populated list', () => {
    expect(linkListSchema.safeParse(linkListDefault()).success).toBe(true);
    expect(
      linkListSchema.safeParse({
        heading: 'elsewhere',
        links: [{ label: 'GitHub', url: 'https://github.com/x' }],
      }).success,
    ).toBe(true);
  });

  it('requires each link url to be a valid URL', () => {
    expect(
      linkListSchema.safeParse({ links: [{ label: 'GitHub', url: 'not-a-url' }] }).success,
    ).toBe(false);
  });
});

describe('linkList EditForm', () => {
  it('adds a link and edits its label and url', () => {
    const ui = renderEditForm(linkList.EditForm, linkListDefault());

    fireEvent.click(screen.getByText('+ link'));
    expect(ui.data().links).toHaveLength(1);

    fireEvent.change(screen.getByPlaceholderText('GitHub'), { target: { value: 'Resume' } });
    fireEvent.change(screen.getByPlaceholderText('https://…'), {
      target: { value: 'https://example.com/resume.pdf' },
    });
    expect(ui.data().links[0]).toEqual({ label: 'Resume', url: 'https://example.com/resume.pdf' });
    expect(linkListSchema.safeParse(ui.data()).success).toBe(true);
  });
});
