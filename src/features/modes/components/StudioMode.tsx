import { useTranslation } from 'react-i18next';
import {
  Mic,
  MicOff,
  Square,
  Send,
  Settings,
  MessageSquare,
  Camera,
  Monitor,
  Radio,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../../../shared/store';
import { useWebSocket } from '../../../shared/hooks';
import { Button, Input, SpeechBubble } from '../../../shared/components';
import { Live2DCanvas } from '../../character/components';
import { QueueStatusCompact } from '../../broadcast/components';
import { cn } from '../../../shared/utils';

type ToolTab = 'chat' | 'camera' | 'screen' | 'live' | 'settings';

interface ToolTabConfig {
  id: ToolTab;
  icon: React.ReactNode;
  label: string;
}

export function StudioMode() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ToolTab | null>(null);
  const [panelExpanded, setPanelExpanded] = useState(false);

  // Store 상태
  const status = useAppStore((state) => state.conversation.status);
  const displayText = useAppStore((state) => state.conversation.displayText);
  const isTyping = useAppStore((state) => state.conversation.isTyping);
  const currentInput = useAppStore((state) => state.conversation.currentInput);
  const currentEmotion = useAppStore((state) => state.conversation.currentEmotion);
  const micEnabled = useAppStore((state) => state.media.microphone.enabled);
  const modelUrl = useAppStore((state) => state.character.model.modelUrl);
  const wsStatus = useAppStore((state) => state.connection.websocket.status);

  // Store 액션
  const toggleMicrophone = useAppStore((state) => state.toggleMicrophone);
  const setCurrentInput = useAppStore((state) => state.setCurrentInput);
  const openSettings = useAppStore((state) => state.openSettings);

  // WebSocket 훅
  const { sendMessage, interruptConversation } = useWebSocket();

  const toolTabs: ToolTabConfig[] = [
    { id: 'chat', icon: <MessageSquare className="w-5 h-5" />, label: t('tools.chat') },
    { id: 'camera', icon: <Camera className="w-5 h-5" />, label: t('tools.camera') },
    { id: 'screen', icon: <Monitor className="w-5 h-5" />, label: t('tools.screen') },
    { id: 'live', icon: <Radio className="w-5 h-5" />, label: t('tools.live') },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: t('tools.settings') },
  ];

  const handleSend = () => {
    if (currentInput.trim()) {
      sendMessage(currentInput.trim());
      setCurrentInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      interruptConversation();
    }
  };

  const handleTabClick = (tab: ToolTab) => {
    if (tab === 'settings') {
      openSettings();
      return;
    }
    if (activeTab === tab) {
      setPanelExpanded(!panelExpanded);
    } else {
      setActiveTab(tab);
      setPanelExpanded(true);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 캔버스 영역 - 남은 공간 모두 차지 */}
      <div className="flex-1 relative min-h-0 bg-background-primary">
        {/* Live2D 캔버스 또는 플레이스홀더 */}
        {modelUrl ? (
          <Live2DCanvas className="absolute inset-0" enableZoom enableDrag />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full bg-background-secondary flex items-center justify-center">
              <span className="text-6xl">🎭</span>
            </div>
          </div>
        )}

        {/* 말풍선 - 스튜디오 모드에서는 고정 위치 */}
        {displayText && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 max-w-lg">
            <SpeechBubble
              text={displayText}
              isTyping={isTyping}
              emotion={currentEmotion}
              typingSpeed={50}
            />
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="shrink-0 border-t border-background-tertiary bg-background-secondary p-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {/* 마이크 버튼 */}
          <Button
            variant={micEnabled ? 'primary' : 'secondary'}
            size="md"
            onClick={toggleMicrophone}
            aria-label={t('controls.microphone')}
            disabled={wsStatus !== 'connected'}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          {/* 중단 버튼 */}
          <Button
            variant="ghost"
            size="md"
            onClick={interruptConversation}
            disabled={status === 'idle'}
            aria-label={t('controls.stop')}
          >
            <Square className="w-5 h-5" />
          </Button>

          {/* 텍스트 입력 */}
          <div className="flex-1">
            <Input
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('messages.placeholder')}
              disabled={wsStatus !== 'connected'}
            />
          </div>

          {/* 전송 버튼 */}
          <Button
            variant="primary"
            size="md"
            onClick={handleSend}
            disabled={!currentInput.trim() || wsStatus !== 'connected'}
            aria-label={t('controls.send')}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 도구 탭 영역 */}
      <div className="shrink-0 border-t border-background-tertiary bg-background-primary">
        {/* 탭 헤더 */}
        <div className="flex items-center justify-center gap-1 p-2">
          {toolTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                activeTab === tab.id && panelExpanded
                  ? 'bg-accent-primary/20 text-accent-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-background-secondary'
              )}
            >
              {tab.icon}
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}

          {/* 패널 토글 */}
          {activeTab && (
            <button
              onClick={() => setPanelExpanded(!panelExpanded)}
              className="ml-4 p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary"
            >
              {panelExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* 탭 패널 */}
        {activeTab && panelExpanded && (
          <div className="border-t border-background-tertiary p-3 max-h-40 overflow-y-auto">
            {activeTab === 'chat' && (
              <div className="text-center text-text-muted py-4">
                <MessageSquare className="w-8 h-8 mx-auto mb-1 opacity-50" />
                <p className="text-sm">{t('tools.chatPlaceholder')}</p>
              </div>
            )}
            {activeTab === 'camera' && (
              <div className="text-center text-text-muted py-4">
                <Camera className="w-8 h-8 mx-auto mb-1 opacity-50" />
                <p className="text-sm">{t('tools.cameraPlaceholder')}</p>
              </div>
            )}
            {activeTab === 'screen' && (
              <div className="text-center text-text-muted py-4">
                <Monitor className="w-8 h-8 mx-auto mb-1 opacity-50" />
                <p className="text-sm">{t('tools.screenPlaceholder')}</p>
              </div>
            )}
            {activeTab === 'live' && (
              <QueueStatusCompact />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
