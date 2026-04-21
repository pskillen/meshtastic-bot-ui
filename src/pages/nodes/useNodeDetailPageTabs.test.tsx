import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useNodeDetailPageTabs } from './useNodeDetailPageTabs';

function TabHarness() {
  const { activeTab, onTabChange } = useNodeDetailPageTabs();
  return (
    <div>
      <span data-testid="active-tab">{activeTab}</span>
      <button type="button" onClick={() => onTabChange('map')}>
        go map
      </button>
      <button type="button" onClick={() => onTabChange('overview')}>
        go overview
      </button>
    </div>
  );
}

function SearchEcho() {
  const { search } = useLocation();
  return <span data-testid="url-search">{search}</span>;
}

function HarnessRoute() {
  return (
    <>
      <TabHarness />
      <SearchEcho />
    </>
  );
}

describe('useNodeDetailPageTabs', () => {
  it('reads tab from search params', () => {
    render(
      <MemoryRouter initialEntries={['/nodes/42?tab=statistics']}>
        <Routes>
          <Route path="/nodes/:id" element={<HarnessRoute />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('active-tab')).toHaveTextContent('statistics');
    expect(screen.getByTestId('url-search')).toHaveTextContent('?tab=statistics');
  });

  it('removes invalid tab from URL', async () => {
    render(
      <MemoryRouter initialEntries={['/nodes/1?tab=not-a-tab']}>
        <Routes>
          <Route path="/nodes/:id" element={<HarnessRoute />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('active-tab')).toHaveTextContent('overview');
    await waitFor(() => {
      expect(screen.getByTestId('url-search')).toHaveTextContent('');
    });
  });

  it('onTabChange updates search params', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/nodes/7']}>
        <Routes>
          <Route path="/nodes/:id" element={<HarnessRoute />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('active-tab')).toHaveTextContent('overview');
    expect(screen.getByTestId('url-search')).toHaveTextContent('');
    await user.click(screen.getByRole('button', { name: 'go map' }));
    expect(screen.getByTestId('url-search')).toHaveTextContent('?tab=map');
    await user.click(screen.getByRole('button', { name: 'go overview' }));
    expect(screen.getByTestId('url-search')).toHaveTextContent('');
  });
});
