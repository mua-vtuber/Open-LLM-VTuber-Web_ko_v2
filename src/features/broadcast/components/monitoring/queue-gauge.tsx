/**
 * Queue Gauge Component
 * Circular gauge showing queue usage percentage
 */

import { memo, useMemo } from 'react';
import { cn } from '../../../../shared/utils';

interface QueueGaugeProps {
  /** Current queue size */
  current: number;
  /** Maximum queue size */
  max: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get color based on usage percentage
 */
function getGaugeColor(percentage: number): string {
  if (percentage >= 95) return '#ef4444'; // red - critical
  if (percentage >= 80) return '#f97316'; // orange - high
  if (percentage >= 50) return '#eab308'; // yellow - medium
  return '#22c55e'; // green - normal
}

/**
 * Get status text based on usage percentage
 */
function getStatusText(percentage: number): string {
  if (percentage >= 95) return 'Critical';
  if (percentage >= 80) return 'High';
  if (percentage >= 50) return 'Medium';
  return 'Normal';
}

/**
 * Circular gauge component for queue monitoring
 */
export const QueueGauge = memo(function QueueGauge({
  current,
  max,
  className,
}: QueueGaugeProps) {
  // Calculate percentage
  const percentage = useMemo(() => {
    if (max === 0) return 0;
    return Math.min((current / max) * 100, 100);
  }, [current, max]);

  // SVG dimensions and calculations
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const color = getGaugeColor(percentage);
  const statusText = getStatusText(percentage);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* SVG Gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          aria-label={`Queue usage: ${percentage.toFixed(0)}%`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-background-tertiary"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-bold"
            style={{ color }}
          >
            {percentage.toFixed(0)}%
          </span>
          <span className="text-xs text-text-muted">
            {current} / {max}
          </span>
        </div>
      </div>

      {/* Status label */}
      <div
        className="mt-2 px-3 py-1 rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {statusText}
      </div>
    </div>
  );
});
