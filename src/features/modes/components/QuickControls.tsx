import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Square, Volume2, Zap, Settings, X, Monitor, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../../shared/store';
import { useWebSocket } from '../../../shared/hooks';
import { Slider } from '../../../shared/components';
import { cn } from '../../../shared/utils';

export function QuickControls() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const status = useAppStore((state) => state.conversation.status);
  const micEnabled = useAppStore((state) => state.media.microphone.enabled);
  const volume = useAppStore((state) => state.settings.voice.volume);

  const toggleMicrophone = useAppStore((state) => state.toggleMicrophone);
  const updateVoiceSettings = useAppStore((state) => state.updateVoiceSettings);
  const openSettings = useAppStore((state) => state.openSettings);
  const setMode = useAppStore((state) => state.setMode);

  const { interruptConversation } = useWebSocket();

  const controls = [
    {
      id: 'mic',
      icon: micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />,
      label: t('controls.microphone'),
      onClick: toggleMicrophone,
      active: micEnabled,
    },
    {
      id: 'stop',
      icon: <Square className="w-5 h-5" />,
      label: t('controls.stop'),
      onClick: interruptConversation,
      disabled: status === 'idle',
    },
    {
      id: 'volume',
      icon: <Volume2 className="w-5 h-5" />,
      label: t('controls.volume'),
      onClick: () => setShowVolumeSlider(!showVolumeSlider),
    },
    {
      id: 'quick',
      icon: <Zap className="w-5 h-5" />,
      label: t('controls.quickReaction'),
      onClick: () => {},
    },
    {
      id: 'settings',
      icon: <Settings className="w-5 h-5" />,
      label: t('controls.settings'),
      onClick: () => openSettings(),
    },
  ];

  const modeControls = [
    {
      id: 'studio',
      icon: <Monitor className="w-5 h-5" />,
      label: t('modes.studio'),
      onClick: () => setMode('studio'),
    },
    {
      id: 'companion',
      icon: <MessageCircle className="w-5 h-5" />,
      label: t('modes.companion'),
      onClick: () => setMode('companion'),
    },
  ];

  return (
    <div className="fixed bottom-8 left-8 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-background-secondary/95 backdrop-blur-md rounded-xl border border-background-tertiary shadow-lg p-2"
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background-tertiary flex items-center justify-center text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              {controls.map((control) => (
                <button
                  key={control.id}
                  onClick={control.onClick}
                  disabled={control.disabled}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    'text-left text-sm',
                    control.active
                      ? 'bg-accent-primary text-white'
                      : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary',
                    control.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {control.icon}
                  <span>{control.label}</span>
                </button>
              ))}

              {/* 볼륨 슬라이더 */}
              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 py-2">
                      <Slider
                        value={[volume]}
                        onValueChange={([v]) => updateVoiceSettings({ volume: v })}
                        min={0}
                        max={100}
                        step={5}
                        formatValue={(v) => `${v}%`}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 모드 전환 구분선 */}
              <div className="border-t border-background-tertiary my-2" />

              {/* 모드 전환 버튼 */}
              {modeControls.map((mode) => (
                <button
                  key={mode.id}
                  onClick={mode.onClick}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    'text-left text-sm',
                    'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
                  )}
                >
                  {mode.icon}
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseEnter={() => setIsOpen(true)}
            onClick={() => setIsOpen(true)}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'bg-background-secondary/80 backdrop-blur-sm border border-background-tertiary',
              'text-text-muted hover:text-text-primary hover:bg-background-secondary',
              'transition-all duration-200 shadow-lg'
            )}
          >
            <div className="w-3 h-3 rounded-full bg-accent-primary animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
