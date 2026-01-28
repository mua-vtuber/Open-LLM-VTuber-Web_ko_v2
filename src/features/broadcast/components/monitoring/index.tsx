/**
 * Queue Dashboard Component
 * Main dashboard for real-time queue monitoring
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '../../../../shared/utils';
import { useQueueMonitor } from '../../hooks';
import { QueueGauge } from './queue-gauge';
import { MetricsCards } from './metrics-cards';
import { RateChart } from './rate-chart';
import { AlertsPanel } from './alerts-panel';
import type { QueueConnectionStatus } from '../../types';

interface QueueDashboardProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Connection status indicator component
 */
interface ConnectionIndicatorProps {
  status: QueueConnectionStatus;
}

const ConnectionIndicator = memo(function ConnectionIndicator({
  status,
}: ConnectionIndicatorProps) {
  const { t } = useTranslation();

  const statusConfig = {
    connected: {
      icon: <Wifi className="w-3 h-3" />,
      text: t('broadcast.connected', 'Connected'),
      className: 'text-accent-success',
    },
    disconnected: {
      icon: <WifiOff className="w-3 h-3" />,
      text: t('broadcast.disconnected', 'Disconnected'),
      className: 'text-accent-error',
    },
    connecting: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      text: t('broadcast.connecting', 'Connecting...'),
      className: 'text-accent-warning',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-1 text-xs', config.className)}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
});

/**
 * Queue monitoring dashboard component
 *
 * Displays real-time queue metrics including:
 * - Queue usage gauge
 * - Processing rate and wait time metrics
 * - Queue size history chart
 * - Alert notifications
 */
export const QueueDashboard = memo(function QueueDashboard({
  className,
}: QueueDashboardProps) {
  const { t } = useTranslation();
  const {
    currentMetric,
    history,
    alerts,
    unacknowledgedCount,
    connectionStatus,
    lastUpdated,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    clearAlerts,
    error,
  } = useQueueMonitor();

  // Show loading state when no data yet
  if (!currentMetric && connectionStatus === 'connecting') {
    return (
      <div className={cn('p-4 bg-background-secondary rounded-lg', className)}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={cn('p-4 bg-background-secondary rounded-lg', className)}>
        <div className="flex items-center gap-2 text-accent-error">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  // Default values when no current metric
  const queueSize = currentMetric?.queue_size ?? 0;
  const queueMax = currentMetric?.queue_max ?? 100;
  const processingRate = currentMetric?.processing_rate ?? 0;
  const avgWaitTime = currentMetric?.avg_wait_time ?? 0;
  const priorityDistribution = currentMetric?.priority_distribution ?? {
    high: 0,
    normal: 0,
    low: 0,
  };

  return (
    <div className={cn('p-4 bg-background-secondary rounded-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {t('broadcast.queueMonitor', 'Queue Monitor')}
        </h3>
        <div className="flex items-center gap-3">
          <ConnectionIndicator status={connectionStatus} />
          {lastUpdated && (
            <span className="text-xs text-text-muted">
              {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Gauge */}
        <div className="flex justify-center items-start pt-2">
          <QueueGauge current={queueSize} max={queueMax} />
        </div>

        {/* Middle column: Metrics cards */}
        <div>
          <MetricsCards
            processingRate={processingRate}
            avgWaitTime={avgWaitTime}
            priorityDistribution={priorityDistribution}
          />
        </div>

        {/* Right column: Chart */}
        <div>
          <div className="text-xs text-text-muted mb-2">
            {t('broadcast.queueHistory', 'Queue History')}
          </div>
          <RateChart history={history} maxQueueSize={queueMax} />
        </div>
      </div>

      {/* Alerts section */}
      <div className="mt-4">
        <AlertsPanel
          alerts={alerts}
          unacknowledgedCount={unacknowledgedCount}
          onAcknowledge={acknowledgeAlert}
          onAcknowledgeAll={acknowledgeAllAlerts}
          onClearAll={clearAlerts}
        />
      </div>
    </div>
  );
});

// Re-export individual components for flexibility
export { QueueGauge } from './queue-gauge';
export { MetricsCards } from './metrics-cards';
export { RateChart } from './rate-chart';
export { AlertsPanel } from './alerts-panel';
