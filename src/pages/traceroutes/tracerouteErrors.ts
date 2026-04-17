import { AxiosError } from 'axios';

/**
 * Turn a traceroute trigger API error into a user-facing message.
 *
 * The API client transforms errors into `{ message, status, data }` shape where
 * `data` is the response body; this helper falls back to AxiosError fields so
 * it works regardless of which layer throws.
 */
export function getTracerouteErrorMessage(error: unknown): string {
  const err = error as { status?: number; data?: { detail?: string }; message?: string };
  const detail =
    err.data?.detail ??
    (error instanceof AxiosError ? (error.response?.data as { detail?: string })?.detail : undefined);
  const status = err.status ?? (error instanceof AxiosError ? error.response?.status : undefined);

  if (typeof detail === 'string') {
    if (status === 429 || detail.toLowerCase().includes('rate limited')) {
      return detail.includes('Try again in')
        ? detail
        : 'Traceroute rate limited. The radio needs at least 30 seconds between traceroutes. Please try again shortly.';
    }
    if (detail.toLowerCase().includes('allow_auto_traceroute')) {
      return "This node doesn't allow traceroutes. Enable it in the node settings.";
    }
    if (detail.toLowerCase().includes('no recent packet ingestion')) {
      return 'That source is not reporting packets right now (monitor offline or quiet). Pick another source or wait for the bot to ingest again.';
    }
    return detail;
  }
  return err.message ?? (error instanceof Error ? error.message : 'Failed to trigger traceroute. Please try again.');
}
