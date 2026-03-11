'use client';

import { useEffect, useState } from 'react';
import { Target } from 'lucide-react';

interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

const funnelData: FunnelStage[] = [
  { label: 'Detected', value: 247, color: 'from-cyan-400 to-cyan-500' },
  { label: 'Analyzed', value: 189, color: 'from-cyan-500 to-pink-400' },
  { label: 'Drafted', value: 142, color: 'from-pink-400 to-pink-500' },
  { label: 'Approved', value: 98, color: 'from-pink-500 to-orange-400' },
  { label: 'Posted', value: 67, color: 'from-orange-400 to-orange-500' },
];

const maxValue = funnelData[0]?.value ?? 1;
const firstStageValue = funnelData[0]?.value ?? 1;
const lastStageValue = funnelData[funnelData.length - 1]?.value ?? 0;

export function EngagementFunnel() {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const conversionRate = Math.round((lastStageValue / firstStageValue) * 100);

  return (
    <div className="glass rounded-2xl p-4 border border-white/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Engagement Funnel</h3>
        <span className="text-xs text-gray-500">This week</span>
      </div>

      {/* Funnel Bars */}
      <div className="space-y-3">
        {funnelData.map((stage, index) => {
          const widthPercent = (stage.value / maxValue) * 100;
          return (
            <div key={stage.label} className="flex items-center gap-3">
              {/* Bar */}
              <div className="flex-1 h-7 bg-white/30 rounded-full overflow-hidden relative">
                <div
                  className={`h-full bg-gradient-to-r ${stage.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{
                    width: animated ? `${widthPercent}%` : '0%',
                    transitionDelay: `${index * 150}ms`,
                  }}
                />
              </div>
              {/* Label & Value */}
              <div className="w-24 flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">{stage.value}</span>
                <span className="text-gray-500">{stage.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversion Rate */}
      <div className="mt-4 pt-3 border-t border-white/30 flex items-center gap-2">
        <Target className="w-4 h-4 text-cyan-500" />
        <span className="text-sm font-semibold text-gray-800">{conversionRate}%</span>
        <span className="text-xs text-gray-500">conversion rate</span>
      </div>
    </div>
  );
}
