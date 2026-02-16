'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  preset: DateRangePreset;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presetLabels: Record<DateRangePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_7_days: 'Last 7 days',
  last_30_days: 'Last 30 days',
  last_90_days: 'Last 90 days',
  this_month: 'This month',
  last_month: 'Last month',
  custom: 'Custom',
};

function getPresetDateRange(preset: DateRangePreset): { startDate: Date; endDate: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: endOfToday };
    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const endOfYesterday = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1);
      return { startDate: yesterday, endDate: endOfYesterday };
    }
    case 'last_7_days': {
      const start = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: endOfToday };
    }
    case 'last_30_days': {
      const start = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: endOfToday };
    }
    case 'last_90_days': {
      const start = new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: endOfToday };
    }
    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: startOfMonth, endDate: endOfToday };
    }
    case 'last_month': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { startDate: startOfLastMonth, endDate: endOfLastMonth };
    }
    default:
      return { startDate: today, endDate: endOfToday };
  }
}

export function getInitialDateRange(): DateRange {
  const { startDate, endDate } = getPresetDateRange('last_7_days');
  return { startDate, endDate, preset: 'last_7_days' };
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      // For custom, keep current dates but mark as custom
      onChange({ ...value, preset: 'custom' });
    } else {
      const { startDate, endDate } = getPresetDateRange(preset);
      onChange({ startDate, endDate, preset });
    }
    setIsOpen(false);
  };

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = value.startDate.toLocaleDateString('en-US', options);
    const endStr = value.endDate.toLocaleDateString('en-US', options);

    if (startStr === endStr) {
      return startStr;
    }
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>{formatDateRange()}</span>
        <svg
          className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {(Object.keys(presetLabels) as DateRangePreset[])
              .filter((preset) => preset !== 'custom')
              .map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                    value.preset === preset
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {presetLabels[preset]}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
