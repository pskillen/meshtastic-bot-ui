import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserPage } from '@/pages/user/UserPage';
import { DX_NOTIFICATION_CATEGORY_ORDER } from '@/lib/models';

vi.mock('@/providers/ConfigProvider', () => ({
  useConfig: () => ({ apis: { meshBot: { baseUrl: 'https://api.example' } } }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/lib/auth/authService', () => ({
  authService: {
    getUserDetails: vi.fn().mockResolvedValue({
      username: 'tester',
      email: 'tester@example.com',
      display_name: 'Tester',
      first_name: '',
    }),
    updateUserDetails: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock('@/hooks/api/useDiscordNotifications', () => ({
  useDiscordNotificationPrefs: () => ({
    isLoading: false,
    error: null,
    data: { discord_linked: true, discord_notify_verified: true },
    refetch: vi.fn(),
  }),
  usePatchDiscordNotificationPrefs: () => ({ mutate: vi.fn(), isPending: false }),
  usePostDiscordNotificationTest: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/api/useDxMonitoring', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/api/useDxMonitoring')>('@/hooks/api/useDxMonitoring');
  return {
    ...actual,
    useDxNotificationSettings: () => ({
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      data: {
        enabled: false,
        all_categories: true,
        categories: [...DX_NOTIFICATION_CATEGORY_ORDER],
        discord: { status: 'verified', can_receive_dms: true },
      },
    }),
    usePatchDxNotificationSettings: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

function renderUserPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <UserPage />
    </QueryClientProvider>
  );
}

describe('UserPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Discord setup and DX Discord notification panels', async () => {
    renderUserPage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'User Profile' })).toBeInTheDocument();
    });
    expect(screen.getByText('Discord')).toBeInTheDocument();
    expect(screen.getByText('DX Discord notifications')).toBeInTheDocument();
  });
});
