import * as React from 'react';
import { startOfDay, subDays, subHours } from 'date-fns';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export interface TimeRangeOption {
  key: string;
  label: string;
}

interface TimeRangeSelectProps {
  options: TimeRangeOption[];
  value: string;
  onChange: (value: string, timeRange: { startDate: Date; endDate: Date }) => void;
  className?: string;
}

export function TimeRangeSelect({ options, value, onChange, className }: TimeRangeSelectProps) {
  const [timeRange, setTimeRange] = React.useState(value);

  React.useEffect(() => {
    const now = new Date();
    let startDate: Date;

    // Check if the time range is in days or hours
    if (timeRange.endsWith('d')) {
      const days = parseInt(timeRange);
      if (days === 1) {
        // For 1 day, use start of today
        startDate = startOfDay(now);
      } else {
        // For multiple days, subtract days from start of today
        startDate = subDays(startOfDay(now), days);
      }
    } else if (timeRange.endsWith('h')) {
      // For hours, just subtract hours from now
      const hours = parseInt(timeRange);
      startDate = subHours(now, hours);
    } else {
      // Default fallback
      startDate = subDays(now, 7);
    }

    onChange(timeRange, { startDate, endDate: now });
  }, [timeRange, onChange]);

  const handleTimeRangeChange = (newValue: string) => {
    setTimeRange(newValue);
  };

  return (
    <div className={className}>
      <ToggleGroup
        type="single"
        value={timeRange}
        onValueChange={handleTimeRangeChange}
        variant="outline"
        className="@[767px]/card:flex hidden"
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.key} value={option.key} className="h-8 px-2.5">
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Select value={timeRange} onValueChange={handleTimeRangeChange}>
        <SelectTrigger className="@[767px]/card:hidden flex w-40" aria-label="Select time range">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {options.map((option) => (
            <SelectItem key={option.key} value={option.key} className="rounded-lg">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
