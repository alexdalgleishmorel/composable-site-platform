import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Site } from './App';
import { alexSeed } from './seed';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Site content={alexSeed} />
    </MemoryRouter>,
  );
}

describe('alex bundle', () => {
  it('renders the brand and the project carousel on /', () => {
    renderAt('/');
    expect(screen.getByText('Alex Dalgleish-Morel')).toBeTruthy();
    expect(screen.getByText('Full Stack Developer')).toBeTruthy();
    // The carousel renders the project name (plus a clone for wrap-around).
    expect(screen.getAllByText('Expense Visualizer').length).toBeGreaterThan(0);
  });

  it('renders the about page bio and external links', () => {
    renderAt('/about');
    expect(screen.getByText(/data visualization/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /GitHub/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /LinkedIn/i })).toBeTruthy();
  });

  it('opens a shareable project detail at /projects/:id', () => {
    renderAt('/projects/mortgage');
    expect(screen.getByRole('heading', { name: /Mortgage Visualization App/i })).toBeTruthy();
    expect(screen.getByText(/new or prospective homeowners/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Try it/i })).toBeTruthy();
  });
});
