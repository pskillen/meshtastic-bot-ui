import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, AlertCircle, Info, Radio } from 'lucide-react';
import { toast } from 'sonner';
import {
  getDxNotificationSettingsSaveErrorMessage,
  useDxNotificationSettings,
  usePatchDxNotificationSettings,
} from '@/hooks/api/useDxMonitoring';
import {
  DX_NOTIFICATION_CATEGORY_META,
  DX_NOTIFICATION_CATEGORY_ORDER,
  type DxNotificationCategoryValue,
} from '@/lib/models';

function readinessBadgeVariant(
  status: 'verified' | 'not_linked' | 'needs_relink'
): 'default' | 'secondary' | 'destructive' {
  if (status === 'verified') return 'default';
  if (status === 'needs_relink') return 'destructive';
  return 'secondary';
}

function readinessLabel(status: 'verified' | 'not_linked' | 'needs_relink'): string {
  if (status === 'verified') return 'Verified';
  if (status === 'needs_relink') return 'Needs refresh';
  return 'Not linked';
}

export function DxNotificationsPanel() {
  const { data, isLoading, error, refetch } = useDxNotificationSettings();
  const patch = usePatchDxNotificationSettings();

  const discordVerified = data?.discord.status === 'verified';
  const busy = patch.isPending;

  const save = (body: Parameters<typeof patch.mutate>[0]) => {
    patch.mutate(body, {
      onError: (e) => toast.error(getDxNotificationSettingsSaveErrorMessage(e)),
    });
  };

  const onEnabledChange = (checked: boolean) => {
    save({ enabled: checked });
  };

  const onAllCategoriesChange = (checked: boolean) => {
    if (!data) return;
    if (checked) {
      save({ all_categories: true });
      return;
    }
    const fallback = [...DX_NOTIFICATION_CATEGORY_ORDER];
    const categories = data.categories.length > 0 ? (data.categories as DxNotificationCategoryValue[]) : fallback;
    save({ all_categories: false, categories: categories.length ? categories : fallback });
  };

  const onCategoryToggle = (cat: DxNotificationCategoryValue, checked: boolean) => {
    if (!data || data.all_categories) return;
    const set = new Set(data.categories);
    if (checked) {
      set.add(cat);
    } else {
      if (set.size <= 1) {
        toast.error('Choose at least one notification type, or turn “All types” back on.');
        return;
      }
      set.delete(cat);
    }
    const categories = DX_NOTIFICATION_CATEGORY_ORDER.filter((c) => set.has(c));
    save({ all_categories: false, categories });
  };

  return (
    <Card id="dx-notifications">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          DX Discord notifications
        </CardTitle>
        <CardDescription>
          Optional direct messages when Meshflow detects interesting DX-related activity. Uses the same linked Discord
          account as the test notification above.
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
            <AlertTitle>Could not load DX notification settings</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span>{error instanceof Error ? error.message : 'Unknown error'}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : data ? (
          <>
            <div className="grid gap-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Discord for DMs</span>
                <Badge variant={readinessBadgeVariant(data.discord.status)}>
                  {readinessLabel(data.discord.status)}
                </Badge>
              </div>
            </div>

            {data.discord.status === 'not_linked' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Link Discord first</AlertTitle>
                <AlertDescription className="text-xs leading-relaxed">
                  Connect your Discord account using the panel above, then send a test notification to verify DMs. DX
                  alerts stay off until Discord shows as verified.
                </AlertDescription>
              </Alert>
            )}

            {data.discord.status === 'needs_relink' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Discord needs a refresh</AlertTitle>
                <AlertDescription className="text-xs leading-relaxed">
                  Your Discord link is out of date. Use &quot;Refresh status&quot; or &quot;Link Discord&quot; in the
                  Discord panel above, then try again.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-row items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="dx-notif-enabled">DX direct messages</Label>
                <p className="text-xs text-muted-foreground">
                  {discordVerified
                    ? 'Send DX-related alerts to your verified Discord DM channel.'
                    : 'Verify Discord above before you can turn this on.'}
                </p>
              </div>
              <Switch
                id="dx-notif-enabled"
                checked={data.enabled}
                disabled={busy || !discordVerified}
                onCheckedChange={onEnabledChange}
              />
            </div>

            <div
              className={`flex flex-col gap-4 rounded-lg border p-4 ${!data.enabled ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <div className="flex flex-row items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="dx-notif-all-cat">All notification types</Label>
                  <p className="text-xs text-muted-foreground">
                    When on, you receive every category. When off, pick the types you want.
                  </p>
                </div>
                <Switch
                  id="dx-notif-all-cat"
                  checked={data.all_categories}
                  disabled={busy || !data.enabled}
                  onCheckedChange={onAllCategoriesChange}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Categories</p>
                <ul className="space-y-3">
                  {DX_NOTIFICATION_CATEGORY_ORDER.map((cat) => {
                    const meta = DX_NOTIFICATION_CATEGORY_META[cat];
                    const checked = data.categories.includes(cat);
                    return (
                      <li key={cat} className="flex flex-row items-start gap-3">
                        <Checkbox
                          id={`dx-cat-${cat}`}
                          checked={checked}
                          disabled={busy || !data.enabled || data.all_categories}
                          onCheckedChange={(v) => onCategoryToggle(cat, v === true)}
                          className="mt-1"
                        />
                        <div className="space-y-0.5 min-w-0">
                          <Label htmlFor={`dx-cat-${cat}`} className="font-normal cursor-pointer">
                            {meta.label}
                          </Label>
                          <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
