/**
 * Rate Chart Component
 * Line/Area chart showing queue size history over time
 */

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { cn } from '../../../../shared/utils';
import type { MetricSnapshot } from '../../types';

interface RateChartProps {
  /** History of metric snapshots */
  history: MetricSnapshot[];
  /** Maximum queue size (for Y-axis scale) */
  maxQueueSize: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Custom tooltip component
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: {
      time: string;
      queue_size: number;
      processing_rate: number;
    };
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  const { t } = useTranslation();

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-background-secondary border border-background-tertiary rounded-lg p-2 shadow-lg">
      <p className="text-xs text-text-muted mb-1">{data.time}</p>
      <p className="text-sm text-text-primary">
        {t('broadcast.queueSize', 'Queue Size')}: {data.queue_size}
      </p>
      <p className="text-sm text-text-muted">
        {t('broadcast.rate', 'Rate')}: {data.processing_rate.toFixed(1)} msg/s
      </p>
    </div>
  );
};

/**
 * Format timestamp to time string
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Rate chart component showing queue size trends
 */
export const RateChart = memo(function RateChart({
  history,
  maxQueueSize,
  className,
}: RateChartProps) {
  const { t } = useTranslation();

  // Transform history data for the chart
  const chartData = useMemo(() => {
    return history.map((snapshot) => ({
      time: formatTime(snapshot.timestamp),
      timestamp: snapshot.timestamp,
      queue_size: snapshot.queue_size,
      processing_rate: snapshot.processing_rate,
    }));
  }, [history]);

  // Calculate Y-axis domain
  const yAxisMax = useMemo(() => {
    const maxValue = Math.max(
      ...history.map((s) => s.queue_size),
      maxQueueSize * 0.2 // At least 20% of max
    );
    return Math.ceil(maxValue * 1.1); // Add 10% padding
  }, [history, maxQueueSize]);

  if (chartData.length === 0) {
    return (
      <div className={cn('h-40 flex items-center justify-center', className)}>
        <p className="text-sm text-text-muted">
          {t('broadcast.noData', 'No data available')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('h-40', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorQueueSize" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent-primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--accent-primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--background-tertiary))"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--background-tertiary))' }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            domain={[0, yAxisMax]}
            tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--background-tertiary))' }}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="queue_size"
            stroke="hsl(var(--accent-primary))"
            strokeWidth={2}
            fill="url(#colorQueueSize)"
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
