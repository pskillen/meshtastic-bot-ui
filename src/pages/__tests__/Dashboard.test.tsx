import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import { useNodes } from '@/lib/hooks/useNodes';
import { usePacketStats } from '@/lib/hooks/usePacketStats';

// Mock the hooks
vi.mock('@/lib/hooks/useNodes');
vi.mock('@/lib/hooks/usePacketStats');

describe('Dashboard', () => {
  // Mock data
  const mockNodes = [
    {
      id: 1,
      short_name: 'Node1',
      long_name: 'Test Node 1',
      last_heard: new Date().toISOString(),
      latest_device_metrics: {
        battery_level: 85,
      },
    },
  ];

  const mockPacketStats = {
    hourly_stats: [
      {
        timestamp: new Date().toISOString(),
        total_packets: 100,
      },
    ],
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock implementations
    (useNodes as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      nodes: mockNodes,
      isLoading: false,
    });

    (usePacketStats as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockPacketStats,
    });
  });

  it('renders the dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText('Online Nodes')).toBeInTheDocument();
  });

  it('displays loading state when nodes are loading', () => {
    (useNodes as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      nodes: [],
      isLoading: true,
    });

    render(<Dashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays the correct number of online nodes', () => {
    render(<Dashboard />);
    expect(screen.getByText('1 nodes active in last 2 hours')).toBeInTheDocument();
  });

  it('displays node information when loaded', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Node1')).toBeInTheDocument();
    expect(screen.getByText('Test Node 1')).toBeInTheDocument();
    expect(screen.getByText('Battery: 85%')).toBeInTheDocument();
  });
}); 