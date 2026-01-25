import { useTranslation } from 'react-i18next';
import { Volume2, Mic } from 'lucide-react';
import { useAppStore } from '../../../../shared/store';
import { Switch, Slider, Select } from '../../../../shared/components';

const languageOptions = [
  { value: 'ko-KR', label: '한국어' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'zh-CN', label: '中文 (简体)' },
];

const vadSensitivityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function VoiceSettings() {
  const { t } = useTranslation();

  const volume = useAppStore((state) => state.settings.voice.volume);
  const rate = useAppStore((state) => state.settings.voice.rate);
  const pitch = useAppStore((state) => state.settings.voice.pitch);
  const sttLanguage = useAppStore((state) => state.settings.voice.sttLanguage);
  const autoListenEnabled = useAppStore((state) => state.settings.voice.autoListenEnabled);
  const vadSensitivity = useAppStore((state) => state.settings.voice.vadSensitivity);
  const echoCancellation = useAppStore((state) => state.settings.voice.echoCancellation);
  const noiseSuppression = useAppStore((state) => state.settings.voice.noiseSuppression);

  const updateVoiceSettings = useAppStore((state) => state.updateVoiceSettings);

  return (
    <div className="space-y-6">
      {/* TTS Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.voice.tts')}
          </h3>
        </div>

        <Slider
          label={t('settings.voice.volume')}
          value={[volume]}
          onValueChange={([v]) => updateVoiceSettings({ volume: v })}
          min={0}
          max={100}
          step={5}
          formatValue={(v) => `${v}%`}
        />

        <Slider
          label={t('settings.voice.rate')}
          description={t('settings.voice.rateDesc')}
          value={[rate]}
          onValueChange={([v]) => updateVoiceSettings({ rate: v })}
          min={0.5}
          max={2}
          step={0.1}
          formatValue={(v) => `${v}x`}
        />

        <Slider
          label={t('settings.voice.pitch')}
          description={t('settings.voice.pitchDesc')}
          value={[pitch]}
          onValueChange={([v]) => updateVoiceSettings({ pitch: v })}
          min={0.5}
          max={2}
          step={0.1}
          formatValue={(v) => `${v}x`}
        />
      </div>

      {/* STT Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.voice.stt')}
          </h3>
        </div>

        <Select
          label={t('settings.voice.sttLanguage')}
          description={t('settings.voice.sttLanguageDesc')}
          value={sttLanguage}
          onValueChange={(v) => updateVoiceSettings({ sttLanguage: v })}
          options={languageOptions}
        />

        <Switch
          label={t('settings.voice.autoListen')}
          description={t('settings.voice.autoListenDesc')}
          checked={autoListenEnabled}
          onCheckedChange={(checked) => updateVoiceSettings({ autoListenEnabled: checked })}
        />

        <Select
          label={t('settings.voice.vadSensitivity')}
          description={t('settings.voice.vadSensitivityDesc')}
          value={vadSensitivity}
          onValueChange={(v) => updateVoiceSettings({ vadSensitivity: v })}
          options={vadSensitivityOptions}
        />
      </div>

      {/* Audio Processing */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-text-primary">
          {t('settings.voice.audioProcessing')}
        </h3>

        <Switch
          label={t('settings.voice.echoCancellation')}
          description={t('settings.voice.echoCancellationDesc')}
          checked={echoCancellation}
          onCheckedChange={(checked) => updateVoiceSettings({ echoCancellation: checked })}
        />

        <Switch
          label={t('settings.voice.noiseSuppression')}
          description={t('settings.voice.noiseSuppressionDesc')}
          checked={noiseSuppression}
          onCheckedChange={(checked) => updateVoiceSettings({ noiseSuppression: checked })}
        />
      </div>
    </div>
  );
}
