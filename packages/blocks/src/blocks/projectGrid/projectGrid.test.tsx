import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderEditForm } from '../../testing/renderEditForm';
import { projectGrid } from './index';
import { projectGridDefault, projectGridSchema, type Project } from './schema';

const project = (over: Partial<Project> = {}): Project => ({
  id: 'p1',
  title: 'Quiet Furniture',
  images: ['https://cdn.example.com/01.jpg'],
  order: 0,
  ...over,
});

describe('projectGrid schema', () => {
  it('accepts the empty default and a populated project', () => {
    expect(projectGridSchema.safeParse(projectGridDefault()).success).toBe(true);
    expect(
      projectGridSchema.safeParse({ projects: [project({ summary: 'x', tags: ['wood'] })] })
        .success,
    ).toBe(true);
  });

  it('requires images to be an array of URLs', () => {
    expect(
      projectGridSchema.safeParse({ projects: [project({ images: ['not-a-url'] })] }).success,
    ).toBe(false);
    expect(
      projectGridSchema.safeParse({ projects: [{ id: 'p', title: 't', order: 0 }] }).success,
    ).toBe(false);
  });
});

describe('projectGrid EditForm', () => {
  it('adds a project with order 0 and a stable id, then edits its title', () => {
    const ui = renderEditForm(projectGrid.EditForm, projectGridDefault());

    fireEvent.click(screen.getByText('+ project'));
    expect(ui.data().projects).toHaveLength(1);
    expect(ui.data().projects[0]!.order).toBe(0);
    expect(ui.data().projects[0]!.id).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Project title'), {
      target: { value: 'Telephone Table' },
    });
    expect(ui.data().projects[0]!.title).toBe('Telephone Table');
    expect(projectGridSchema.safeParse(ui.data()).success).toBe(true);
  });

  it('reindexes order when projects are reordered', () => {
    const ui = renderEditForm(projectGrid.EditForm, {
      projects: [project({ id: 'a', title: 'A' }), project({ id: 'b', title: 'B', order: 1 })],
    });

    fireEvent.click(screen.getAllByTitle('Move project down')[0]!); // move A below B
    const titles = ui.data().projects.map((p) => p.title);
    const orders = ui.data().projects.map((p) => p.order);
    expect(titles).toEqual(['B', 'A']);
    expect(orders).toEqual([0, 1]); // order tracks position
  });
});
