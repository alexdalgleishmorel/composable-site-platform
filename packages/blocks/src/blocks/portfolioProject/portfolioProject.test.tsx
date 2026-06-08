import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderEditForm } from '../../testing/renderEditForm';
import { portfolioProject } from './index';
import {
  portfolioProjectsDefault,
  portfolioProjectsSchema,
  type PortfolioProject,
} from './schema';

const project = (over: Partial<PortfolioProject> = {}): PortfolioProject => ({
  id: 'p1',
  name: 'Expense Visualizer',
  headline: 'Where is my money going?',
  description: 'An AI-powered expense tracker.',
  links: { github: 'https://github.com/x/y' },
  accent: '#38BDF8',
  accent2: '#2DD4BF',
  animation: { kind: 'builtin', key: 'expense-visualizer' },
  order: 0,
  ...over,
});

describe('portfolioProject schema', () => {
  it('accepts the empty default and both animation kinds', () => {
    expect(portfolioProjectsSchema.safeParse(portfolioProjectsDefault()).success).toBe(true);
    expect(portfolioProjectsSchema.safeParse({ projects: [project()] }).success).toBe(true);
    expect(
      portfolioProjectsSchema.safeParse({
        projects: [project({ animation: { kind: 'lottie', url: 'https://cdn.example/a.json' } })],
      }).success,
    ).toBe(true);
  });

  it('rejects bad hex, bad link urls, an unknown motif key, and a non-url lottie', () => {
    expect(portfolioProjectsSchema.safeParse({ projects: [project({ accent: 'blue' })] }).success).toBe(
      false,
    );
    expect(
      portfolioProjectsSchema.safeParse({ projects: [project({ links: { github: 'nope' } })] })
        .success,
    ).toBe(false);
    expect(
      portfolioProjectsSchema.safeParse({
        projects: [project({ animation: { kind: 'builtin', key: 'made-up' } as never })],
      }).success,
    ).toBe(false);
    expect(
      portfolioProjectsSchema.safeParse({
        projects: [project({ animation: { kind: 'lottie', url: 'not-a-url' } })],
      }).success,
    ).toBe(false);
  });
});

describe('portfolioProject EditForm', () => {
  it('adds a project with order 0, a stable id, and a valid default, then edits the name', () => {
    const ui = renderEditForm(portfolioProject.EditForm, portfolioProjectsDefault());

    fireEvent.click(screen.getByText('+ project'));
    expect(ui.data().projects).toHaveLength(1);
    expect(ui.data().projects[0]!.order).toBe(0);
    expect(ui.data().projects[0]!.id).toBeTruthy();
    expect(portfolioProjectsSchema.safeParse(ui.data()).success).toBe(true);

    fireEvent.change(screen.getByPlaceholderText('Project name'), {
      target: { value: 'Mortgage Visualization' },
    });
    expect(ui.data().projects[0]!.name).toBe('Mortgage Visualization');
  });

  it('switches the animation source from built-in motif to an uploaded Lottie', () => {
    const ui = renderEditForm(portfolioProject.EditForm, { projects: [project()] });

    // The source <select> is the first combobox; choosing lottie swaps the union arm.
    fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: 'lottie' } });
    expect(ui.data().projects[0]!.animation.kind).toBe('lottie');

    // The animation URL field now drives the lottie url.
    fireEvent.change(screen.getByPlaceholderText('https://… .json'), {
      target: { value: 'https://cdn.example/anim.json' },
    });
    const anim = ui.data().projects[0]!.animation;
    expect(anim).toEqual({ kind: 'lottie', url: 'https://cdn.example/anim.json' });
  });

  it('reindexes order when projects are reordered', () => {
    const ui = renderEditForm(portfolioProject.EditForm, {
      projects: [project({ id: 'a', name: 'A' }), project({ id: 'b', name: 'B', order: 1 })],
    });

    fireEvent.click(screen.getAllByTitle('Move project down')[0]!); // move A below B
    expect(ui.data().projects.map((p) => p.name)).toEqual(['B', 'A']);
    expect(ui.data().projects.map((p) => p.order)).toEqual([0, 1]);
  });
});
