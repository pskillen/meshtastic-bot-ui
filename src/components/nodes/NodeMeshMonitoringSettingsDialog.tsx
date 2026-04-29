import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useNodeMonitoringConfig, usePatchNodeMonitoringConfigMutation } from '@/hooks/api/useNodeWatches';
import { formatUptimeSeconds } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const SILENCE_PRESETS: { label: string; seconds: number }[] = [
  { label: '1 hour', seconds: 3600 },
  { label: '2 hours', seconds: 7200 },
  { label: '6 hours', seconds: 21600 },
  { label: '12 hours', seconds: 43200 },
  { label: '24 hours', seconds: 86400 },
];

const BATTERY_THRESHOLD_CHOICES = [20, 30, 40, 50, 60, 70, 80] as const;

export interface NodeMeshMonitoringSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  observedNodeId: string;
  nodeId: number;
}

/**
 * Per-node monitoring config: silence before verification + optional battery alerting.
 * Parent should only open when the user can edit (`editable: true`); PATCH still enforces server-side.
 */
export function NodeMeshMonitoringSettingsDialog({
  open,
  onOpenChange,
  observedNodeId,
  nodeId,
}: NodeMeshMonitoringSettingsDialogProps) {
  const configQuery = useNodeMonitoringConfig(observedNodeId, open);
  const patchConfig = usePatchNodeMonitoringConfigMutation();
  const [seconds, setSeconds] = useState(21600);
  const [batteryEnabled, setBatteryEnabled] = useState(false);
  const [thresholdPct, setThresholdPct] = useState(50);
  const [reportCount, setReportCount] = useState(2);

  useEffect(() => {
    if (open && configQuery.data) {
      setSeconds(configQuery.data.last_heard_offline_after_seconds);
      setBatteryEnabled(configQuery.data.battery_alert_enabled);
      setThresholdPct(configQuery.data.battery_alert_threshold_percent);
      setReportCount(configQuery.data.battery_alert_report_count);
    }
  }, [open, configQuery.data]);

  const presetValues = new Set(SILENCE_PRESETS.map((p) => p.seconds));
  const selectValue = presetValues.has(seconds) ? String(seconds) : `custom:${seconds}`;
  const d = configQuery.data;
  const unchanged =
    d != null &&
    seconds === d.last_heard_offline_after_seconds &&
    batteryEnabled === d.battery_alert_enabled &&
    thresholdPct === d.battery_alert_threshold_percent &&
    reportCount === d.battery_alert_report_count;

  const handleSave = () => {
    if (!d) return;
    patchConfig.mutate(
      {
        observedNodeId,
        nodeId,
        body: {
          last_heard_offline_after_seconds: seconds,
          battery_alert_enabled: batteryEnabled,
          battery_alert_threshold_percent: thresholdPct,
          battery_alert_report_count: reportCount,
        },
      },
      {
        onSuccess: () => {
          toast.success('Monitoring settings saved');
          onOpenChange(false);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not save settings'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mesh monitoring settings</DialogTitle>
          <DialogDescription>
            Silence before verification (how long without packets before a verification round may start) and optional
            low-battery alerting (consecutive below-threshold telemetry reports). Claim owners and staff can edit these
            values.
          </DialogDescription>
        </DialogHeader>
        {configQuery.isLoading && (
          <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading…
          </div>
        )}
        {configQuery.isError && <p className="text-sm text-destructive py-4">Could not load monitoring settings.</p>}
        {!configQuery.isLoading && !configQuery.isError && configQuery.data?.editable && (
          <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <Label htmlFor="mesh-silence-select">Silence before verification</Label>
              <Select
                value={selectValue}
                onValueChange={(v) => {
                  const sec = v.startsWith('custom:') ? parseInt(v.slice('custom:'.length), 10) : parseInt(v, 10);
                  if (Number.isFinite(sec) && sec >= 1) setSeconds(sec);
                }}
              >
                <SelectTrigger id="mesh-silence-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SILENCE_PRESETS.map((p) => (
                    <SelectItem key={p.seconds} value={String(p.seconds)}>
                      {p.label}
                    </SelectItem>
                  ))}
                  {!presetValues.has(seconds) && (
                    <SelectItem value={`custom:${seconds}`}>Current: {formatUptimeSeconds(seconds)}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="mesh-battery-enabled"
                  checked={batteryEnabled}
                  onCheckedChange={(c) => {
                    if (c === 'indeterminate') return;
                    setBatteryEnabled(Boolean(c));
                  }}
                />
                <label htmlFor="mesh-battery-enabled" className="text-sm font-medium cursor-pointer">
                  Battery alerting enabled
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, consecutive device-metric reports below the threshold confirm a low-battery episode (for
                Discord notifications to watchers who opt in).
              </p>
              <div className="grid gap-2">
                <Label htmlFor="mesh-battery-threshold">Battery threshold (%)</Label>
                <Select
                  value={String(thresholdPct)}
                  onValueChange={(v) => setThresholdPct(parseInt(v, 10))}
                  disabled={!batteryEnabled}
                >
                  <SelectTrigger id="mesh-battery-threshold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BATTERY_THRESHOLD_CHOICES.map((t) => (
                      <SelectItem key={t} value={String(t)}>
                        {t}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mesh-battery-streak">Consecutive reports to confirm</Label>
                <Select
                  value={String(reportCount)}
                  onValueChange={(v) => setReportCount(parseInt(v, 10))}
                  disabled={!batteryEnabled}
                >
                  <SelectTrigger id="mesh-battery-streak">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {configQuery.data?.editable && (
            <Button type="button" onClick={handleSave} disabled={patchConfig.isPending || unchanged}>
              {patchConfig.isPending ? 'Saving…' : 'Save'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
