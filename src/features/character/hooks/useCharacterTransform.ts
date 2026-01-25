/**
 * useCharacterTransform - 캐릭터 위치/크기 조정 훅
 *
 * 드래그로 위치 조정, 휠로 크기 조정 기능을 제공합니다.
 * Store와 양방향 동기화되어 변경 사항이 자동 저장됩니다.
 *
 * 데이터 흐름:
 * - Store → Renderer: 초기 로드 시 및 설정 변경 시 적용
 * - Renderer → Store: 휠/드래그 조작 시 Store 업데이트 (persist)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { CubismRenderer } from '@cubism/app';
import { useAppStore } from '../../../shared/store';

export interface UseCharacterTransformOptions {
  /** CubismRenderer ref */
  rendererRef: React.RefObject<CubismRenderer | null>;
  /** Canvas element ref */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** 드래그 활성화 */
  enableDrag?: boolean;
  /** 줌 활성화 */
  enableZoom?: boolean;
  /** 드래그 시작 콜백 (자동 이동 중지 등에 사용) */
  onDragStart?: () => void;
  /** 드래그 종료 콜백 (자동 이동 재개 등에 사용) */
  onDragEnd?: () => void;
}

export interface UseCharacterTransformReturn {
  /** 현재 드래그 중인지 여부 */
  isDragging: boolean;
  /** 포인터 이벤트 핸들러 */
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
}

interface DragState {
  startMouseX: number;
  startMouseY: number;
  startPosX: number;
  startPosY: number;
}

/**
 * 캐릭터 위치/크기 조정 훅
 *
 * @example
 * ```tsx
 * const { isDragging, handlers } = useCharacterTransform({
 *   rendererRef,
 *   canvasRef,
 *   enableDrag: true,
 *   enableZoom: true,
 * });
 *
 * return (
 *   <canvas
 *     ref={canvasRef}
 *     {...handlers}
 *     className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
 *   />
 * );
 * ```
 */
export function useCharacterTransform(
  options: UseCharacterTransformOptions
): UseCharacterTransformReturn {
  const {
    rendererRef,
    canvasRef,
    enableDrag = false,
    enableZoom = false,
    onDragStart,
    onDragEnd,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);
  // 드래그 중 현재 위치 (Store에 저장하기 전)
  const currentPosRef = useRef({ x: 0, y: 0 });

  // Store 액션
  const setModelScale = useAppStore((state) => state.setModelScale);
  const setModelPosition = useAppStore((state) => state.setModelPosition);

  // ============================================================
  // Store → Renderer 동기화 (초기 로드 및 설정 변경 시)
  // ============================================================

  // 스케일 동기화 (뷰 줌) - React 리렌더링 없이 직접 업데이트
  useEffect(() => {
    let cancelled = false;

    // 초기 스케일 적용 (렌더러 준비 대기)
    const applyInitialScale = () => {
      if (cancelled) return;

      const renderer = rendererRef.current;
      const scale = useAppStore.getState().character.model.scale;

      if (!renderer) {
        requestAnimationFrame(applyInitialScale);
        return;
      }

      renderer.setScale(scale);
    };

    applyInitialScale();

    // 이후 변경 구독
    const unsubscribe = useAppStore.subscribe(
      (state) => state.character.model.scale,
      (scale) => {
        if (cancelled) return;
        if (rendererRef.current) {
          rendererRef.current.setScale(scale);
        }
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [rendererRef]);

  // 위치 동기화 - React 리렌더링 없이 직접 업데이트
  // 참고: Store 위치는 정규화된 좌표 (-2 ~ 2 범위)를 사용해야 합니다.
  // CharacterSettings의 이전 픽셀 값(-200 ~ 200)과 호환성을 위해 범위 체크 수행
  useEffect(() => {
    if (!enableDrag) return;

    let cancelled = false;

    /**
     * 위치 값이 정규화된 좌표 범위인지 확인
     * Live2D 좌표: X는 약 -2 ~ 2, Y는 -1.5 ~ 1.5 정도가 화면 내
     * 이전 픽셀 값: X는 -200 ~ 200, Y도 -300 ~ 300 범위
     * 절대값이 10 이상이면 이전 픽셀 형식으로 간주
     */
    const isLegacyPixelValue = (pos: { x: number; y: number }) => {
      return Math.abs(pos.x) > 10 || Math.abs(pos.y) > 10;
    };

    // 초기 위치 적용 (렌더러 준비 대기)
    const applyInitialPosition = () => {
      if (cancelled) return;

      const renderer = rendererRef.current;
      const position = useAppStore.getState().character.model.position;

      if (!renderer) {
        requestAnimationFrame(applyInitialPosition);
        return;
      }

      // 이전 픽셀 형식인 경우 0,0으로 리셋
      if (isLegacyPixelValue(position)) {
        console.log('[useCharacterTransform] Legacy pixel position detected, resetting to 0,0');
        currentPosRef.current = { x: 0, y: 0 };
        renderer.setModelPosition(0, 0);
        // Store도 업데이트 (persist)
        setModelPosition(0, 0);
      } else {
        currentPosRef.current = { x: position.x, y: position.y };
        renderer.setModelPosition(position.x, position.y);
      }
    };

    applyInitialPosition();

    // 이후 변경 구독
    const unsubscribe = useAppStore.subscribe(
      (state) => state.character.model.position,
      (position) => {
        if (cancelled) return;
        // 드래그 중에는 Store 변경을 무시 (순환 방지)
        if (dragStateRef.current) return;

        // 이전 픽셀 형식인 경우 무시
        if (isLegacyPixelValue(position)) {
          return;
        }

        // 현재 위치 ref 업데이트
        currentPosRef.current = { x: position.x, y: position.y };

        // 렌더러에 적용
        if (rendererRef.current) {
          rendererRef.current.setModelPosition(position.x, position.y);
        }
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [rendererRef, enableDrag, setModelPosition]);

  // ============================================================
  // Renderer → Store 동기화 (휠 줌)
  // ============================================================

  // setModelScale을 ref로 유지 (콜백 내에서 최신 함수 참조)
  const setModelScaleRef = useRef(setModelScale);
  useEffect(() => {
    setModelScaleRef.current = setModelScale;
  }, [setModelScale]);

  useEffect(() => {
    if (!enableZoom) return;

    let cancelled = false;

    // 렌더러가 준비될 때까지 폴링
    const setupCallback = () => {
      if (cancelled) return;

      const renderer = rendererRef.current;
      if (!renderer) {
        // 렌더러가 아직 없으면 다음 프레임에 재시도
        requestAnimationFrame(setupCallback);
        return;
      }

      // 휠 줌 변경 시 Store에 저장
      renderer.setOnScaleChange((scale) => {
        if (!cancelled) {
          setModelScaleRef.current(scale);
        }
      });
    };

    setupCallback();

    return () => {
      cancelled = true;
      // 콜백 해제
      rendererRef.current?.setOnScaleChange(null);
    };
  }, [enableZoom, rendererRef]);

  // ============================================================
  // 드래그 핸들러
  // ============================================================

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enableDrag) return;

      // 좌클릭만 허용
      if (e.button !== 0) return;

      // Store에서 현재 위치 가져오기 (모델 행렬이 아닌 Store 사용)
      const storePosition = useAppStore.getState().character.model.position;

      // 드래그 상태 저장
      dragStateRef.current = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startPosX: storePosition.x,
        startPosY: storePosition.y,
      };

      currentPosRef.current = { x: storePosition.x, y: storePosition.y };

      setIsDragging(true);

      // 포인터 캡처 (요소 밖으로 나가도 이벤트 수신)
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      // 콜백 호출
      onDragStart?.();
    },
    [enableDrag, onDragStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !dragStateRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const dragState = dragStateRef.current;

      // 화면 좌표 델타 → Live2D 좌표 델타 변환
      // Live2D 좌표계: 화면 비율에 따라 X는 -ratio ~ ratio, Y는 -1 ~ 1
      const aspectRatio = rect.width / rect.height;

      // 픽셀 델타
      const deltaPixelX = e.clientX - dragState.startMouseX;
      const deltaPixelY = e.clientY - dragState.startMouseY;

      // 정규화된 델타 (-1 ~ 1 범위로 변환)
      // X축: 화면 너비의 절반이 aspectRatio
      // Y축: 화면 높이의 절반이 1.0
      const deltaX = (deltaPixelX / rect.width) * 2 * aspectRatio;
      const deltaY = -(deltaPixelY / rect.height) * 2; // Y축 반전

      // 새 위치 계산 (Store의 시작 위치 + 델타)
      const newX = dragState.startPosX + deltaX;
      const newY = dragState.startPosY + deltaY;

      // 현재 위치 ref 업데이트
      currentPosRef.current = { x: newX, y: newY };

      // 렌더러에 즉시 반영 (부드러운 드래그)
      rendererRef.current?.setModelPosition(newX, newY);
    },
    [isDragging, canvasRef, rendererRef]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !dragStateRef.current) return;

      // 드래그 종료 시 최종 위치를 Store에 저장 (persist)
      setModelPosition(currentPosRef.current.x, currentPosRef.current.y);

      // 상태 초기화
      dragStateRef.current = null;
      setIsDragging(false);

      // 포인터 캡처 해제
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      // 콜백 호출
      onDragEnd?.();
    },
    [isDragging, setModelPosition, onDragEnd]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      // 드래그 취소 시 원래 위치로 복원
      if (isDragging && dragStateRef.current) {
        const originalPos = {
          x: dragStateRef.current.startPosX,
          y: dragStateRef.current.startPosY,
        };
        currentPosRef.current = originalPos;
        rendererRef.current?.setModelPosition(originalPos.x, originalPos.y);
      }

      dragStateRef.current = null;
      setIsDragging(false);

      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      onDragEnd?.();
    },
    [isDragging, rendererRef, onDragEnd]
  );

  return {
    isDragging,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}
