import { useTranslation } from 'react-i18next';
import { Settings, Globe, Monitor, Info } from 'lucide-react';
import CONFIG from '../../../../shared/config';
import { useAppStore } from '../../../../shared/store';
import { Input, Switch, Select } from '../../../../shared/components';

const languageOptions = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
];

const themeOptions = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

export function SystemSettings() {
  const { t } = useTranslation();
  
  const language = useAppStore((state) => state.settings.system.language);
  const theme = useAppStore((state) => state.settings.system.theme);
  const developerMode = useAppStore((state) => state.settings.system.developerMode);
  const debugMode = useAppStore((state) => state.settings.system.debugMode);
  const autoConnect = useAppStore((state) => state.settings.system.autoConnect);
  const websocketUrl = useAppStore((state) => state.settings.system.websocketUrl);
  const apiUrl = useAppStore((state) => state.settings.system.apiUrl);

  const updateSystemSettings = useAppStore((state) => state.updateSystemSettings);

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-text-primary flex items-center gap-2">
          <Settings className="w-4 h-4" />
          {t('settings.system.general')}
        </h3>
        
        <Select
          label={t('settings.system.language')}
          value={language}
          onValueChange={(value) => updateSystemSettings({ language: value })}
          options={languageOptions}
          icon={<Globe className="w-4 h-4" />}
        />

        <Select
          label={t('settings.system.theme')}
          value={theme}
          onValueChange={(value) => updateSystemSettings({ theme: value as 'dark' | 'light' })}
          options={themeOptions}
          icon={<Monitor className="w-4 h-4" />}
        />
      </div>

      {/* Connection Settings */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-text-primary flex items-center gap-2">
          <Settings className="w-4 h-4" />
          {t('settings.system.connection')}
        </h3>

        <Switch
          label={t('settings.system.autoConnect')}
          checked={autoConnect}
          onCheckedChange={(checked) => updateSystemSettings({ autoConnect: checked })}
        />

        <Input
          label={t('settings.system.websocketUrl')}
          value={websocketUrl}
          onChange={(e) => updateSystemSettings({ websocketUrl: e.target.value })}
          placeholder={CONFIG.wsUrl}
        />

        <Input
          label={t('settings.system.apiUrl')}
          value={apiUrl}
          onChange={(e) => updateSystemSettings({ apiUrl: e.target.value })}
          placeholder={CONFIG.apiUrl}
        />
      </div>

      {/* Developer Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-text-primary flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            {t('settings.system.developer')}
          </h3>
        </div>

        <div className="p-3 bg-surface-secondary rounded-lg space-y-4">
          <Switch
            label={t('settings.system.developerMode')}
            checked={developerMode}
            onCheckedChange={(checked) => updateSystemSettings({ developerMode: checked })}
          />

          {developerMode && (
            <Switch
              label={t('settings.system.debugMode')}
              checked={debugMode}
              onCheckedChange={(checked) => updateSystemSettings({ debugMode: checked })}
            />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-accent-primary/10 rounded-lg flex gap-3 text-sm text-text-secondary">
        <Info className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>{t('settings.system.infoMessage')}</p>
          <p className="text-xs opacity-70">Version 2.0.0</p>
        </div>
      </div>
    </div>
  );
}