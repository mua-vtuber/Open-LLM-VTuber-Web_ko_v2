/**
 * Priority Rules Panel
 * 우선순위 규칙 설정 컴포넌트
 */

import { useTranslation } from 'react-i18next';
import { Settings, Save, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../../shared/utils';
import { Button, Switch } from '../../../shared/components';
import { usePriorityRules } from '../hooks';
import type { PriorityMode } from '../types';

interface PriorityRulesPanelProps {
  className?: string;
}

const PRIORITY_MODES: { value: PriorityMode; label: string; description: string }[] = [
  {
    value: 'balanced',
    label: 'Balanced',
    description: '채팅과 음성을 균형있게 처리',
  },
  {
    value: 'chat_first',
    label: 'Chat First',
    description: '채팅 메시지를 우선 처리',
  },
  {
    value: 'voice_first',
    label: 'Voice First',
    description: '음성 입력을 우선 처리',
  },
  {
    value: 'superchat_priority',
    label: 'Superchat Priority',
    description: '슈퍼챗/후원을 최우선 처리',
  },
];

export function PriorityRulesPanel({ className }: PriorityRulesPanelProps) {
  const { t } = useTranslation();
  const {
    rules,
    isDirty,
    isLoading,
    isSaving,
    error,
    updateField,
    save,
    reset,
  } = usePriorityRules();

  if (isLoading && !rules) {
    return (
      <div className={cn('p-4 bg-background-secondary rounded-lg', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-background-tertiary rounded w-1/3" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-background-tertiary rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!rules) {
    return (
      <div className={cn('p-4 bg-background-secondary rounded-lg', className)}>
        <div className="flex items-center gap-2 text-accent-error">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">{error || 'Failed to load priority rules'}</span>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    await save();
  };

  return (
    <div className={cn('p-4 bg-background-secondary rounded-lg', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Settings className="w-4 h-4" />
          {t('broadcast.priorityRules', 'Priority Rules')}
          {isDirty && (
            <span className="px-1.5 py-0.5 text-xs bg-accent-warning/20 text-accent-warning rounded">
              {t('broadcast.unsaved', 'Unsaved')}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {isDirty && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={isSaving}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mb-4 p-2 bg-accent-error/10 border border-accent-error/30 rounded text-sm text-accent-error">
          {error}
        </div>
      )}

      {/* 우선순위 모드 */}
      <div className="mb-4">
        <label className="block text-xs text-text-muted mb-2">
          {t('broadcast.priorityMode', 'Priority Mode')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRIORITY_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => updateField('priority_mode', mode.value)}
              className={cn(
                'p-2 rounded-lg border text-left transition-colors',
                rules.priority_mode === mode.value
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-background-tertiary hover:border-text-muted'
              )}
            >
              <div className="text-sm font-medium text-text-primary">
                {mode.label}
              </div>
              <div className="text-xs text-text-muted">
                {mode.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 대기 시간 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-text-muted">
            {t('broadcast.waitTime', 'Wait Time')}
          </label>
          <span className="text-xs text-text-primary font-medium">
            {rules.wait_time}s
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={30}
          step={0.5}
          value={rules.wait_time}
          onChange={(e) => updateField('wait_time', parseFloat(e.target.value))}
          className="w-full h-2 bg-background-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
        />
      </div>

      {/* 토글 옵션들 */}
      <div className="space-y-3">
        {/* 중단 허용 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-text-primary">
              {t('broadcast.allowInterruption', 'Allow Interruption')}
            </div>
            <div className="text-xs text-text-muted">
              {t('broadcast.allowInterruptionDesc', '진행 중인 대화를 중단 가능')}
            </div>
          </div>
          <Switch
            checked={rules.allow_interruption}
            onCheckedChange={(checked) => updateField('allow_interruption', checked)}
          />
        </div>

        {/* 슈퍼챗 항상 우선 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-text-primary">
              {t('broadcast.superchatAlways', 'Superchat Always Priority')}
            </div>
            <div className="text-xs text-text-muted">
              {t('broadcast.superchatAlwaysDesc', '슈퍼챗은 항상 우선 처리')}
            </div>
          </div>
          <Switch
            checked={rules.superchat_always_priority}
            onCheckedChange={(checked) => updateField('superchat_always_priority', checked)}
          />
        </div>
      </div>

      {/* 딜레이 설정 */}
      <div className="mt-4 pt-4 border-t border-background-tertiary space-y-4">
        {/* 음성 활성 시 채팅 딜레이 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-text-muted">
              {t('broadcast.voiceActiveChatDelay', 'Chat delay when voice active')}
            </label>
            <span className="text-xs text-text-primary font-medium">
              {rules.voice_active_chat_delay}s
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={rules.voice_active_chat_delay}
            onChange={(e) => updateField('voice_active_chat_delay', parseFloat(e.target.value))}
            className="w-full h-2 bg-background-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
          />
        </div>

        {/* 채팅 활성 시 음성 딜레이 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-text-muted">
              {t('broadcast.chatActiveVoiceDelay', 'Voice delay when chat active')}
            </label>
            <span className="text-xs text-text-primary font-medium">
              {rules.chat_active_voice_delay}s
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={rules.chat_active_voice_delay}
            onChange={(e) => updateField('chat_active_voice_delay', parseFloat(e.target.value))}
            className="w-full h-2 bg-background-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
          />
        </div>
      </div>
    </div>
  );
}
