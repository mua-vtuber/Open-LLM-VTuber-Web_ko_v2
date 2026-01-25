/**
 * Queue Status Panel
 * 채팅 큐 상태 표시 컴포넌트
 */

import { useTranslation } from 'react-i18next';
import { Activity, Clock, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../../shared/utils';
import { useQueueStatus } from '../hooks';

interface QueueStatusPanelProps {
  className?: string;
}

export function QueueStatusPanel({ className }: QueueStatusPanelProps) {
  const { t } = useTranslation();
  const { status, isLoading, error, lastUpdated } = useQueueStatus({
    autoRefresh: true,
    refreshInterval: 2000,
  });

  if (isLoading && !status) {
    return (
      <div className={cn('p-4 bg-background-secondary rounded-lg', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-background-tertiary rounded w-1/3" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-background-tertiary rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 bg-background-secondary rounded-lg', className)}>
        <div className="flex items-center gap-2 text-accent-error">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  // 큐 상태 계산
  const queueUsage = status.max_size > 0 ? (status.pending / status.max_size) * 100 : 0;
  const isQueueHigh = queueUsage > 70;
  const isQueueCritical = queueUsage > 90;

  return (
    <div className={cn('p-4 bg-background-secondary rounded-lg', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {t('broadcast.queueStatus', 'Queue Status')}
        </h3>
        <div className="flex items-center gap-2">
          {status.running ? (
            <span className="flex items-center gap-1 text-xs text-accent-success">
              <CheckCircle className="w-3 h-3" />
              {t('broadcast.running', 'Running')}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-accent-error">
              <XCircle className="w-3 h-3" />
              {t('broadcast.stopped', 'Stopped')}
            </span>
          )}
        </div>
      </div>

      {/* 메인 통계 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* 대기 중 */}
        <div className="p-3 bg-background-tertiary rounded-lg">
          <div className="text-xs text-text-muted mb-1">
            {t('broadcast.pending', 'Pending')}
          </div>
          <div className={cn(
            'text-xl font-semibold',
            isQueueCritical ? 'text-accent-error' : isQueueHigh ? 'text-accent-warning' : 'text-text-primary'
          )}>
            {status.pending}
          </div>
          <div className="text-xs text-text-muted">
            / {status.max_size}
          </div>
        </div>

        {/* 처리 중 */}
        <div className="p-3 bg-background-tertiary rounded-lg">
          <div className="text-xs text-text-muted mb-1">
            {t('broadcast.processing', 'Processing')}
          </div>
          <div className={cn(
            'text-xl font-semibold',
            status.processing > 0 ? 'text-accent-primary' : 'text-text-primary'
          )}>
            {status.processing}
          </div>
        </div>

        {/* 처리율 */}
        <div className="p-3 bg-background-tertiary rounded-lg">
          <div className="text-xs text-text-muted mb-1">
            {t('broadcast.rate', 'Rate')}
          </div>
          <div className="text-xl font-semibold text-text-primary flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-accent-success" />
            {status.processing_rate.toFixed(1)}
          </div>
          <div className="text-xs text-text-muted">msg/s</div>
        </div>
      </div>

      {/* 큐 사용량 바 */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>{t('broadcast.queueUsage', 'Queue Usage')}</span>
          <span>{queueUsage.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              isQueueCritical
                ? 'bg-accent-error'
                : isQueueHigh
                ? 'bg-accent-warning'
                : 'bg-accent-success'
            )}
            style={{ width: `${Math.min(queueUsage, 100)}%` }}
          />
        </div>
      </div>

      {/* 추가 통계 */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1 text-text-muted">
          <CheckCircle className="w-3 h-3 text-accent-success" />
          <span>{status.total_processed}</span>
        </div>
        <div className="flex items-center gap-1 text-text-muted">
          <XCircle className="w-3 h-3 text-accent-error" />
          <span>{status.total_dropped}</span>
        </div>
        <div className="flex items-center gap-1 text-text-muted">
          <Clock className="w-3 h-3" />
          <span>{status.avg_processing_time.toFixed(1)}s</span>
        </div>
      </div>

      {/* 마지막 업데이트 */}
      {lastUpdated && (
        <div className="mt-3 text-xs text-text-muted text-right">
          {t('broadcast.lastUpdated', 'Updated')}: {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
