import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TraceroutesLanding } from './TraceroutesLanding';

vi.mock('@/pages/traceroutes/TracerouteStatsPage', () => ({
  TracerouteStatsPage: () => <div data-testid="stats-page">Stats</div>,
}));

describe('TraceroutesLanding', () => {
  it('redirects legacy history query URLs to /traceroutes/history', () => {
    render(
      <MemoryRouter initialEntries={['/traceroutes?target_node=1']}>
        <Routes>
          <Route path="/traceroutes" element={<TraceroutesLanding />} />
          <Route path="/traceroutes/history" element={<div data-testid="history-page">History</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('history-page')).toBeInTheDocument();
  });

  it('renders stats page when there are no history filter query keys', () => {
    render(
      <MemoryRouter initialEntries={['/traceroutes']}>
        <Routes>
          <Route path="/traceroutes" element={<TraceroutesLanding />} />
          <Route path="/traceroutes/history" element={<div data-testid="history-page">History</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('stats-page')).toBeInTheDocument();
  });

  it('keeps stats page when only source_node is present (stats scope, not history redirect)', () => {
    render(
      <MemoryRouter initialEntries={['/traceroutes?source_node=42']}>
        <Routes>
          <Route path="/traceroutes" element={<TraceroutesLanding />} />
          <Route path="/traceroutes/history" element={<div data-testid="history-page">History</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('stats-page')).toBeInTheDocument();
    expect(screen.queryByTestId('history-page')).not.toBeInTheDocument();
  });

  it('still redirects when source_node is combined with a history-only key', () => {
    render(
      <MemoryRouter initialEntries={['/traceroutes?source_node=1&target_node=2']}>
        <Routes>
          <Route path="/traceroutes" element={<TraceroutesLanding />} />
          <Route path="/traceroutes/history" element={<div data-testid="history-page">History</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('history-page')).toBeInTheDocument();
  });
});
