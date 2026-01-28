/**
 * PrioritySettings Component
 *
 * Configuration UI for priority rules that control how chat and voice
 * inputs are prioritized and processed.
 */

import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { ListOrdered, Clock, Zap, MessageSquare } from 'lucide-react';
import { Switch, Slider, Select } from '../../../../shared/components';
import { usePriorityRules } from '../../hooks';
import {
  PRIORITY_MODE_OPTIONS,
  PRIORITY_VALIDATION_RULES,
  type PriorityMode,
} from '../../../../shared/types';

export function PrioritySettings() {
  const { t } = useTranslation();
  const {
    rules,
    isLoading,
    updateField,
    refreshRules,
  } = usePriorityRules();

  // Fetch rules on mount
  useEffect(() => {
    refreshRules();
  }, [refreshRules]);

  // Convert priority mode options to select format with translations
  const priorityModeOptions = PRIORITY_MODE_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey, option.label),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Priority Mode */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.priority.mode', 'Priority Mode')}
          </h3>
        </div>

        <Select
          label={t('settings.priority.modeLabel', 'Processing Mode')}
          description={t(
            'settings.priority.modeDesc',
            'How to prioritize chat vs voice inputs when they arrive simultaneously'
          )}
          value={rules.priority_mode}
          onValueChange={(v) => updateField('priority_mode', v as PriorityMode)}
          options={priorityModeOptions}
        />
      </div>

      {/* Timing Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.priority.timing', 'Timing Settings')}
          </h3>
        </div>

        <Slider
          label={t('settings.priority.waitTime', 'Wait Time')}
          description={t(
            'settings.priority.waitTimeDesc',
            'Time to wait before processing input (seconds)'
          )}
          value={[rules.wait_time]}
          onValueChange={([v]) => updateField('wait_time', v)}
          min={PRIORITY_VALIDATION_RULES.wait_time.min}
          max={PRIORITY_VALIDATION_RULES.wait_time.max}
          step={PRIORITY_VALIDATION_RULES.wait_time.step}
          formatValue={(v) => `${v}s`}
        />

        <Slider
          label={t('settings.priority.voiceChatDelay', 'Voice Active Chat Delay')}
          description={t(
            'settings.priority.voiceChatDelayDesc',
            'How long to queue chat messages when voice is active (seconds)'
          )}
          value={[rules.voice_active_chat_delay]}
          onValueChange={([v]) => updateField('voice_active_chat_delay', v)}
          min={PRIORITY_VALIDATION_RULES.voice_active_chat_delay.min}
          max={PRIORITY_VALIDATION_RULES.voice_active_chat_delay.max}
          step={PRIORITY_VALIDATION_RULES.voice_active_chat_delay.step}
          formatValue={(v) => `${v}s`}
        />

        <Slider
          label={t('settings.priority.chatVoiceDelay', 'Chat Active Voice Delay')}
          description={t(
            'settings.priority.chatVoiceDelayDesc',
            'How long to queue voice input when chat is being processed (seconds)'
          )}
          value={[rules.chat_active_voice_delay]}
          onValueChange={([v]) => updateField('chat_active_voice_delay', v)}
          min={PRIORITY_VALIDATION_RULES.chat_active_voice_delay.min}
          max={PRIORITY_VALIDATION_RULES.chat_active_voice_delay.max}
          step={PRIORITY_VALIDATION_RULES.chat_active_voice_delay.step}
          formatValue={(v) => `${v}s`}
        />
      </div>

      {/* Behavior Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.priority.behavior', 'Behavior')}
          </h3>
        </div>

        <Switch
          label={t('settings.priority.allowInterruption', 'Allow Interruption')}
          description={t(
            'settings.priority.allowInterruptionDesc',
            'Allow higher priority inputs to interrupt current processing'
          )}
          checked={rules.allow_interruption}
          onCheckedChange={(checked) => updateField('allow_interruption', checked)}
        />
      </div>

      {/* Superchat Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.priority.superchat', 'Superchat')}
          </h3>
        </div>

        <Switch
          label={t('settings.priority.superchatPriority', 'Superchat Always Priority')}
          description={t(
            'settings.priority.superchatPriorityDesc',
            'Superchats and donations are always processed first regardless of mode'
          )}
          checked={rules.superchat_always_priority}
          onCheckedChange={(checked) => updateField('superchat_always_priority', checked)}
        />
      </div>
    </div>
  );
}
