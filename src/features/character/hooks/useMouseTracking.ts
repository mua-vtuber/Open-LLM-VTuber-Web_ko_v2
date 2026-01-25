/**
 * useMouseTracking - 마우스 트래킹 훅
 *
 * 마우스 커서 위치를 추적하여 Live2D 캐릭터가 마우스를 바라보도록 합니다.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { CubismRenderer } from '@cubism/app';

interface UseMouseTrackingOptions {
  /** 마우스 트래킹 활성화 여부 */
  enabled?: boolean;
  /** 부드러운 움직임을 위한 lerp 계수 (0~1, 높을수록 빠름) */
  smoothness?: number;
  /** 트래킹 대상 요소 (기본: document) */
  targetElement?: HTMLElement | null;
}

export function useMouseTracking(
  rendererRef: React.RefObject<CubismRenderer | null>,
  options: UseMouseTrackingOptions = {}
) {
  const { enabled = true, smoothness = 0.1, targetElement = null } = options;

  // 현재 시선 위치 (부드러운 움직임용)
  const currentLookRef = useRef({ x: 0, y: 0 });
  const targetLookRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  // 마우스 이벤트 핸들러
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!enabled) return;

      // 타겟 요소의 경계 계산
      const target = targetElement || document.documentElement;
      const rect = target.getBoundingClientRect();

      // 마우스 위치를 -1 ~ 1 범위로 정규화
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1); // Y축 반전

      targetLookRef.current = { x, y };
    },
    [enabled, targetElement]
  );

  // 애니메이션 루프 (부드러운 시선 이동)
  const updateLookAt = useCallback(() => {
    if (!enabled || !rendererRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateLookAt);
      return;
    }

    const current = currentLookRef.current;
    const target = targetLookRef.current;

    // Lerp를 사용한 부드러운 보간
    current.x += (target.x - current.x) * smoothness;
    current.y += (target.y - current.y) * smoothness;

    // 렌더러에 시선 방향 전달
    rendererRef.current.setLookAt(current.x, current.y);

    animationFrameRef.current = requestAnimationFrame(updateLookAt);
  }, [enabled, smoothness, rendererRef]);

  // 이벤트 리스너 등록
  useEffect(() => {
    if (!enabled) return;

    const target = targetElement || document;
    target.addEventListener('mousemove', handleMouseMove as EventListener);

    // 애니메이션 루프 시작
    animationFrameRef.current = requestAnimationFrame(updateLookAt);

    return () => {
      target.removeEventListener('mousemove', handleMouseMove as EventListener);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, targetElement, handleMouseMove, updateLookAt]);

  // 시선 초기화
  const resetLookAt = useCallback(() => {
    currentLookRef.current = { x: 0, y: 0 };
    targetLookRef.current = { x: 0, y: 0 };
    if (rendererRef.current) {
      rendererRef.current.setLookAt(0, 0);
    }
  }, [rendererRef]);

  return { resetLookAt };
}
