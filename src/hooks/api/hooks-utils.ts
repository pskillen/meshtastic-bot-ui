import { DateRangeIntervalParams, StatsQueryParams } from '@/lib/types';
import { roundToNearestHours } from 'date-fns';

export function roundDateParams<T extends DateRangeIntervalParams>(params?: T | undefined): T | undefined {
  if (!params) return undefined;

  const startRounded = roundToNearestHours(params?.startDate || new Date(), { roundingMethod: 'ceil' });
  const endRounded = roundToNearestHours(params?.endDate || new Date(), { roundingMethod: 'ceil' });

  return { ...params, startDate: startRounded, endDate: endRounded };
}

export function getKeyValue(params?: DateRangeIntervalParams | StatsQueryParams): string {
  if (!params) return '';

  if ('nodeId' in params) {
    return `${params?.startDate?.toISOString()}-${params?.endDate?.toISOString()}-${params?.nodeId}`;
  } else {
    return `${params?.startDate?.toISOString()}-${params?.endDate?.toISOString()}`;
  }
}
