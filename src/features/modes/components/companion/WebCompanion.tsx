import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Settings, Send, GripHorizontal, Minus, Monitor, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../../../shared/store';
import { useWebSocket } from '../../../../shared/hooks';
import { Button, Input, SpeechBubble } from '../../../../shared/components';
import { Live2DCanvas } from '../../../character/components';
import { cn } from '../../../../shared/utils';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

/**
 * WebCompanion - Web 전용 컴패니언 UI
 *
 * Features:
 * - 전통적인 플로팅 윈도우 스타일
 * - 타이틀 바 + 최소화
 * - 정적 캐릭터 레이아웃
 * - 고정 입력 영역
 */
export function WebCompanion() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  // 윈도우 위치 및 크기
  const [windowPos, setWindowPos] = useState<Position>({ x: 100, y: 100 });
  const [windowSize] = useState<Size>({ width: 320, height: 480 });

  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // Store 상태
  const displayText = useAppStore((state) => state.conversation.displayText);
  const isTyping = useAppStore((state) => state.conversation.isTyping);
  const currentEmotion = useAppStore((state) => state.conversation.currentEmotion);
  const currentInput = useAppStore((state) => state.conversation.currentInput);
  const micEnabled = useAppStore((state) => state.media.microphone.enabled);
  const modelUrl = useAppStore((state) => state.character.model.modelUrl);
  const wsStatus = useAppStore((state) => state.connection.websocket.status);

  // Store 액션
  const toggleMicrophone = useAppStore((state) => state.toggleMicrophone);
  const setCurrentInput = useAppStore((state) => state.setCurrentInput);
  const openSettings = useAppStore((state) => state.openSettings);
  const setMode = useAppStore((state) => state.setMode);

  // WebSocket 훅
  const { sendMessage } = useWebSocket();

  // 드래그 핸들러 (윈도우 드래그)
  const handleWindowDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: windowPos.x,
      posY: windowPos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      setWindowPos({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSend = () => {
    if (currentInput.trim()) {
      sendMessage(currentInput.trim());
      setCurrentInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleModeChange = (mode: 'studio' | 'live') => {
    setMode(mode);
  };

  // 최소화 상태
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ left: windowPos.x, top: windowPos.y }}
        className="fixed z-50"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="w-16 h-16 rounded-full bg-background-secondary border-2 border-background-tertiary shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        >
          <span className="text-3xl">🎭</span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        left: windowPos.x,
        top: windowPos.y,
        width: windowSize.width,
        height: windowSize.height,
      }}
      className={cn(
        'fixed z-50 flex flex-col',
        'bg-background-secondary/95 backdrop-blur-md',
        'rounded-xl border border-background-tertiary shadow-2xl',
        'overflow-hidden'
      )}
    >
      {/* 타이틀 바 (드래그 영역) */}
      <div
        onMouseDown={handleWindowDragStart}
        className={cn(
          'flex items-center justify-between px-3 py-2',
          'bg-background-tertiary cursor-grab active:cursor-grabbing',
          'select-none'
        )}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-medium text-text-primary">
            {t('modes.companion')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleModeChange('studio')}
            className="p-1 rounded hover:bg-background-secondary text-text-muted hover:text-text-primary"
            title={t('modes.studio')}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleModeChange('live')}
            className="p-1 rounded hover:bg-background-secondary text-text-muted hover:text-text-primary"
            title={t('modes.live')}
          >
            <Radio className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded hover:bg-accent-warning/20 text-text-muted hover:text-accent-warning"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 캔버스 영역 */}
      <div className="flex-1 relative min-h-0">
        {modelUrl ? (
          <Live2DCanvas className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-background-tertiary flex items-center justify-center">
              <span className="text-4xl">🎭</span>
            </div>
          </div>
        )}

        {/* 말풍선 */}
        {displayText && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 max-w-[280px]">
            <SpeechBubble
              text={displayText}
              isTyping={isTyping}
              emotion={currentEmotion}
              typingSpeed={50}
              variant="compact"
            />
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="p-3 border-t border-background-tertiary">
        <div className="flex items-center gap-2">
          <Input
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('messages.placeholder')}
            disabled={wsStatus !== 'connected'}
            className="text-sm"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={!currentInput.trim() || wsStatus !== 'connected'}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* 하단 컨트롤 */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant={micEnabled ? 'primary' : 'ghost'}
            size="sm"
            onClick={toggleMicrophone}
            disabled={wsStatus !== 'connected'}
          >
            {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openSettings()}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
