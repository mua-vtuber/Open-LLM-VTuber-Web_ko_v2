/**
 * Metrics Cards Component
 * Display cards for processing rate, wait time, and priority distribution
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { cn } from '../../../../shared/utils';
import type { PriorityDistribution } from '../../types';

interface MetricsCardsProps {
  /** Processing rate (messages per second) */
  processingRate: number;
  /** Average wait time (seconds) */
  avgWaitTime: number;
  /** Priority distribution */
  priorityDistribution: PriorityDistribution;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Individual metric card component
 */
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  colorClass?: string;
}

const MetricCard = memo(function MetricCard({
  icon,
  label,
  value,
  unit,
  colorClass = 'text-accent-primary',
}: MetricCardProps) {
  return (
    <div className="p-3 bg-background-tertiary rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('w-4 h-4', colorClass)}>{icon}</span>
        <span className="text-xs text-text-muted">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold text-text-primary">{value}</span>
        {unit && <span className="text-xs text-text-muted">{unit}</span>}
      </div>
    </div>
  );
});

/**
 * Priority distribution bar component
 */
interface PriorityBarProps {
  distribution: PriorityDistribution;
}

const PriorityBar = memo(function PriorityBar({ distribution }: PriorityBarProps) {
  const { t } = useTranslation();
  const total = distribution.high + distribution.normal + distribution.low;

  if (total === 0) {
    return (
      <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
        <div className="h-full bg-text-muted/20" style={{ width: '100%' }} />
      </div>
    );
  }

  const highPercent = (distribution.high / total) * 100;
  const normalPercent = (distribution.normal / total) * 100;
  const lowPercent = (distribution.low / total) * 100;

  return (
    <div className="space-y-2">
      <div className="h-2 bg-background-secondary rounded-full overflow-hidden flex">
        {highPercent > 0 && (
          <div
            className="h-full bg-accent-error transition-all duration-300"
            style={{ width: `${highPercent}%` }}
            title={t('broadcast.priorityHigh', 'High')}
          />
        )}
        {normalPercent > 0 && (
          <div
            className="h-full bg-accent-primary transition-all duration-300"
            style={{ width: `${normalPercent}%` }}
            title={t('broadcast.priorityNormal', 'Normal')}
          />
        )}
        {lowPercent > 0 && (
          <div
            className="h-full bg-text-muted transition-all duration-300"
            style={{ width: `${lowPercent}%` }}
            title={t('broadcast.priorityLow', 'Low')}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-accent-error" />
          {t('broadcast.high', 'High')}: {distribution.high}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-accent-primary" />
          {t('broadcast.normal', 'Normal')}: {distribution.normal}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-text-muted" />
          {t('broadcast.low', 'Low')}: {distribution.low}
        </span>
      </div>
    </div>
  );
});

/**
 * Metrics cards component showing queue statistics
 */
export const MetricsCards = memo(function MetricsCards({
  processingRate,
  avgWaitTime,
  priorityDistribution,
  className,
}: MetricsCardsProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('space-y-3', className)}>
      {/* Processing Rate and Wait Time */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<TrendingUp className="w-4 h-4" />}
          label={t('broadcast.processingRate', 'Processing Rate')}
          value={processingRate.toFixed(1)}
          unit="msg/s"
          colorClass="text-accent-success"
        />
        <MetricCard
          icon={<Clock className="w-4 h-4" />}
          label={t('broadcast.avgWaitTime', 'Avg Wait Time')}
          value={avgWaitTime.toFixed(2)}
          unit="s"
          colorClass="text-accent-warning"
        />
      </div>

      {/* Priority Distribution */}
      <div className="p-3 bg-background-tertiary rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-accent-primary" />
          <span className="text-xs text-text-muted">
            {t('broadcast.priorityDistribution', 'Priority Distribution')}
          </span>
        </div>
        <PriorityBar distribution={priorityDistribution} />
      </div>
    </div>
  );
});
