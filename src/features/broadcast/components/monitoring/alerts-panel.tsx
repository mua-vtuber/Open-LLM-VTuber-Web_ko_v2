/**
 * Alerts Panel Component
 * Display and manage queue alerts
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  Check,
  CheckCheck,
  Bell,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../../shared/utils';
import type { QueueAlert, AlertSeverity } from '../../types';

interface AlertsPanelProps {
  /** List of alerts */
  alerts: QueueAlert[];
  /** Count of unacknowledged alerts */
  unacknowledgedCount: number;
  /** Callback to acknowledge a single alert */
  onAcknowledge: (alertId: string) => void;
  /** Callback to acknowledge all alerts */
  onAcknowledgeAll: () => void;
  /** Callback to clear all alerts */
  onClearAll?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get icon for alert severity
 */
function getSeverityIcon(severity: AlertSeverity): React.ReactNode {
  switch (severity) {
    case 'critical':
      return <XCircle className="w-4 h-4" />;
    case 'error':
      return <AlertCircle className="w-4 h-4" />;
    case 'warning':
    default:
      return <AlertTriangle className="w-4 h-4" />;
  }
}

/**
 * Get color classes for alert severity
 */
function getSeverityColors(severity: AlertSeverity): {
  bg: string;
  border: string;
  icon: string;
} {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        icon: 'text-red-500',
      };
    case 'error':
      return {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        icon: 'text-orange-500',
      };
    case 'warning':
    default:
      return {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        icon: 'text-yellow-500',
      };
  }
}

/**
 * Format timestamp to relative time string
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    return 'Just now';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
}

/**
 * Individual alert item component
 */
interface AlertItemProps {
  alert: QueueAlert;
  onAcknowledge: (alertId: string) => void;
}

const AlertItem = memo(function AlertItem({
  alert,
  onAcknowledge,
}: AlertItemProps) {
  const colors = getSeverityColors(alert.severity);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-opacity',
        colors.bg,
        colors.border,
        alert.acknowledged && 'opacity-50'
      )}
    >
      {/* Severity icon */}
      <span className={colors.icon}>{getSeverityIcon(alert.severity)}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary line-clamp-2">{alert.message}</p>
        <p className="text-xs text-text-muted mt-1">
          {formatRelativeTime(alert.timestamp)}
        </p>
      </div>

      {/* Acknowledge button */}
      {!alert.acknowledged && (
        <button
          onClick={() => onAcknowledge(alert.id)}
          className="p-1 rounded hover:bg-background-tertiary transition-colors"
          title="Acknowledge"
        >
          <Check className="w-4 h-4 text-text-muted hover:text-accent-success" />
        </button>
      )}
    </div>
  );
});

/**
 * Alerts panel component for queue monitoring dashboard
 */
export const AlertsPanel = memo(function AlertsPanel({
  alerts,
  unacknowledgedCount,
  onAcknowledge,
  onAcknowledgeAll,
  onClearAll,
  className,
}: AlertsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('p-3 bg-background-secondary rounded-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-medium text-text-primary">
            {t('broadcast.alerts', 'Alerts')}
          </span>
          {unacknowledgedCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-accent-error text-white rounded-full">
              {unacknowledgedCount}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {unacknowledgedCount > 0 && (
            <button
              onClick={onAcknowledgeAll}
              className="flex items-center gap-1 px-2 py-1 text-xs text-text-muted hover:text-accent-success transition-colors rounded hover:bg-background-tertiary"
              title={t('broadcast.acknowledgeAll', 'Acknowledge All')}
            >
              <CheckCheck className="w-3 h-3" />
              <span>{t('broadcast.ackAll', 'Ack All')}</span>
            </button>
          )}
          {onClearAll && alerts.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 px-2 py-1 text-xs text-text-muted hover:text-accent-error transition-colors rounded hover:bg-background-tertiary"
              title={t('broadcast.clearAll', 'Clear All')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <div className="py-6 text-center text-sm text-text-muted">
          {t('broadcast.noAlerts', 'No alerts')}
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {alerts.slice(0, 10).map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onAcknowledge={onAcknowledge}
            />
          ))}
          {alerts.length > 10 && (
            <p className="text-xs text-center text-text-muted py-2">
              {t('broadcast.moreAlerts', '+ {{count}} more alerts', {
                count: alerts.length - 10,
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
});
