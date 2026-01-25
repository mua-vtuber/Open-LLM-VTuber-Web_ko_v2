import { useTranslation } from 'react-i18next';
import { Radio, Youtube, MessageCircle } from 'lucide-react';
import { useAppStore } from '../../../../shared/store';
import { Input, Switch, Slider } from '../../../../shared/components';

// Discord 아이콘 컴포넌트
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

const platformOptions = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'chzzk', label: 'Chzzk' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'discord', label: 'Discord' },
];

export function BroadcastSettings() {
  const { t } = useTranslation();

  const chatEnabled = useAppStore((state) => state.settings.broadcast.chatEnabled);
  const platforms = useAppStore((state) => state.settings.broadcast.platforms);
  const mentionTrigger = useAppStore((state) => state.settings.broadcast.mentionTrigger);
  const responseDelay = useAppStore((state) => state.settings.broadcast.responseDelay);
  const maxQueueSize = useAppStore((state) => state.settings.broadcast.maxQueueSize);
  // Discord
  const discordBotToken = useAppStore((state) => state.settings.broadcast.discordBotToken);
  const discordGuildId = useAppStore((state) => state.settings.broadcast.discordGuildId);
  const discordChannelId = useAppStore((state) => state.settings.broadcast.discordChannelId);
  // YouTube
  const youtubeVideoId = useAppStore((state) => state.settings.broadcast.youtubeVideoId);
  const youtubeApiKey = useAppStore((state) => state.settings.broadcast.youtubeApiKey);
  // Chzzk
  const chzzkChannelId = useAppStore((state) => state.settings.broadcast.chzzkChannelId);

  const updateBroadcastSettings = useAppStore((state) => state.updateBroadcastSettings);

  const togglePlatform = (platform: string) => {
    const currentPlatforms = platforms || [];
    const newPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter((p) => p !== platform)
      : [...currentPlatforms, platform];
    updateBroadcastSettings({ platforms: newPlatforms });
  };

  return (
    <div className="space-y-6">
      {/* Chat Integration */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.broadcast.chat')}
          </h3>
        </div>

        <Switch
          label={t('settings.broadcast.chatEnabled')}
          description={t('settings.broadcast.chatEnabledDesc')}
          checked={chatEnabled}
          onCheckedChange={(checked) => updateBroadcastSettings({ chatEnabled: checked })}
        />

        {chatEnabled && (
          <>
            <div className="space-y-2">
              <span className="text-sm font-medium text-text-primary">
                {t('settings.broadcast.platforms')}
              </span>
              <div className="flex gap-2">
                {platformOptions.map((platform) => (
                  <button
                    key={platform.value}
                    onClick={() => togglePlatform(platform.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      platforms?.includes(platform.value)
                        ? 'bg-accent-primary text-white'
                        : 'bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80'
                    }`}
                  >
                    {platform.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label={t('settings.broadcast.mentionTrigger')}
              description={t('settings.broadcast.mentionTriggerDesc')}
              value={mentionTrigger}
              onChange={(e) => updateBroadcastSettings({ mentionTrigger: e.target.value })}
              placeholder="@AI"
            />
          </>
        )}
      </div>

      {/* YouTube Settings */}
      {platforms?.includes('youtube') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-medium text-text-primary">
              {t('settings.broadcast.youtube')}
            </h3>
          </div>

          <Input
            label={t('settings.broadcast.youtubeVideoId')}
            description={t('settings.broadcast.youtubeVideoIdDesc')}
            value={youtubeVideoId}
            onChange={(e) => updateBroadcastSettings({ youtubeVideoId: e.target.value })}
            placeholder="dQw4w9WgXcQ"
          />

          <Input
            label={t('settings.broadcast.youtubeApiKey')}
            type="password"
            value={youtubeApiKey}
            onChange={(e) => updateBroadcastSettings({ youtubeApiKey: e.target.value })}
            placeholder="AIza..."
          />
        </div>
      )}

      {/* Chzzk Settings */}
      {platforms?.includes('chzzk') && (
        <div className="space-y-4">
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.broadcast.chzzk')}
          </h3>

          <Input
            label={t('settings.broadcast.chzzkChannelId')}
            value={chzzkChannelId}
            onChange={(e) => updateBroadcastSettings({ chzzkChannelId: e.target.value })}
            placeholder="Channel ID"
          />
        </div>
      )}

      {/* Discord Settings */}
      {platforms?.includes('discord') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DiscordIcon className="w-5 h-5 text-[#5865F2]" />
            <h3 className="text-base font-medium text-text-primary">
              {t('settings.broadcast.discord', 'Discord')}
            </h3>
          </div>

          <Input
            label={t('settings.broadcast.discordBotToken', 'Bot Token')}
            description={t('settings.broadcast.discordBotTokenDesc', 'Discord Developer Portal에서 생성한 봇 토큰')}
            type="password"
            value={discordBotToken}
            onChange={(e) => updateBroadcastSettings({ discordBotToken: e.target.value })}
            placeholder="MTIz..."
          />

          <Input
            label={t('settings.broadcast.discordGuildId', 'Server ID (Guild ID)')}
            description={t('settings.broadcast.discordGuildIdDesc', '봇이 메시지를 읽을 서버 ID')}
            value={discordGuildId}
            onChange={(e) => updateBroadcastSettings({ discordGuildId: e.target.value })}
            placeholder="123456789012345678"
          />

          <Input
            label={t('settings.broadcast.discordChannelId', 'Channel ID')}
            description={t('settings.broadcast.discordChannelIdDesc', '메시지를 모니터링할 채널 ID')}
            value={discordChannelId}
            onChange={(e) => updateBroadcastSettings({ discordChannelId: e.target.value })}
            placeholder="123456789012345678"
          />
        </div>
      )}

      {/* Queue Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-accent-primary" />
          <h3 className="text-base font-medium text-text-primary">
            {t('settings.broadcast.queue')}
          </h3>
        </div>

        <Slider
          label={t('settings.broadcast.responseDelay')}
          description={t('settings.broadcast.responseDelayDesc')}
          value={[responseDelay]}
          onValueChange={([v]) => updateBroadcastSettings({ responseDelay: v })}
          min={0}
          max={10}
          step={0.5}
          formatValue={(v) => `${v}s`}
        />

        <Slider
          label={t('settings.broadcast.maxQueueSize')}
          description={t('settings.broadcast.maxQueueSizeDesc')}
          value={[maxQueueSize]}
          onValueChange={([v]) => updateBroadcastSettings({ maxQueueSize: v })}
          min={5}
          max={50}
          step={5}
          formatValue={(v) => String(v)}
        />
      </div>
    </div>
  );
}
