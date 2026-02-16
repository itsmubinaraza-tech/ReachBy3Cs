'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn, getRiskColor } from '@/lib/utils';
import type { RiskLevel } from 'shared-types';

export interface RiskData {
  level: RiskLevel;
  count: number;
  percentage: number;
}

export interface RiskDistributionProps {
  data: RiskData[];
  loading?: boolean;
  className?: string;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  blocked: '#ef4444',
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  blocked: 'Blocked',
};

export function RiskDistribution({ data, loading = false, className }: RiskDistributionProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6',
          className
        )}
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    label: RISK_LABELS[item.level],
  }));

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: RiskData & { label: string } }>;
  }) => {
    if (active && payload && payload.length && payload[0]) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label} Risk</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {item.count.toLocaleString()} posts ({item.percentage.toFixed(1)}%)
          </p>
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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Risk Distribution
      </h3>

      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 12 }}
              stroke="#9CA3AF"
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.level]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk level badges */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((item) => (
          <div
            key={item.level}
            className={cn(
              'flex items-center justify-between p-2 rounded-lg',
              item.level === 'low' && 'bg-green-50 dark:bg-green-900/20',
              item.level === 'medium' && 'bg-yellow-50 dark:bg-yellow-900/20',
              item.level === 'high' && 'bg-orange-50 dark:bg-orange-900/20',
              item.level === 'blocked' && 'bg-red-50 dark:bg-red-900/20'
            )}
          >
            <span
              className={cn(
                'text-xs font-medium',
                item.level === 'low' && 'text-green-700 dark:text-green-400',
                item.level === 'medium' && 'text-yellow-700 dark:text-yellow-400',
                item.level === 'high' && 'text-orange-700 dark:text-orange-400',
                item.level === 'blocked' && 'text-red-700 dark:text-red-400'
              )}
            >
              {RISK_LABELS[item.level]}
            </span>
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              {item.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
