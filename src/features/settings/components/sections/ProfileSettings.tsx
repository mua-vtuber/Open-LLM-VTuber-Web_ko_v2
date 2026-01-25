import { useTranslation } from 'react-i18next';
import { User, Languages } from 'lucide-react';
import { Input, Textarea, Select } from '../../../../shared/components';
import { useAppStore } from '../../../../shared/store';

const languageOptions = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
];

export function ProfileSettings() {
  const { t } = useTranslation();

  const language = useAppStore((state) => state.settings.system.language);
  const updateSystemSettings = useAppStore((state) => state.updateSystemSettings);

  return (
    <div className="space-y-6">
      {/* User Profile */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.profile.userInfo', 'User Information')}
          </h3>
        </div>

        <Input
          label={t('settings.profile.username', 'Username')}
          description={t('settings.profile.usernameDesc', 'Your display name in conversations')}
          placeholder={t('settings.profile.usernamePlaceholder', 'Enter your name')}
        />

        <Textarea
          label={t('settings.profile.bio', 'Bio')}
          description={t('settings.profile.bioDesc', 'Tell the AI about yourself (optional)')}
          placeholder={t('settings.profile.bioPlaceholder', 'I like...')}
          rows={3}
        />
      </div>

      {/* Language Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.profile.language', 'Language')}
          </h3>
        </div>

        <Select
          label={t('settings.profile.displayLanguage', 'Display Language')}
          description={t('settings.profile.displayLanguageDesc', 'Language for the user interface')}
          value={language}
          onValueChange={(v) => updateSystemSettings({ language: v })}
          options={languageOptions}
        />
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-accent-primary/10 border border-accent-primary/20 p-4">
        <p className="text-sm text-text-secondary">
          {t('settings.profile.note', 'API keys and model settings have been moved to the AI settings section.')}
        </p>
      </div>
    </div>
  );
}
