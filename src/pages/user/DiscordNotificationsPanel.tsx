import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Info, Bell } from 'lucide-react';
import { useConfig } from '@/providers/ConfigProvider';
import {
  useDiscordNotificationPrefs,
  usePatchDiscordNotificationPrefs,
  usePostDiscordNotificationTest,
} from '@/hooks/api/useDiscordNotifications';
import { authService } from '@/lib/auth/authService';
import { toast } from 'sonner';

function discordPrefsErrorDetail(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'data' in err) {
    const data = (err as { data?: { detail?: string } }).data;
    if (data?.detail) return data.detail;
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export function DiscordNotificationsPanel() {
  const config = useConfig();
  const { data, isLoading, error, refetch } = useDiscordNotificationPrefs();
  const patchPrefs = usePatchDiscordNotificationPrefs();
  const testDm = usePostDiscordNotificationTest();

  const linked = data?.discord_linked ?? false;
  const verified = data?.discord_notify_verified ?? false;

  const handleConnectDiscord = async () => {
    try {
      const url = await authService.getDiscordConnectAuthUrl(config.apis.meshBot.baseUrl);
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start Discord linking');
    }
  };

  const handleResync = () => {
    patchPrefs.mutate(undefined, {
      onSuccess: () => {
        toast.success('Discord status refreshed');
      },
      onError: (e) => toast.error(discordPrefsErrorDetail(e)),
    });
  };

  const handleTest = () => {
    testDm.mutate(undefined, {
      onSuccess: (res) => {
        toast.success(res.detail === 'ok' ? 'Test DM sent' : res.detail);
      },
      onError: (e) => toast.error(discordPrefsErrorDetail(e)),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Discord
        </CardTitle>
        <CardDescription>
          Link your Discord account to Meshflow so we can send you direct messages (e.g. test ping below, or future
          alerts). After linking, use &quot;Send test notification&quot; to confirm the bot can DM you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500 dark:text-slate-400" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not load settings</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span>{error instanceof Error ? error.message : 'Unknown error'}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid gap-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Discord account</span>
                <Badge variant={linked ? 'default' : 'secondary'}>{linked ? 'Connected' : 'Not connected'}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Alerts</span>
                <Badge variant={verified ? 'default' : 'secondary'}>
                  {verified ? 'Ready for alerts' : 'Not verified'}
                </Badge>
              </div>
            </div>

            {!linked && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Link Discord</AlertTitle>
                <AlertDescription className="text-xs leading-relaxed">
                  You&apos;ll sign in with Discord once to attach that account to your current Meshflow login (Google,
                  GitHub, password, etc.). The redirect returns you to this profile with your session preserved.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="default" onClick={() => void handleConnectDiscord()}>
                {linked ? 'Change linked Discord' : 'Link Discord'}
              </Button>
              <Button type="button" variant="outline" disabled={patchPrefs.isPending} onClick={handleResync}>
                {patchPrefs.isPending ? 'Refreshing…' : 'Refresh status'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!verified || testDm.isPending}
                onClick={handleTest}
                title={verified ? 'Send a test DM via the Meshflow bot' : 'Link and verify Discord first (OAuth sync)'}
              >
                {testDm.isPending ? 'Sending…' : 'Send test notification'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
