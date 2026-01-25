/**
 * Queue Status Compact
 * 도구 탭용 컴팩트 큐 상태 표시
 */

import { useTranslation } from 'react-i18next';
import { Activity, Settings, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../../shared/utils';
import { Button } from '../../../shared/components';
import { useQueueStatus } from '../hooks';
import { useAppStore } from '../../../shared/store';

interface QueueStatusCompactProps {
  className?: string;
}

export function QueueStatusCompact({ className }: QueueStatusCompactProps) {
  const { t } = useTranslation();
  const { status, isLoading, error, refresh } = useQueueStatus({
    autoRefresh: true,
    refreshInterval: 2000,
  });

  const openSettings = useAppStore((state) => state.openSettings);

  if (isLoading && !status) {
    return (
      <div className={cn('flex items-center justify-center py-6', className)}>
        <RefreshCw className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-6 gap-3', className)}>
        <AlertTriangle className="w-8 h-8 text-accent-error" />
        <p className="text-sm text-text-muted">{t('broadcast.connectionError', 'Connection Error')}</p>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RefreshCw className="w-4 h-4 mr-1" />
          {t('broadcast.retry', 'Retry')}
        </Button>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const queueUsage = status.max_size > 0 ? (status.pending / status.max_size) * 100 : 0;
  const isQueueHigh = queueUsage > 70;
  const isQueueCritical = queueUsage > 90;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* 상태 표시 */}
      <div className="flex items-center gap-2">
        {status.running ? (
          <CheckCircle className="w-5 h-5 text-accent-success" />
        ) : (
          <XCircle className="w-5 h-5 text-accent-error" />
        )}
        <span className={cn(
          'text-sm font-medium',
          status.running ? 'text-accent-success' : 'text-accent-error'
        )}>
          {status.running ? t('broadcast.running', 'Running') : t('broadcast.stopped', 'Stopped')}
        </span>
      </div>

      {/* 통계 카드들 */}
      <div className="flex items-center gap-3">
        {/* 대기 */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background-tertiary rounded-lg">
          <Activity className={cn(
            'w-4 h-4',
            isQueueCritical ? 'text-accent-error' : isQueueHigh ? 'text-accent-warning' : 'text-text-muted'
          )} />
          <span className="text-sm text-text-primary font-medium">
            {status.pending}
          </span>
          <span className="text-xs text-text-muted">
            / {status.max_size}
          </span>
        </div>

        {/* 처리율 */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background-tertiary rounded-lg">
          <span className="text-xs text-text-muted">{t('broadcast.rate', 'Rate')}</span>
          <span className="text-sm text-text-primary font-medium">
            {status.processing_rate.toFixed(1)}/s
          </span>
        </div>

        {/* 완료 */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background-tertiary rounded-lg">
          <CheckCircle className="w-4 h-4 text-accent-success" />
          <span className="text-sm text-text-primary font-medium">
            {status.total_processed}
          </span>
        </div>

        {/* 드롭 */}
        {status.total_dropped > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background-tertiary rounded-lg">
            <XCircle className="w-4 h-4 text-accent-error" />
            <span className="text-sm text-text-primary font-medium">
              {status.total_dropped}
            </span>
          </div>
        )}
      </div>

      {/* 설정 버튼 */}
      <div className="ml-auto">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => openSettings('broadcast')}
        >
          <Settings className="w-4 h-4 mr-1" />
          {t('broadcast.settings', 'Settings')}
        </Button>
      </div>
    </div>
  );
}
