import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { DxEventListItem } from '@/lib/models';
import DxMonitoringPage from './DxMonitoringPage';

const getCurrentUser = vi.fn();

vi.mock('@/lib/auth/authService', () => ({
  authService: {
    getCurrentUser: () => getCurrentUser(),
  },
}));

const emptyPage = { count: 0, next: null, previous: null, results: [] as DxEventListItem[] };

vi.mock('@/hooks/api/useDxMonitoring', () => ({
  useDxEvents: vi.fn(() => ({
    isLoading: false,
    isSuccess: true,
    isError: false,
    error: null,
    data: emptyPage,
  })),
  useDxActiveEventCount: vi.fn(() => ({ isLoading: false, data: 0 })),
  useDxRecentEventCount: vi.fn(() => ({ isLoading: false, data: 0 })),
  useDxEventDetail: vi.fn(() => ({ isLoading: false, isSuccess: false, data: undefined })),
  useDxNodeExclusionMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DxMonitoringPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DxMonitoringPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockReturnValue({ id: 1, username: 'staff', is_staff: true });
  });

  it('shows staff-only message when user is not staff', () => {
    getCurrentUser.mockReturnValue({ id: 2, username: 'user', is_staff: false });
    renderPage();
    expect(screen.getByText('DX monitoring')).toBeInTheDocument();
    expect(screen.getByText(/staff only/i)).toBeInTheDocument();
  });

  it('renders dashboard heading for staff', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /DX monitoring/i })).toBeInTheDocument();
    expect(screen.getByText(/Detection events and evidence/i)).toBeInTheDocument();
  });
});
