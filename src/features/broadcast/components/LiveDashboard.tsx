/**
 * Live Dashboard
 * 방송 관련 모든 설정을 통합한 대시보드
 */

import { useTranslation } from 'react-i18next';
import { Radio } from 'lucide-react';
import { cn } from '../../../shared/utils';
import { QueueStatusPanel } from './QueueStatusPanel';
import { PriorityRulesPanel } from './PriorityRulesPanel';
import { PlatformConfigPanel } from './PlatformConfigPanel';

interface LiveDashboardProps {
  className?: string;
}

export function LiveDashboard({ className }: LiveDashboardProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-background-tertiary">
        <Radio className="w-5 h-5 text-accent-primary" />
        <h2 className="text-lg font-semibold text-text-primary">
          {t('broadcast.dashboard', 'Live Dashboard')}
        </h2>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* 큐 상태 */}
          <section>
            <QueueStatusPanel />
          </section>

          {/* 우선순위 규칙 */}
          <section>
            <PriorityRulesPanel />
          </section>

          {/* 플랫폼 설정 */}
          <section>
            <PlatformConfigPanel />
          </section>
        </div>
      </div>
    </div>
  );
}
