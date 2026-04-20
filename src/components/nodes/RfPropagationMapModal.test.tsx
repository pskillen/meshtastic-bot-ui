import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RfPropagationMapModal } from './RfPropagationMapModal';

const useRfPropagation = vi.fn();
vi.mock('@/hooks/api/useRfPropagation', () => ({
  useRfProfile: vi.fn(),
  useRfPropagation: (...a: unknown[]) => useRfPropagation(...a),
  useUpdateRfProfile: vi.fn(),
  useRecomputeRfPropagation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

describe('RfPropagationMapModal', () => {
  it('shows empty state when propagation is not ready', () => {
    useRfPropagation.mockReturnValue({
      data: { status: 'pending', created_at: '2026-01-01' },
      isLoading: false,
    });
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <RfPropagationMapModal open onOpenChange={() => {}} nodeId={1} />
      </QueryClientProvider>
    );
    expect(screen.getByText(/map not rendered yet/i)).toBeInTheDocument();
  });
});
