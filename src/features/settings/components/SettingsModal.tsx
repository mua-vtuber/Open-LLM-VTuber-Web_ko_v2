import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, User, Palette, Mic, Bot, Brain, Radio, Settings as SettingsIcon, ChevronRight, ListOrdered } from 'lucide-react';
import { useAppStore } from '../../../shared/store';
import { cn, isElectron, companionMouse } from '../../../shared/utils';
import { Button, Toast } from '../../../shared/components';
import {
  ProfileSettings,
  CharacterSettings,
  VoiceSettings,
  AISettings,
  MemorySettings,
  BroadcastSettings,
  SystemSettings,
  PrioritySettings,
} from './sections';
import { useConfigSync, usePriorityRules } from '../hooks';

interface SettingsSectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isActive?: boolean;
}

function SettingsSection({ icon, title, description, onClick, isActive }: SettingsSectionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-lg text-left transition-colors',
        'hover:bg-background-tertiary',
        isActive && 'bg-background-tertiary'
      )}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center text-accent-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-text-primary">{title}</h3>
        <p className="text-sm text-text-muted truncate">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-text-muted" />
    </button>
  );
}

export function SettingsModal() {
  const { t } = useTranslation();

  const isOpen = useAppStore((state) => state.ui.settingsOpen);
  const section = useAppStore((state) => state.ui.settingsSection);
  const closeSettings = useAppStore((state) => state.closeSettings);
  const openSettings = useAppStore((state) => state.openSettings);
  const mode = useAppStore((state) => state.ui.mode);

  // 설정 동기화 훅
  const { isSaving: isConfigSaving, error: configError, success: configSuccess, saveAllSettings, clearError: clearConfigError, clearSuccess: clearConfigSuccess } = useConfigSync();

  // 우선순위 규칙 훅
  const { isSaving: isPrioritySaving, error: priorityError, success: prioritySuccess, saveRules: savePriorityRules, clearError: clearPriorityError, clearSuccess: clearPrioritySuccess, hasChanges: hasPriorityChanges } = usePriorityRules();

  // 통합 상태
  const isSaving = isConfigSaving || isPrioritySaving;
  const error = configError || priorityError;
  const success = configSuccess || prioritySuccess;

  const clearError = () => {
    clearConfigError();
    clearPriorityError();
  };

  const clearSuccess = () => {
    clearConfigSuccess();
    clearPrioritySuccess();
  };

  // 저장 핸들러
  const handleSave = async () => {
    // AI 설정 저장
    await saveAllSettings();

    // 우선순위 규칙에 변경사항이 있으면 저장
    if (hasPriorityChanges) {
      await savePriorityRules();
    }
  };

  // Companion 모드에서 모달이 열려있는 동안 항상 hover 상태 유지
  // (드롭다운 등 포털 요소가 hover 영역 밖에 렌더링되어도 클릭 가능하도록)
  useEffect(() => {
    if (isElectron && mode === 'companion' && isOpen) {
      companionMouse.updateHover('settingsModal', true);
      return () => {
        companionMouse.updateHover('settingsModal', false);
      };
    }
  }, [isOpen, mode]);

  const sections = [
    {
      id: 'profile',
      icon: <User className="w-5 h-5" />,
      title: t('settings.profile.title'),
      description: t('settings.profile.description'),
    },
    {
      id: 'character',
      icon: <Palette className="w-5 h-5" />,
      title: t('settings.character.title'),
      description: t('settings.character.description'),
    },
    {
      id: 'voice',
      icon: <Mic className="w-5 h-5" />,
      title: t('settings.voice.title'),
      description: t('settings.voice.description'),
    },
    {
      id: 'ai',
      icon: <Bot className="w-5 h-5" />,
      title: t('settings.ai.title'),
      description: t('settings.ai.description'),
    },
    {
      id: 'memory',
      icon: <Brain className="w-5 h-5" />,
      title: t('settings.memory.title', '메모리'),
      description: t('settings.memory.description', '대화 기억 및 방문자 프로필'),
    },
    {
      id: 'broadcast',
      icon: <Radio className="w-5 h-5" />,
      title: t('settings.broadcast.title'),
      description: t('settings.broadcast.description'),
    },
    {
      id: 'priority',
      icon: <ListOrdered className="w-5 h-5" />,
      title: t('settings.priority.title', 'Priority Rules'),
      description: t('settings.priority.description', 'Chat and voice input priority settings'),
    },
    {
      id: 'system',
      icon: <SettingsIcon className="w-5 h-5" />,
      title: t('settings.system.title'),
      description: t('settings.system.description'),
    },
  ];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeSettings()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in z-40" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-background-secondary rounded-xl shadow-xl overflow-hidden animate-scale-in z-50"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-background-tertiary">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              {section ? (
                <button
                  onClick={() => openSettings()}
                  className="flex items-center gap-2 hover:text-accent-primary transition-colors"
                >
                  <span>←</span>
                  <span>{t('settings.title')}</span>
                  <span className="text-text-muted">/</span>
                  <span>{t(`settings.${section}.title`)}</span>
                </button>
              ) : (
                t('settings.title')
              )}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm" aria-label="Close">
                <X className="w-5 h-5" />
              </Button>
            </Dialog.Close>
          </div>

          {/* 콘텐츠 */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-130px)]">
            {!section ? (
              // 메인 메뉴
              <div className="space-y-2">
                {sections.map((sec) => (
                  <SettingsSection
                    key={sec.id}
                    {...sec}
                    onClick={() => openSettings(sec.id)}
                    isActive={section === sec.id}
                  />
                ))}
              </div>
            ) : (
              // 섹션 상세
              <div>
                {section === 'profile' && <ProfileSettings />}
                {section === 'character' && <CharacterSettings />}
                {section === 'voice' && <VoiceSettings />}
                {section === 'ai' && <AISettings />}
                {section === 'memory' && <MemorySettings />}
                {section === 'broadcast' && <BroadcastSettings />}
                {section === 'priority' && <PrioritySettings />}
                {section === 'system' && <SystemSettings />}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-background-tertiary bg-background-primary/50">
            <Button variant="ghost" onClick={closeSettings}>
              {t('settings.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              isLoading={isSaving}
            >
              {isSaving ? t('settings.saving', '저장 중...') : t('settings.save')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Toast 알림 */}
      {success && (
        <Toast
          type="success"
          message={success}
          onClose={clearSuccess}
        />
      )}
      {error && (
        <Toast
          type="error"
          message={error}
          onClose={clearError}
        />
      )}
    </Dialog.Root>
  );
}
