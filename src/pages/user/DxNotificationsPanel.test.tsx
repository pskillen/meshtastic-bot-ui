import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { DxNotificationsPanel } from '@/pages/user/DxNotificationsPanel';
import {
  getDxNotificationSettingsSaveErrorMessage,
  useDxNotificationSettings,
  usePatchDxNotificationSettings,
} from '@/hooks/api/useDxMonitoring';
import {
  DX_NOTIFICATION_CATEGORY_ORDER,
  type DxNotificationCategoryValue,
  type DxNotificationSettings,
} from '@/lib/models';

const toastError = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: vi.fn(),
  },
}));

const { useDxNotificationSettingsMock, usePatchDxNotificationSettingsMock } = vi.hoisted(() => ({
  useDxNotificationSettingsMock: vi.fn(),
  usePatchDxNotificationSettingsMock: vi.fn(),
}));

vi.mock('@/hooks/api/useDxMonitoring', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/api/useDxMonitoring')>('@/hooks/api/useDxMonitoring');
  return {
    ...actual,
    useDxNotificationSettings: useDxNotificationSettingsMock,
    usePatchDxNotificationSettings: usePatchDxNotificationSettingsMock,
  };
});

function baseSettings(
  overrides: Partial<{
    enabled: boolean;
    all_categories: boolean;
    categories: DxNotificationCategoryValue[];
    discord: { status: 'verified' | 'not_linked' | 'needs_relink'; can_receive_dms: boolean };
  }> = {}
): DxNotificationSettings {
  return {
    enabled: false,
    all_categories: true,
    categories: [...DX_NOTIFICATION_CATEGORY_ORDER],
    discord: { status: 'verified' as const, can_receive_dms: true },
    ...overrides,
  };
}

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DxNotificationsPanel />
    </QueryClientProvider>
  );
}

describe('getDxNotificationSettingsSaveErrorMessage', () => {
  it('returns API detail for NEEDS_DISCORD_VERIFICATION', () => {
    const err = new AxiosError('Request failed');
    err.response = {
      status: 400,
      data: { code: 'NEEDS_DISCORD_VERIFICATION', detail: 'Connect Discord in your profile.' },
    } as AxiosError['response'];
    expect(getDxNotificationSettingsSaveErrorMessage(err)).toBe('Connect Discord in your profile.');
  });
});

describe('DxNotificationsPanel', () => {
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    usePatchDxNotificationSettingsMock.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof usePatchDxNotificationSettings>);
  });

  it('shows verified Discord readiness and allows the main toggle', () => {
    useDxNotificationSettingsMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: baseSettings({ enabled: false, discord: { status: 'verified', can_receive_dms: true } }),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDxNotificationSettings>);
    renderPanel();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    const mainSwitch = screen.getByRole('switch', { name: /DX direct messages/i });
    expect(mainSwitch).not.toBeDisabled();
  });

  it('shows not_linked guidance and disables opt-in', () => {
    useDxNotificationSettingsMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: baseSettings({ discord: { status: 'not_linked', can_receive_dms: false } }),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDxNotificationSettings>);
    renderPanel();
    expect(screen.getByText(/Link Discord first/i)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /DX direct messages/i })).toBeDisabled();
  });

  it('shows needs_relink alert', () => {
    useDxNotificationSettingsMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: baseSettings({ discord: { status: 'needs_relink', can_receive_dms: false } }),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDxNotificationSettings>);
    renderPanel();
    expect(screen.getByText(/Discord needs a refresh/i)).toBeInTheDocument();
  });

  it('sends all_categories true when turning on the all-types switch', async () => {
    const user = userEvent.setup();
    useDxNotificationSettingsMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: baseSettings({
        enabled: true,
        all_categories: false,
        categories: ['new_distant_node', 'returned_dx_node'],
      }),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDxNotificationSettings>);
    renderPanel();
    const allSwitch = screen.getByRole('switch', { name: /All notification types/i });
    await user.click(allSwitch);
    expect(mutate).toHaveBeenCalledWith({ all_categories: true }, expect.any(Object));
  });

  it('sends explicit categories when turning off all-types', async () => {
    const user = userEvent.setup();
    useDxNotificationSettingsMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: baseSettings({
        enabled: true,
        all_categories: true,
        categories: [...DX_NOTIFICATION_CATEGORY_ORDER],
      }),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDxNotificationSettings>);
    renderPanel();
    const allSwitch = screen.getByRole('switch', { name: /All notification types/i });
    await user.click(allSwitch);
    expect(mutate).toHaveBeenCalledWith(
      { all_categories: false, categories: [...DX_NOTIFICATION_CATEGORY_ORDER] },
      expect.any(Object)
    );
  });

  it('sends category list when toggling a checkbox off', async () => {
    const user = userEvent.setup();
    useDxNotificationSettingsMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: baseSettings({
        enabled: true,
        all_categories: false,
        categories: ['new_distant_node', 'returned_dx_node', 'distant_observation'],
      }),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDxNotificationSettings>);
    renderPanel();
    await user.click(screen.getByLabelText(/Returned DX node/i));
    expect(mutate).toHaveBeenCalledWith(
      { all_categories: false, categories: ['new_distant_node', 'distant_observation'] },
      expect.any(Object)
    );
  });

  it('shows NEEDS_DISCORD_VERIFICATION message when the mutation fails', async () => {
    const user = userEvent.setup();
    const err = new AxiosError('bad');
    err.response = {
      status: 400,
      data: { code: 'NEEDS_DISCORD_VERIFICATION', detail: 'Verify Discord first.' },
    } as AxiosError['response'];
    mutate.mockImplementation((_body, opts) => {
      (opts as { onError?: (e: unknown) => void })?.onError?.(err);
    });
    useDxNotificationSettingsMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: baseSettings({
        enabled: false,
        discord: { status: 'verified', can_receive_dms: true },
      }),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDxNotificationSettings>);
    renderPanel();
    await user.click(screen.getByRole('switch', { name: /DX direct messages/i }));
    expect(toastError).toHaveBeenCalledWith('Verify Discord first.');
  });
});
