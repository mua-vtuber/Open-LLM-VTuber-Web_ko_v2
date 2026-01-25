import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../shared/store';
import { useWebSocket, useKeyboardShortcuts, useAudio } from '../shared/hooks';
import type { AudioMessageData } from '../shared/hooks';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn, isElectron } from '../shared/utils';
import { StudioMode, LiveMode, CompanionMode, ModeSwitcher } from '../features/modes';
import { SettingsModal } from '../features/settings/components';
import { useCharacterMovement } from '../features/character/hooks';

/**
 * 메인 앱 컴포넌트
 * 모드에 따라 다른 레이아웃 렌더링
 */
export function App() {
  const { t } = useTranslation();

  // 키보드 단축키 활성화
  useKeyboardShortcuts();

  // 오디오 재생 및 립싱크
  const { addAudioTask } = useAudio();

  // 캐릭터 자동 이동 (설정에서 활성화 시)
  useCharacterMovement();

  // 오디오 메시지 핸들러
  const handleAudioMessage = useCallback(
    (data: AudioMessageData) => {
      addAudioTask({
        audioBase64: data.audioBase64,
        volumes: data.volumes,
        sliceLength: data.sliceLength,
      });
    },
    [addAudioTask]
  );

  // Store 상태
  const mode = useAppStore((state) => state.ui.mode);

  // Companion 모드에서 body 배경 투명화 (Electron)
  useEffect(() => {
    if (isElectron && mode === 'companion') {
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
    } else {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    }
  }, [mode]);

  const status = useAppStore((state) => state.conversation.status);
  const wsStatus = useAppStore((state) => state.connection.websocket.status);

  // WebSocket 훅 - 오디오 콜백 연결
  const { connect } = useWebSocket({
    onAudio: handleAudioMessage,
  });

  // 상태 표시 텍스트
  const statusText = t(`status.${status}`);

  // 연결 상태 아이콘
  const ConnectionIcon = wsStatus === 'connected' ? Wifi : WifiOff;
  const connectionColor =
    wsStatus === 'connected'
      ? 'text-accent-success'
      : wsStatus === 'connecting'
      ? 'text-accent-warning'
      : 'text-accent-error';

  // Companion 모드는 별도의 플로팅 윈도우로 렌더링
  if (mode === 'companion') {
    // Electron: 완전 투명 배경 (캐릭터만 보임)
    // 웹: 반투명 배경 (플로팅 윈도우)
    return (
      <>
        <div className={cn(
          'h-screen overflow-hidden',
          isElectron ? 'bg-transparent' : 'bg-background-primary/50'
        )}>
          {/* 웹에서만 배경 메시지 표시 */}
          {!isElectron && (
            <div className="flex items-center justify-center h-full">
              <p className="text-text-muted text-sm">
                {t('modes.companionActive')}
              </p>
            </div>
          )}
        </div>
        <CompanionMode />
        <SettingsModal />
      </>
    );
  }

  // Live 모드는 최소 UI로 렌더링
  if (mode === 'live') {
    return (
      <>
        <div className="h-screen bg-transparent overflow-hidden">
          <LiveMode />
        </div>
        <SettingsModal />
      </>
    );
  }

  // Studio 모드 (기본)
  return (
    <>
      <div className="h-screen flex flex-col bg-background-primary overflow-hidden">
        {/* 헤더 */}
        <header className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-background-tertiary">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-text-primary">
              {t('app.name')}
            </h1>
            <span className="text-xs text-text-muted">{t('app.version')}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* 연결 상태 */}
            <button
              onClick={wsStatus !== 'connected' ? connect : undefined}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
                wsStatus !== 'connected' && 'hover:bg-background-secondary cursor-pointer'
              )}
              title={t(`connection.${wsStatus}`)}
            >
              <ConnectionIcon className={cn('w-4 h-4', connectionColor)} />
              {wsStatus === 'connecting' && (
                <RefreshCw className="w-3 h-3 animate-spin text-accent-warning" />
              )}
            </button>

            {/* 모드 전환 */}
            <ModeSwitcher />

            {/* 상태 인디케이터 */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background-secondary">
              <span className={`status-dot status-${status}`} />
              <span className="text-sm text-text-secondary">{statusText}</span>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 min-h-0 overflow-hidden">
          <StudioMode />
        </main>
      </div>

      {/* 설정 모달 */}
      <SettingsModal />
    </>
  );
}
