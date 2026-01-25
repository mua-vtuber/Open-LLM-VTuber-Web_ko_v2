import { useEffect, useRef, useCallback, useState } from 'react';
import { cn } from '../../../shared/utils';
import { useAppStore } from '../../../shared/store';
import { CubismManager, CubismRenderer, MotionPriority } from '@cubism/app';
import { useMouseTracking, useMovementTracking, useCharacterTransform } from '../hooks';

// 립싱크를 위한 별도 컴포넌트 - 리렌더링 최소화
function useLipSyncSubscription(rendererRef: React.RefObject<CubismRenderer | null>) {
  useEffect(() => {
    // zustand subscribe로 React 리렌더링 없이 직접 업데이트
    const unsubscribe = useAppStore.subscribe(
      (state) => state.character.lipSyncValue,
      (lipSyncValue) => {
        if (rendererRef.current) {
          rendererRef.current.setLipSyncValue(lipSyncValue);
        }
      }
    );

    return unsubscribe;
  }, [rendererRef]);
}

export interface Live2DCanvasProps {
  className?: string;
  onModelLoaded?: () => void;
  onModelError?: (error: Error) => void;
  /** 휠 줌 활성화 (Studio, Live 모드용) */
  enableZoom?: boolean;
  /** 마우스 트래킹 활성화 */
  enableMouseTracking?: boolean;
  /** 드래그로 캐릭터 위치 조정 활성화 */
  enableDrag?: boolean;
  /** 드래그 시작 콜백 (자동 이동 중지 등에 사용) */
  onDragStart?: () => void;
  /** 드래그 종료 콜백 (자동 이동 재개 등에 사용) */
  onDragEnd?: () => void;
}

export function Live2DCanvas({
  className,
  onModelLoaded,
  onModelError,
  enableZoom = false,
  enableMouseTracking = true,
  enableDrag = false,
  onDragStart,
  onDragEnd,
}: Live2DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CubismRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const modelUrl = useAppStore((state) => state.character.model.modelUrl);
  const expression = useAppStore((state) => state.character.expression);
  const motion = useAppStore((state) => state.character.motion);

  // 립싱크 구독 (React 리렌더링 없이 직접 업데이트)
  useLipSyncSubscription(rendererRef);

  // 캐릭터 transform 훅 (드래그/줌 → Store 연동)
  const { isDragging, handlers: transformHandlers } = useCharacterTransform({
    rendererRef,
    canvasRef,
    enableDrag: enableDrag && isReady,
    enableZoom: enableZoom && isReady,
    onDragStart,
    onDragEnd,
  });

  // 마우스 트래킹 (캐릭터가 마우스를 따라 시선 이동)
  useMouseTracking(rendererRef, {
    enabled: enableMouseTracking && isReady,
    smoothness: 0.08,
  });

  // 이동 방향 기울기 (컴패니언 모드에서 캐릭터가 이동 방향으로 기울어짐)
  useMovementTracking(rendererRef, {
    enabled: isReady,
  });

  // Cubism SDK 및 렌더러 초기화
  useEffect(() => {
    if (!canvasRef.current || rendererRef.current) return;

    // Cubism SDK 초기화
    const manager = CubismManager.getInstance();
    if (!manager.initialize()) {
      console.error('[Live2DCanvas] Failed to initialize Cubism SDK');
      onModelError?.(new Error('Failed to initialize Cubism SDK'));
      return;
    }

    // 캔버스 크기 설정
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
    }

    // 렌더러 초기화
    const renderer = new CubismRenderer();
    if (!renderer.initialize(canvas)) {
      console.error('[Live2DCanvas] Failed to initialize renderer');
      onModelError?.(new Error('Failed to initialize WebGL renderer'));
      return;
    }

    rendererRef.current = renderer;
    setIsReady(true);
    console.log('[Live2DCanvas] Cubism SDK and renderer initialized');

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      // SDK는 앱 종료 시 정리 (여기서는 정리하지 않음)
      setIsReady(false);
    };
  }, [onModelError]);

  // 모델 로드
  const loadModel = useCallback(
    async (url: string) => {
      if (!rendererRef.current || !url) return;

      setIsLoading(true);

      try {
        console.log('[Live2DCanvas] Loading model from:', url);

        // 모델 로드
        await rendererRef.current.loadModel(url);

        // 렌더 루프 시작
        rendererRef.current.startRenderLoop();

        console.log('[Live2DCanvas] Model loaded and render loop started');

        setIsLoading(false);
        onModelLoaded?.();
      } catch (error) {
        setIsLoading(false);
        console.error('[Live2DCanvas] Failed to load model:', error);
        onModelError?.(error as Error);
      }
    },
    [onModelLoaded, onModelError]
  );

  // 렌더러가 준비되면 모델 로드
  useEffect(() => {
    if (isReady && modelUrl) {
      loadModel(modelUrl);
    }
  }, [isReady, modelUrl, loadModel]);

  // 표정 변경
  useEffect(() => {
    if (rendererRef.current && expression) {
      rendererRef.current.setExpression(expression);
    }
  }, [expression]);

  // 모션 트리거
  useEffect(() => {
    if (rendererRef.current && motion && motion !== 'idle') {
      // 모션 이름에서 그룹과 인덱스 추출 (예: "Tap_0" -> group: "Tap", index: 0)
      const parts = motion.split('_');
      if (parts.length >= 2) {
        const group = parts.slice(0, -1).join('_');
        const index = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(index)) {
          rendererRef.current.startMotion(group, index, MotionPriority.Normal);
        }
      } else {
        // 단일 그룹 이름으로 가정하고 인덱스 0
        rendererRef.current.startMotion(motion, 0, MotionPriority.Normal);
      }
    }
  }, [motion]);

  // 줌 활성화/비활성화
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setZoomEnabled(enableZoom);
    }
  }, [enableZoom, isReady]);

  // 리사이즈 처리
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current) return;

      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1);
        canvas.height = rect.height * (window.devicePixelRatio || 1);
        rendererRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 드래그 가능 시 커서 스타일
  const cursorStyle = enableDrag
    ? isDragging
      ? 'cursor-grabbing'
      : 'cursor-grab'
    : '';

  return (
    <div className={cn('relative w-full h-full', className)}>
      <canvas
        ref={canvasRef}
        className={cn('w-full h-full', cursorStyle)}
        style={{ touchAction: 'none' }}
        onPointerDown={transformHandlers.onPointerDown}
        onPointerMove={transformHandlers.onPointerMove}
        onPointerUp={transformHandlers.onPointerUp}
        onPointerCancel={transformHandlers.onPointerCancel}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background-primary/50">
          <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
