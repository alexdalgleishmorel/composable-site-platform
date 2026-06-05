import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Site } from './App';
import { jmdmSeed } from './seed';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Site content={jmdmSeed} />
    </MemoryRouter>,
  );
}

describe('jmdm bundle', () => {
  it('renders the home index of works with project tiles', () => {
    renderAt('/');
    expect(screen.getByText(/index of works/i)).toBeTruthy();
    expect(screen.getByText('Quiet Furniture')).toBeTruthy();
    expect(screen.getByText('Telephone Table')).toBeTruthy();
  });

  it('hides the shop link in nav while the shop is beta (disabled)', () => {
    renderAt('/');
    // nav is rendered twice (masthead + mini-nav), so query *all*.
    expect(screen.queryAllByRole('link', { name: 'shop' })).toHaveLength(0);
    expect(screen.getAllByRole('link', { name: 'about' }).length).toBeGreaterThan(0);
  });

  it('renders the about page: bio, CV, and currently', () => {
    renderAt('/about');
    expect(screen.getByText(/designer in Harbord Village/i)).toBeTruthy();
    expect(screen.getByText('selected works · 2020 — present')).toBeTruthy();
    expect(screen.getByText('The Poetics of Space, Bachelard. For the third time.')).toBeTruthy();
  });

  it('shows the beta "coming soon" shop with the studio notes', () => {
    renderAt('/shop');
    expect(screen.getByText(/coming soon/i)).toBeTruthy();
    expect(screen.getByText('Shipping')).toBeTruthy();
  });

  it('renders a project detail page by slug', () => {
    renderAt('/projects/telephone-table');
    expect(screen.getByRole('heading', { name: /Telephone Table/i })).toBeTruthy();
    expect(screen.getByText(/A small table for a hallway/i)).toBeTruthy();
  });

  it('renders a shop item detail with a formatted CAD price', () => {
    renderAt('/shop/lemon-bowl');
    expect(screen.getByRole('heading', { name: /Lemon Bowl/i })).toBeTruthy();
    expect(screen.getByText('$140')).toBeTruthy();
    expect(screen.getAllByText('CAD').length).toBeGreaterThan(0);
  });
});
