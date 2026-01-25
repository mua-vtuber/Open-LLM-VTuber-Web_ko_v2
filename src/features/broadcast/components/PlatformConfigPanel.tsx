/**
 * Platform Config Panel
 * YouTube, Chzzk 등 플랫폼 설정 컴포넌트
 */

import { useTranslation } from 'react-i18next';
import { Youtube, Tv, Save, RotateCcw, AlertTriangle, Loader2, ExternalLink, CheckCircle } from 'lucide-react';
import { cn } from '../../../shared/utils';
import { Button, Input, Switch } from '../../../shared/components';
import { useLiveConfig } from '../hooks';
import { openChzzkAuth } from '../api';

interface PlatformConfigPanelProps {
  className?: string;
}

export function PlatformConfigPanel({ className }: PlatformConfigPanelProps) {
  const { t } = useTranslation();
  const {
    config,
    isDirty,
    isLoading,
    isSaving,
    error,
    updateField,
    save,
    reset,
  } = useLiveConfig();

  if (isLoading && !config) {
    return (
      <div className={cn('p-4 bg-background-secondary rounded-lg', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-background-tertiary rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-background-tertiary rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className={cn('p-4 bg-background-secondary rounded-lg', className)}>
        <div className="flex items-center gap-2 text-accent-error">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">{error || 'Failed to load config'}</span>
        </div>
      </div>
    );
  }

  const youtube = config.chat_monitor.youtube;
  const chzzk = config.chat_monitor.chzzk;

  const handleSave = async () => {
    await save();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
          {t('broadcast.platforms', 'Platforms')}
          {isDirty && (
            <span className="px-1.5 py-0.5 text-xs bg-accent-warning/20 text-accent-warning rounded">
              {t('broadcast.unsaved', 'Unsaved')}
            </span>
          )}
        </h3>
        {isDirty && (
          <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="p-2 bg-accent-error/10 border border-accent-error/30 rounded text-sm text-accent-error">
          {error}
        </div>
      )}

      {/* 채팅 모니터 전체 토글 */}
      <div className="p-4 bg-background-secondary rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-text-primary">
              {t('broadcast.chatMonitor', 'Chat Monitor')}
            </div>
            <div className="text-xs text-text-muted">
              {t('broadcast.chatMonitorDesc', '라이브 채팅 모니터링 활성화')}
            </div>
          </div>
          <Switch
            checked={config.chat_monitor.enabled}
            onCheckedChange={(checked) => updateField('chat_monitor.enabled', checked)}
          />
        </div>
      </div>

      {/* YouTube 설정 */}
      <div className="p-4 bg-background-secondary rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-text-primary">YouTube</span>
          </div>
          <Switch
            checked={youtube.enabled}
            onCheckedChange={(checked) => updateField('chat_monitor.youtube.enabled', checked)}
          />
        </div>

        {youtube.enabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">
                {t('broadcast.youtubeApiKey', 'API Key')}
              </label>
              <Input
                type="password"
                value={youtube.api_key}
                onChange={(e) => updateField('chat_monitor.youtube.api_key', e.target.value)}
                placeholder="AIza..."
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                {t('broadcast.youtubeChannelId', 'Channel ID')}
              </label>
              <Input
                value={youtube.channel_id}
                onChange={(e) => updateField('chat_monitor.youtube.channel_id', e.target.value)}
                placeholder="UC..."
                className="font-mono text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Chzzk 설정 */}
      <div className="p-4 bg-background-secondary rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-text-primary">Chzzk</span>
          </div>
          <Switch
            checked={chzzk.enabled}
            onCheckedChange={(checked) => updateField('chat_monitor.chzzk.enabled', checked)}
          />
        </div>

        {chzzk.enabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">
                {t('broadcast.chzzkChannelId', 'Channel ID')}
              </label>
              <Input
                value={chzzk.channel_id}
                onChange={(e) => updateField('chat_monitor.chzzk.channel_id', e.target.value)}
                placeholder="Channel ID..."
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                {t('broadcast.chzzkClientId', 'Client ID')}
              </label>
              <Input
                type="password"
                value={chzzk.client_id}
                onChange={(e) => updateField('chat_monitor.chzzk.client_id', e.target.value)}
                placeholder="Client ID..."
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                {t('broadcast.chzzkClientSecret', 'Client Secret')}
              </label>
              <Input
                type="password"
                value={chzzk.client_secret}
                onChange={(e) => updateField('chat_monitor.chzzk.client_secret', e.target.value)}
                placeholder="Client Secret..."
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                {t('broadcast.chzzkRedirectUri', 'Redirect URI')}
              </label>
              <Input
                value={chzzk.redirect_uri}
                onChange={(e) => updateField('chat_monitor.chzzk.redirect_uri', e.target.value)}
                placeholder="http://localhost:12393/chzzk/callback"
                className="font-mono text-sm"
              />
            </div>

            {/* OAuth 상태 및 버튼 */}
            <div className="pt-3 border-t border-background-tertiary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {chzzk.access_token ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-accent-success" />
                      <span className="text-sm text-accent-success">
                        {t('broadcast.oauthConnected', 'OAuth Connected')}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-accent-warning" />
                      <span className="text-sm text-accent-warning">
                        {t('broadcast.oauthNotConnected', 'OAuth Not Connected')}
                      </span>
                    </>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openChzzkAuth}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  {chzzk.access_token ? t('broadcast.reconnect', 'Reconnect') : t('broadcast.connect', 'Connect')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 추가 설정 */}
      <div className="p-4 bg-background-secondary rounded-lg">
        <h4 className="text-sm font-medium text-text-primary mb-3">
          {t('broadcast.advancedSettings', 'Advanced Settings')}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">
              {t('broadcast.maxRetries', 'Max Retries')}
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              value={config.chat_monitor.max_retries}
              onChange={(e) => updateField('chat_monitor.max_retries', parseInt(e.target.value) || 1)}
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">
              {t('broadcast.retryInterval', 'Retry Interval (s)')}
            </label>
            <Input
              type="number"
              min={10}
              max={3600}
              value={config.chat_monitor.retry_interval}
              onChange={(e) => updateField('chat_monitor.retry_interval', parseInt(e.target.value) || 10)}
              className="text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
