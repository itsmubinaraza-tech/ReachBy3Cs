'use client';

import { cn, getRiskColor, getCTAColor, formatScore } from '@/lib/utils';
import type { RiskLevel, CTALevel } from 'shared-types';

interface AIAnalysisProps {
  analysis: {
    problemCategory: string | null;
    emotionalIntensity: number;
    keywords: string[];
    riskLevel: RiskLevel;
    riskScore: number;
    riskFactors: string[];
  };
  metrics: {
    ctaLevel: CTALevel;
    ctsScore: number;
    canAutoPost: boolean;
  };
  className?: string;
  expanded?: boolean;
}

const riskLevelIcons: Record<RiskLevel, { icon: string; label: string }> = {
  low: { icon: '[ ]', label: 'Low' },
  medium: { icon: '[!]', label: 'Medium' },
  high: { icon: '[!!]', label: 'High' },
  blocked: { icon: '[X]', label: 'Blocked' },
};

export function AIAnalysis({
  analysis,
  metrics,
  className,
  expanded = false,
}: AIAnalysisProps) {
  const intensityPercent = Math.round(analysis.emotionalIntensity * 100);
  const ctsPercent = Math.round(metrics.ctsScore * 100);

  const getCTSColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main metrics row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Risk Level */}
        <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg', getRiskColor(analysis.riskLevel))}>
          <span className="font-mono text-xs">{riskLevelIcons[analysis.riskLevel].icon}</span>
          <span className="text-sm font-medium">{riskLevelIcons[analysis.riskLevel].label} Risk</span>
        </div>

        {/* CTA Level */}
        <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg', getCTAColor(metrics.ctaLevel))}>
          <span className="text-sm font-medium">CTA: {metrics.ctaLevel}</span>
        </div>

        {/* CTS Score */}
        <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg', getCTSColor(metrics.ctsScore))}>
          <span className="text-sm font-medium">CTS: {formatScore(metrics.ctsScore)}</span>
          {metrics.canAutoPost && (
            <span className="text-xs bg-current/10 px-1.5 py-0.5 rounded">Auto</span>
          )}
        </div>

        {/* Auto-post indicator */}
        {metrics.canAutoPost && (
          <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30">
            [v] Auto-post Ready
          </span>
        )}
      </div>

      {/* Category */}
      {analysis.problemCategory && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {analysis.problemCategory}
          </span>
        </div>
      )}

      {/* Emotional Intensity Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Emotional Intensity</span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {intensityPercent}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              intensityPercent >= 80
                ? 'bg-red-500'
                : intensityPercent >= 60
                ? 'bg-yellow-500'
                : intensityPercent >= 40
                ? 'bg-blue-500'
                : 'bg-green-500'
            )}
            style={{ width: `${intensityPercent}%` }}
          />
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <>
          {/* CTS Score Breakdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Conversion-to-Sale Score</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {ctsPercent}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  ctsPercent >= 80
                    ? 'bg-green-500'
                    : ctsPercent >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                )}
                style={{ width: `${ctsPercent}%` }}
              />
            </div>
          </div>

          {/* Keywords */}
          {analysis.keywords.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Keywords:</span>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risk Factors */}
          {analysis.riskFactors.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Risk Factors:</span>
              <ul className="space-y-1">
                {analysis.riskFactors.map((factor, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-yellow-500 mt-0.5">!</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
