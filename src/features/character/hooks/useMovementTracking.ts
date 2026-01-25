/**
 * useMovementTracking - 이동 방향 기울기 추적 훅
 *
 * Store의 movement 상태를 구독하여 캐릭터가 이동 방향으로 기울어지도록 합니다.
 * 이동 중에는 이동 방향을 바라보고, 멈추면 마우스 트래킹으로 복귀합니다.
 */

import { useEffect, useRef } from 'react';
import type { CubismRenderer } from '@cubism/app';
import { useAppStore } from '../../../shared/store';

interface UseMovementTrackingOptions {
  /** 기울기 효과 활성화 여부 */
  enabled?: boolean;
}

export function useMovementTracking(
  rendererRef: React.RefObject<CubismRenderer | null>,
  options: UseMovementTrackingOptions = {}
) {
  const { enabled = true } = options;

  // 이전 상태 추적 (불필요한 업데이트 방지)
  const prevStateRef = useRef<{
    direction: { x: number; y: number };
    isMoving: boolean;
    intensity: number;
  } | null>(null);

  // Store 구독 및 렌더러 업데이트
  useEffect(() => {
    if (!enabled) return;

    // subscribeWithSelector를 사용한 효율적인 구독
    const unsubscribe = useAppStore.subscribe(
      (state) => state.character.movement,
      (movement) => {
        const renderer = rendererRef.current;
        if (!renderer) return;

        // movement가 없으면 기본값 사용
        if (!movement || !movement.direction) {
          renderer.setMovementTilt(0, 0, 0, false);
          return;
        }

        // 상태 변경 확인 (최적화)
        const prev = prevStateRef.current;
        if (
          prev &&
          prev.direction.x === movement.direction.x &&
          prev.direction.y === movement.direction.y &&
          prev.isMoving === movement.isMoving &&
          prev.intensity === movement.intensity
        ) {
          return; // 변경 없음
        }

        // 이전 상태 저장
        prevStateRef.current = {
          direction: { ...movement.direction },
          isMoving: movement.isMoving,
          intensity: movement.intensity,
        };

        // 렌더러에 기울기 전달
        renderer.setMovementTilt(
          movement.direction.x,
          movement.direction.y,
          movement.intensity,
          movement.isMoving
        );
      },
      {
        // 즉시 현재 상태로 초기화
        fireImmediately: true,
      }
    );

    return () => {
      unsubscribe();
      // 클린업: 기울기 초기화
      if (rendererRef.current) {
        rendererRef.current.setMovementTilt(0, 0, 0, false);
      }
    };
  }, [enabled, rendererRef]);

  // 기울기 수동 초기화
  const resetTilt = () => {
    if (rendererRef.current) {
      rendererRef.current.setMovementTilt(0, 0, 0, false);
    }
    prevStateRef.current = null;
  };

  return { resetTilt };
}
