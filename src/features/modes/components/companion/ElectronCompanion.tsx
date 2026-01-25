import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Settings, Send, GripHorizontal, Monitor, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../../../shared/store';
import { useWebSocket } from '../../../../shared/hooks';
import { Button, Input, SpeechBubble } from '../../../../shared/components';
import { Live2DCanvas } from '../../../character/components';
import { cn, companionMouse } from '../../../../shared/utils';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

/**
 * ElectronCompanion - Electron 전용 컴패니언 UI
 *
 * Features:
 * - 전체 화면 투명 오버레이
 * - 자동 이동 캐릭터 (store position 기반)
 * - 분리된 메뉴 패널 (드래그 가능)
 * - 경계 제한 speech bubble
 * - companionMouse hover 통합
 */
export function ElectronCompanion() {
  const { t } = useTranslation();
  const characterRef = useRef<HTMLDivElement>(null);

  // 메뉴 패널 위치 (드래그 가능, 화면 우하단 기본값)
  const [menuPos, setMenuPos] = useState<Position>(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth - 350 : 100,
    y: typeof window !== 'undefined' ? window.innerHeight - 450 : 100,
  }));
  const [characterSize] = useState<Size>({ width: 300, height: 400 });

  const [isDragging, setIsDragging] = useState(false);
  const [showInputPanel, setShowInputPanel] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // Store 상태
  const displayText = useAppStore((state) => state.conversation.displayText);
  const isTyping = useAppStore((state) => state.conversation.isTyping);
  const currentEmotion = useAppStore((state) => state.conversation.currentEmotion);
  const currentInput = useAppStore((state) => state.conversation.currentInput);
  const micEnabled = useAppStore((state) => state.media.microphone.enabled);
  const modelUrl = useAppStore((state) => state.character.model.modelUrl);
  const wsStatus = useAppStore((state) => state.connection.websocket.status);
  // 캐릭터 자동 이동용 (store에서 가져옴)
  const storeCharacterPosition = useAppStore((state) => state.character.model.position);
  const movementMode = useAppStore((state) => state.settings.character.movementMode) ?? 'disabled';
  const movementTransitionDuration = useAppStore((state) => state.character.movement.transitionDuration) ?? 0;

  // Store 액션
  const toggleMicrophone = useAppStore((state) => state.toggleMicrophone);
  const setCurrentInput = useAppStore((state) => state.setCurrentInput);
  const openSettings = useAppStore((state) => state.openSettings);
  const setMode = useAppStore((state) => state.setMode);
  const updateCharacterPosition = useAppStore((state) => state.updateCharacterPosition);

  // WebSocket 훅
  const { sendMessage } = useWebSocket();

  // 컴포넌트 호버 처리
  const handleComponentHover = useCallback((componentId: string, isHovering: boolean) => {
    companionMouse.updateHover(componentId, isHovering);
  }, []);

  // 입력 패널이 열려있는 동안 hover 상태 유지
  useEffect(() => {
    if (showInputPanel) {
      companionMouse.updateHover('inputPanel', true);
      return () => {
        companionMouse.updateHover('inputPanel', false);
      };
    }
  }, [showInputPanel]);

  // 컴패니언 모드 진입 시 캐릭터 초기 위치 설정 (화면 중앙 하단)
  useEffect(() => {
    if (storeCharacterPosition.x === 0 && storeCharacterPosition.y === 0) {
      const characterWidth = 300;
      const characterHeight = 400;
      const initialX = (window.innerWidth - characterWidth) / 2;
      const initialY = window.innerHeight - characterHeight - 100;
      updateCharacterPosition(initialX, initialY);
    }
  }, [storeCharacterPosition.x, storeCharacterPosition.y, updateCharacterPosition]);

  // 드래그 핸들러 (메뉴 패널 드래그)
  const handleMenuDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: menuPos.x,
      posY: menuPos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      setMenuPos({
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
    if (e.key === 'Escape') {
      setShowInputPanel(false);
    }
  };

  const handleModeChange = (mode: 'studio' | 'live') => {
    setMode(mode);
  };

  // 캐릭터 transition 시간 (store에서 계산된 값 사용)
  const transitionDuration = movementMode !== 'disabled' && movementTransitionDuration > 0
    ? movementTransitionDuration
    : 0.3;

  // 캐릭터의 실제 위치: store의 절대 좌표 사용 (메뉴와 독립)
  const actualCharacterX = storeCharacterPosition.x;
  const actualCharacterY = storeCharacterPosition.y;

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* 메뉴 패널 (캐릭터와 분리, 사용자가 배치한 위치에 고정) */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          left: menuPos.x + characterSize.width + 8,
          top: menuPos.y + characterSize.height / 2 - 80,
        }}
        className="absolute pointer-events-auto flex flex-col gap-2"
        onMouseEnter={() => handleComponentHover('quickButtons', true)}
        onMouseLeave={() => handleComponentHover('quickButtons', false)}
      >
        {/* 드래그 핸들 */}
        <div
          className="w-10 h-10 rounded-full bg-background-secondary/90 backdrop-blur shadow-lg flex items-center justify-center text-text-muted cursor-grab active:cursor-grabbing"
          onMouseDown={handleMenuDragStart}
          title="Drag to move menu"
        >
          <GripHorizontal className="w-5 h-5" />
        </div>
        <button
          onClick={() => setShowInputPanel(!showInputPanel)}
          className={cn(
            'w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all',
            showInputPanel
              ? 'bg-accent-primary text-white'
              : 'bg-background-secondary/90 backdrop-blur text-text-primary hover:bg-background-tertiary'
          )}
          title={t('chat.toggle')}
        >
          <MessageSquare className="w-5 h-5" />
        </button>
        <button
          onClick={toggleMicrophone}
          disabled={wsStatus !== 'connected'}
          className={cn(
            'w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all',
            micEnabled
              ? 'bg-accent-primary text-white'
              : 'bg-background-secondary/90 backdrop-blur text-text-primary hover:bg-background-tertiary',
            wsStatus !== 'connected' && 'opacity-50 cursor-not-allowed'
          )}
          title={micEnabled ? t('mic.disable') : t('mic.enable')}
        >
          {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          onClick={() => openSettings()}
          className="w-10 h-10 rounded-full bg-background-secondary/90 backdrop-blur shadow-lg flex items-center justify-center text-text-primary hover:bg-background-tertiary transition-all"
          title={t('settings.title')}
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleModeChange('studio')}
          className="w-10 h-10 rounded-full bg-background-secondary/90 backdrop-blur shadow-lg flex items-center justify-center text-text-primary hover:bg-background-tertiary transition-all"
          title={t('modes.studio')}
        >
          <Monitor className="w-5 h-5" />
        </button>
      </motion.div>

      {/* 캐릭터 영역 (자동 이동, store position 사용) */}
      <div
        ref={characterRef}
        style={{
          left: actualCharacterX,
          top: actualCharacterY,
          width: characterSize.width,
          height: characterSize.height,
          transition: `left ${transitionDuration}s ease-in-out, top ${transitionDuration}s ease-in-out`,
        }}
        className="absolute pointer-events-auto"
        onMouseEnter={() => handleComponentHover('character', true)}
        onMouseLeave={() => handleComponentHover('character', false)}
      >
        {/* 캐릭터 캔버스 */}
        <div className="w-full h-full">
          {modelUrl ? (
            <Live2DCanvas className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-background-secondary/80 backdrop-blur flex items-center justify-center shadow-xl">
                <span className="text-5xl">🎭</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 말풍선 (캐릭터와 별도, 화면 경계 내 클램핑) */}
      <AnimatePresence>
        {displayText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              // 기본 위치: 캐릭터 중앙 상단
              // 화면 경계 내로 클램핑 (padding 20px)
              left: Math.max(20, Math.min(
                actualCharacterX + characterSize.width / 2 - 140, // 말풍선 너비 280px의 절반
                window.innerWidth - 300
              )),
              top: Math.max(20, actualCharacterY - 80), // 말풍선 높이 약 60-80px
              transition: `left ${transitionDuration}s ease-in-out, top ${transitionDuration}s ease-in-out`,
            }}
            className="absolute w-[280px] z-10 pointer-events-auto"
            onMouseEnter={() => handleComponentHover('bubble', true)}
            onMouseLeave={() => handleComponentHover('bubble', false)}
          >
            <SpeechBubble
              text={displayText}
              isTyping={isTyping}
              emotion={currentEmotion}
              typingSpeed={50}
              variant="compact"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 입력 패널 (메뉴 위치 기준으로 표시) */}
      <AnimatePresence>
        {showInputPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              left: menuPos.x + characterSize.width + 60,
              top: menuPos.y + characterSize.height / 2 - 40,
            }}
            className="absolute w-80 pointer-events-auto"
            onMouseEnter={() => handleComponentHover('inputPanel', true)}
            onMouseLeave={() => handleComponentHover('inputPanel', false)}
          >
            <div className="bg-background-secondary/95 backdrop-blur-md rounded-xl border border-background-tertiary shadow-2xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-text-primary flex-1">
                  {t('chat.title')}
                </span>
                <button
                  onClick={() => setShowInputPanel(false)}
                  className="p-1 rounded hover:bg-background-tertiary text-text-muted hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('messages.placeholder')}
                  disabled={wsStatus !== 'connected'}
                  className="text-sm"
                  autoFocus
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
