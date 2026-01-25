import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils';
import type { BubbleType, Emotion } from '../../types';

export type BubbleVariant = 'default' | 'broadcast' | 'compact';

export interface SpeechBubbleProps {
  text: string;
  type?: BubbleType;
  emotion?: Emotion;
  isTyping?: boolean;
  typingSpeed?: number;
  showCursor?: boolean;
  position?: { x: number; y: number };
  tailDirection?: 'down' | 'left' | 'right' | 'up';
  onTypingComplete?: () => void;
  variant?: BubbleVariant;
  className?: string;
}

// 변형별 스타일
const variantStyles: Record<BubbleVariant, string> = {
  default: 'max-w-[400px] px-4 py-3 text-base',
  broadcast: 'max-w-[600px] px-6 py-4 text-xl shadow-xl', // OBS 캡처 최적화
  compact: 'max-w-[280px] px-3 py-2 text-sm', // 작은 윈도우용
};

// 감정별 스타일
const emotionStyles: Record<Emotion, { bg: string; border: string; animation?: string }> = {
  neutral: { bg: 'bg-white', border: 'border-transparent' },
  happy: {
    bg: 'bg-gradient-to-br from-white to-yellow-50',
    border: 'border-yellow-300',
    animation: 'animate-bounce-slow',
  },
  sad: { bg: 'bg-gray-100', border: 'border-gray-300' },
  angry: { bg: 'bg-orange-50', border: 'border-orange-400' },
  surprised: { bg: 'bg-white', border: 'border-blue-400' },
  thinking: { bg: 'bg-blue-50', border: 'border-blue-200' },
  confused: { bg: 'bg-purple-50', border: 'border-purple-200' },
};

// 타입별 스타일
const typeStyles: Record<BubbleType, string> = {
  speech: 'rounded-2xl',
  thought: 'rounded-full',
  shout: 'rounded-sm border-2',
  whisper: 'rounded-2xl border-dashed',
  system: 'rounded-md bg-background-secondary text-text-primary',
};

export function SpeechBubble({
  text,
  type = 'speech',
  emotion = 'neutral',
  isTyping = false,
  typingSpeed = 50,
  showCursor = true,
  position,
  tailDirection = 'down',
  onTypingComplete,
  variant = 'default',
  className,
}: SpeechBubbleProps) {
  const [displayedText, setDisplayedText] = useState(isTyping ? '' : text);
  const [cursorVisible, setCursorVisible] = useState(true);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 타이핑 효과
  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(text);
      return;
    }

    setDisplayedText('');
    let currentIndex = 0;

    const typeNextChar = () => {
      if (currentIndex < text.length) {
        const char = text[currentIndex];
        setDisplayedText((prev) => prev + char);
        currentIndex++;

        // 구두점 지연
        let delay = typingSpeed;
        if ([',', '!', '?'].includes(char)) {
          delay += 150;
        } else if (char === '.') {
          delay += 300;
        } else if (char === '…' || (char === '.' && text[currentIndex] === '.')) {
          delay += 400;
        }

        typingRef.current = setTimeout(typeNextChar, delay + Math.random() * 20);
      } else {
        onTypingComplete?.();
      }
    };

    typingRef.current = setTimeout(typeNextChar, typingSpeed);

    return () => {
      if (typingRef.current) {
        clearTimeout(typingRef.current);
      }
    };
  }, [text, isTyping, typingSpeed, onTypingComplete]);

  // 커서 깜빡임
  useEffect(() => {
    if (!showCursor || !isTyping) return;

    cursorRef.current = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);

    return () => {
      if (cursorRef.current) {
        clearInterval(cursorRef.current);
      }
    };
  }, [showCursor, isTyping]);

  const emotionStyle = emotionStyles[emotion];
  const typeStyle = typeStyles[type];

  // 꼬리 위치 계산
  const tailPositions = {
    down: 'left-1/2 -translate-x-1/2 -bottom-2',
    up: 'left-1/2 -translate-x-1/2 -top-2 rotate-180',
    left: '-left-2 top-1/2 -translate-y-1/2 -rotate-90',
    right: '-right-2 top-1/2 -translate-y-1/2 rotate-90',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'relative shadow-lg',
          variantStyles[variant],
          type !== 'system' && emotionStyle.bg,
          type !== 'system' && `border ${emotionStyle.border}`,
          typeStyle,
          emotionStyle.animation,
          className
        )}
        style={
          position
            ? { position: 'absolute', left: position.x, top: position.y }
            : undefined
        }
      >
        {/* 텍스트 내용 */}
        <p
          className={cn(
            'text-base leading-relaxed whitespace-pre-wrap',
            type === 'system' ? 'text-text-primary' : 'text-gray-900',
            type === 'shout' && 'font-bold',
            type === 'whisper' && 'text-gray-500 italic'
          )}
        >
          {displayedText}
          {/* 커서 */}
          {showCursor && isTyping && (
            <span
              className={cn(
                'inline-block w-0.5 h-5 ml-0.5 bg-gray-900 align-middle transition-opacity',
                cursorVisible ? 'opacity-100' : 'opacity-0'
              )}
            />
          )}
        </p>

        {/* 생각 말풍선 동그라미들 */}
        {type === 'thought' && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="w-2 h-2 rounded-full bg-white border border-gray-200" />
            <span className="w-1.5 h-1.5 rounded-full bg-white border border-gray-200" />
            <span className="w-1 h-1 rounded-full bg-white border border-gray-200" />
          </div>
        )}

        {/* 일반 말풍선 꼬리 */}
        {type === 'speech' && tailDirection && (
          <div
            className={cn(
              'absolute w-0 h-0',
              tailPositions[tailDirection]
            )}
            style={{
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '10px solid white',
            }}
          />
        )}

        {/* 감정 데코레이션 */}
        {emotion === 'happy' && (
          <div className="absolute -top-2 -right-2 text-lg animate-pulse">✨</div>
        )}
        {emotion === 'surprised' && (
          <div className="absolute -top-3 right-2 text-xl">❗</div>
        )}
        {emotion === 'thinking' && (
          <div className="absolute -top-2 -left-2 text-lg">💭</div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
