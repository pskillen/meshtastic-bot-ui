// API request types
export interface DateRangeParams {
  startDate?: Date;
  endDate?: Date;
}

export interface DateRangeIntervalParams extends DateRangeParams {
  interval?: number;
  intervalType?: 'hour' | 'day' | 'week' | 'month';
}
