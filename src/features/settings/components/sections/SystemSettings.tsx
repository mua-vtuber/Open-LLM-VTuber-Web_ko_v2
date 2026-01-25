import { useTranslation } from 'react-i18next';
import { Settings, Globe, Monitor, Info } from 'lucide-react';
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
  { value: 'system', label: 'System' },
];

export function SystemSettings() {
  const { t, i18n } = useTranslation();

  const websocketUrl = useAppStore((state) => state.settings.system.websocketUrl);
  const apiUrl = useAppStore((state) => state.settings.system.apiUrl);
  const debugMode = useAppStore((state) => state.settings.system.debugMode);
  const autoConnect = useAppStore((state) => state.settings.system.autoConnect);
  const theme = useAppStore((state) => state.settings.system.theme);
  const language = useAppStore((state) => state.settings.system.language);

  const updateSystemSettings = useAppStore((state) => state.updateSystemSettings);

  const handleLanguageChange = (lang: string) => {
    updateSystemSettings({ language: lang });
    i18n.changeLanguage(lang);
  };

  return (
    <div className="space-y-6">
      {/* Connection Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.system.connection')}
          </h3>
        </div>

        <Input
          label={t('settings.system.websocketUrl')}
          description={t('settings.system.websocketUrlDesc')}
          value={websocketUrl}
          onChange={(e) => updateSystemSettings({ websocketUrl: e.target.value })}
          placeholder="ws://localhost:12393/ws"
        />

        <Input
          label={t('settings.system.apiUrl')}
          description={t('settings.system.apiUrlDesc')}
          value={apiUrl}
          onChange={(e) => updateSystemSettings({ apiUrl: e.target.value })}
          placeholder="http://localhost:12393"
        />

        <Switch
          label={t('settings.system.autoConnect')}
          description={t('settings.system.autoConnectDesc')}
          checked={autoConnect}
          onCheckedChange={(checked) => updateSystemSettings({ autoConnect: checked })}
        />
      </div>

      {/* Appearance */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.system.appearance')}
          </h3>
        </div>

        <Select
          label={t('settings.system.theme')}
          value={theme}
          onValueChange={(v) => updateSystemSettings({ theme: v as 'dark' | 'light' | 'system' })}
          options={themeOptions}
        />
      </div>

      {/* Language */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.system.language')}
          </h3>
        </div>

        <Select
          label={t('settings.system.uiLanguage')}
          description={t('settings.system.uiLanguageDesc')}
          value={language}
          onValueChange={handleLanguageChange}
          options={languageOptions}
        />
      </div>

      {/* Developer */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.system.developer')}
          </h3>
        </div>

        <Switch
          label={t('settings.system.debugMode')}
          description={t('settings.system.debugModeDesc')}
          checked={debugMode}
          onCheckedChange={(checked) => updateSystemSettings({ debugMode: checked })}
        />
      </div>

      {/* Version Info */}
      <div className="rounded-lg bg-background-tertiary p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">{t('settings.system.version')}</span>
          <span className="text-text-primary font-mono">2.0.0-alpha</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">{t('settings.system.buildDate')}</span>
          <span className="text-text-primary font-mono">2024-01-24</span>
        </div>
      </div>
    </div>
  );
}
