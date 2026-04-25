/** Integer ``AutoTraceRoute.trigger_type`` from Meshflow API (meshflow-api#218). */
export const TRIGGER_TYPE_USER = 1;
export const TRIGGER_TYPE_EXTERNAL = 2;
export const TRIGGER_TYPE_MONITORING = 3;
export const TRIGGER_TYPE_NODE_WATCH = 4;
export const TRIGGER_TYPE_DX_WATCH = 5;

export type TracerouteTriggerType =
  | typeof TRIGGER_TYPE_USER
  | typeof TRIGGER_TYPE_EXTERNAL
  | typeof TRIGGER_TYPE_MONITORING
  | typeof TRIGGER_TYPE_NODE_WATCH
  | typeof TRIGGER_TYPE_DX_WATCH;

/** Filter / URL token: API accepts these legacy slugs or decimal strings "1"–"5". */
export type TriggerTypeFilterToken =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | 'user'
  | 'external'
  | 'auto'
  | 'monitor';

export const TRIGGER_TYPE_FILTER_OPTIONS: Array<{ value: TriggerTypeFilterToken; label: string }> = [
  { value: '1', label: 'User' },
  { value: '2', label: 'External' },
  { value: '3', label: 'Monitoring' },
  { value: '4', label: 'Node watch' },
  { value: '5', label: 'DX watch' },
];

const LEGACY_LABEL: Partial<Record<string, string>> = {
  user: 'User',
  external: 'External',
  auto: 'Monitoring',
  monitor: 'Node watch',
};

export function labelForTriggerTypeFilterToken(token: string): string {
  const fromOptions = TRIGGER_TYPE_FILTER_OPTIONS.find((o) => o.value === token);
  if (fromOptions) return fromOptions.label;
  return LEGACY_LABEL[token] ?? token;
}

export function labelForTriggerTypeApi(
  triggerType: TracerouteTriggerType,
  triggerTypeLabel?: string | null
): string {
  if (triggerTypeLabel) return triggerTypeLabel;
  return (
    TRIGGER_TYPE_FILTER_OPTIONS.find((o) => o.value === String(triggerType))?.label ?? String(triggerType)
  );
}
