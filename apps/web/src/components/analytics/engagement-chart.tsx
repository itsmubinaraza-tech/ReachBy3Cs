'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface TimelineDataPoint {
  date: string;
  postsDetected: number;
  responsesGenerated: number;
  responsesApproved: number;
  responsesPosted: number;
}

export interface EngagementChartProps {
  data: TimelineDataPoint[];
  loading?: boolean;
  className?: string;
}

type ChartType = 'line' | 'bar';

export function EngagementChart({ data, loading = false, className }: EngagementChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [visibleLines, setVisibleLines] = useState({
    postsDetected: true,
    responsesGenerated: true,
    responsesApproved: true,
    responsesPosted: true,
  });

  const toggleLine = (key: keyof typeof visibleLines) => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const lineConfig = [
    { key: 'postsDetected', label: 'Posts Detected', color: '#8884d8' },
    { key: 'responsesGenerated', label: 'Responses Generated', color: '#82ca9d' },
    { key: 'responsesApproved', label: 'Approved', color: '#ffc658' },
    { key: 'responsesPosted', label: 'Posted', color: '#ff7c7c' },
  ] as const;

  if (loading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6',
          className
        )}
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Engagement Over Time
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartType('line')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              chartType === 'line'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              chartType === 'bar'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            Bar
          </button>
        </div>
      </div>

      {/* Legend toggles */}
      <div className="flex flex-wrap gap-3 mb-4">
        {lineConfig.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggleLine(key)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-opacity',
              !visibleLines[key] && 'opacity-50'
            )}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-gray-700 dark:text-gray-300">{label}</span>
          </button>
        ))}
      </div>

      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#9CA3AF"
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {lineConfig.map(
                ({ key, label, color }) =>
                  visibleLines[key] && (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={label}
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  )
              )}
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#9CA3AF"
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {lineConfig.map(
                ({ key, label, color }) =>
                  visibleLines[key] && (
                    <Bar key={key} dataKey={key} name={label} fill={color} />
                  )
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
