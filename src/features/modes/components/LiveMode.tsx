import { useAppStore } from '../../../shared/store';
import { SpeechBubble } from '../../../shared/components';
import { Live2DCanvas } from '../../character/components';
import { QuickControls } from './QuickControls';

export function LiveMode() {
  const displayText = useAppStore((state) => state.conversation.displayText);
  const isTyping = useAppStore((state) => state.conversation.isTyping);
  const currentEmotion = useAppStore((state) => state.conversation.currentEmotion);
  const modelUrl = useAppStore((state) => state.character.model.modelUrl);

  return (
    <div className="relative w-full h-full bg-transparent">
      {/* Live2D 캔버스 (전체 화면) */}
      {modelUrl ? (
        <Live2DCanvas className="absolute inset-0" enableZoom enableDrag />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-background-primary">
          <div className="w-64 h-64 rounded-full bg-background-secondary flex items-center justify-center">
            <span className="text-8xl">🎭</span>
          </div>
        </div>
      )}

      {/* 말풍선 - OBS 캡처에 최적화, 라이브 모드에서는 고정 위치 */}
      {displayText && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 max-w-2xl">
          <SpeechBubble
            text={displayText}
            isTyping={isTyping}
            emotion={currentEmotion}
            typingSpeed={40}
            variant="broadcast"
          />
        </div>
      )}

      {/* 퀵 컨트롤 - OBS에서 제외할 영역 (CSS 클래스로 마킹) */}
      <div className="obs-exclude">
        <QuickControls />
      </div>
    </div>
  );
}
