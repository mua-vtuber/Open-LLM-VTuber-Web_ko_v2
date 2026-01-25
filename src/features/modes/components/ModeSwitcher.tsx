import { useTranslation } from 'react-i18next';
import { Monitor, Radio, MessageCircle } from 'lucide-react';
import { useAppStore } from '../../../shared/store';
import type { AppMode } from '../../../shared/types';
import { cn } from '../../../shared/utils';

interface ModeConfig {
  id: AppMode;
  icon: React.ReactNode;
  label: string;
  description: string;
  shortcut: string;
}

export function ModeSwitcher() {
  const { t } = useTranslation();
  const currentMode = useAppStore((state) => state.ui.mode);
  const setMode = useAppStore((state) => state.setMode);

  const modes: ModeConfig[] = [
    {
      id: 'studio',
      icon: <Monitor className="w-5 h-5" />,
      label: t('modes.studio'),
      description: t('modes.studioDesc'),
      shortcut: 'Ctrl+1',
    },
    {
      id: 'live',
      icon: <Radio className="w-5 h-5" />,
      label: t('modes.live'),
      description: t('modes.liveDesc'),
      shortcut: 'Ctrl+2',
    },
    {
      id: 'companion',
      icon: <MessageCircle className="w-5 h-5" />,
      label: t('modes.companion'),
      description: t('modes.companionDesc'),
      shortcut: 'Ctrl+3',
    },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-background-secondary rounded-lg">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => setMode(mode.id)}
          title={`${mode.description} (${mode.shortcut})`}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
            currentMode === mode.id
              ? 'bg-accent-primary text-white'
              : 'text-text-muted hover:text-text-primary hover:bg-background-tertiary'
          )}
        >
          {mode.icon}
          <span className="text-sm font-medium hidden sm:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
