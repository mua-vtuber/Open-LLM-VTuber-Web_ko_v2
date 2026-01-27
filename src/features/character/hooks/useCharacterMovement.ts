/**
 * useCharacterMovement - 캐릭터 자동 이동 훅
 *
 * 캐릭터가 화면 내에서 자연스럽게 움직이도록 합니다.
 * 모드에 따라 자유 이동, 가로 이동, 세로 이동을 지원합니다.
 *
 * CSS transition을 활용하여 부드러운 애니메이션을 구현합니다.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '../../../shared/store';
import type { MovementMode } from '../../../shared/types';

interface UseCharacterMovementOptions {
  /** 외부에서 활성화 제어 */
  enabled?: boolean;
}

interface UseCharacterMovementReturn {
  /** 수동으로 특정 위치로 이동 */
  moveTo: (x: number, y: number) => void;
  /** 이동 중지 */
  stop: () => void;
  /** 이동 재개 */
  resume: () => void;
}

/**
 * 화면 크기에 따른 이동 범위 계산 (절대 좌표)
 * 캐릭터 크기를 고려하여 화면 내에서 움직이도록 함
 */
function calculateBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
  if (typeof window === 'undefined') {
    return { minX: 100, maxX: 700, minY: 100, maxY: 500 };
  }

  // 캐릭터 크기 (CompanionMode의 characterSize와 동일)
  const characterWidth = 300;
  const characterHeight = 400;

  // 화면 경계에서 패딩
  const padding = 50;

  return {
    minX: padding,
    maxX: window.innerWidth - characterWidth - padding,
    minY: padding,
    maxY: window.innerHeight - characterHeight - padding,
  };
}

export function useCharacterMovement(
  options: UseCharacterMovementOptions = {}
): UseCharacterMovementReturn {
  const { enabled: externalEnabled = true } = options;

  // 현재 모드 확인 - 컴패니언 모드에서만 활성화
  const currentMode = useAppStore((state) => state.ui.mode);
  const isCompanionMode = currentMode === 'companion';

  // Store에서 설정 가져오기
  const movementMode = useAppStore((state) => state.settings.character.movementMode) ?? 'disabled';
  const movementSpeed = useAppStore((state) => state.settings.character.movementSpeed) ?? 1.0;
  const movementActiveness = useAppStore((state) => state.settings.character.movementActiveness) ?? 0.5;
  const currentPosition = useAppStore((state) => state.character.model.position);
  const updateCharacterPosition = useAppStore((state) => state.updateCharacterPosition);
  const updateMovementState = useAppStore((state) => state.updateMovementState);

  // 동적 bounds
  const [bounds, setBounds] = useState(calculateBounds);

  // 설정값 ref (useCallback 내부에서 항상 최신값 참조)
  const settingsRef = useRef({
    movementSpeed,
    movementActiveness,
    movementMode,
  });

  // 설정값 변경 시 ref 업데이트
  useEffect(() => {
    settingsRef.current = {
      movementSpeed,
      movementActiveness,
      movementMode,
    };
  }, [movementSpeed, movementActiveness, movementMode]);

  // 내부 상태
  const isPausedRef = useRef(false);
  const isRestingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const movementEndTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 화면 크기 변경 시 bounds 재계산
  useEffect(() => {
    const handleResize = () => {
      setBounds(calculateBounds());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * 랜덤 목표 위치 생성 (현재 위치 기준 근거리 배회)
   */
  const generateRandomTarget = useCallback(
    (mode: MovementMode): { x: number; y: number } => {
      const current = currentPosition;

      // 경계 패딩
      const paddingX = (bounds.maxX - bounds.minX) * 0.1;
      const paddingY = (bounds.maxY - bounds.minY) * 0.1;

      const safeMinX = bounds.minX + paddingX;
      const safeMaxX = bounds.maxX - paddingX;
      const safeMinY = bounds.minY + paddingY;
      const safeMaxY = bounds.maxY - paddingY;

      // 한 번에 이동할 최대 거리 (px) - 자연스러운 배회 느낌
      const MAX_STEP = 350; 

      let targetX = current.x;
      let targetY = current.y;

      const randomOffset = () => (Math.random() - 0.5) * 2 * MAX_STEP;

      switch (mode) {
        case 'free':
          targetX += randomOffset();
          targetY += randomOffset();
          break;
        case 'horizontal':
          targetX += randomOffset();
          break;
        case 'vertical':
          targetY += randomOffset();
          break;
      }

      // 화면 밖으로 나가지 않도록 클램핑
      return {
        x: Math.max(safeMinX, Math.min(safeMaxX, targetX)),
        y: Math.max(safeMinY, Math.min(safeMaxY, targetY)),
      };
    },
    [bounds, currentPosition]
  );

  /**
   * 다음 이동 실행
   * - 이동 방향과 강도를 계산하여 store에 업데이트
   * - CSS transition 시간 후 isMoving: false로 설정
   */
  const moveToNextPosition = useCallback(() => {
    const { movementMode: mode, movementSpeed: speed } = settingsRef.current;

    if (isPausedRef.current || mode === 'disabled' || isRestingRef.current) {
      return;
    }

    const target = generateRandomTarget(mode);
    const current = currentPosition;

    // 이동 방향 계산
    const deltaX = target.x - current.x;
    const deltaY = target.y - current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 10) { // 너무 짧은 거리는 이동 안 함
      // 방향 정규화 (-1 ~ 1)
      const directionX = deltaX / distance;
      const directionY = deltaY / distance;

      // 기울기 강도: 이동 중에는 항상 명확하게 (0.5 ~ 1.0)
      const intensity = 0.5 + Math.min(speed, 2.0) * 0.2;

      // CSS transition 시간 계산: 거리 기반
      // 기본 속도 60px/s (조금 더 천천히)
      const baseSpeed = 60; 
      const actualSpeed = baseSpeed * Math.max(0.1, speed); // speed가 0이면 멈추지 않게 최소값 처리
      
      const transitionMs = (distance / actualSpeed) * 1000;
      // 최소 1.5초, 최대 10초 제한 (너무 빠르거나 느리지 않게)
      const clampedDuration = Math.max(1500, Math.min(10000, transitionMs));
      const transitionSec = clampedDuration / 1000;

      // 이동 시작: store에 movement 상태 업데이트
      updateMovementState({
        direction: { x: directionX, y: directionY },
        isMoving: true,
        intensity: Math.min(intensity, 1),
        transitionDuration: transitionSec,
      });

      // 이전 타이머 정리
      if (movementEndTimerRef.current) {
        clearTimeout(movementEndTimerRef.current);
      }

      // transition 완료 후 isMoving: false + 다음 이동 스케줄링
      movementEndTimerRef.current = setTimeout(() => {
        updateMovementState({ isMoving: false });
        movementEndTimerRef.current = null;
        // transition 완료 후 다음 이동 스케줄링
        scheduleNextMoveRef.current();
      }, clampedDuration + 100); // 100ms 버퍼
    } else {
      // 이동 거리가 너무 짧으면 바로 다음 스케줄링
      scheduleNextMoveRef.current();
    }

    updateCharacterPosition(target.x, target.y);
  }, [bounds, currentPosition, generateRandomTarget, updateCharacterPosition, updateMovementState]);

  // 함수 ref (순환 의존성 해결)
  const scheduleMovementRef = useRef<() => void>(() => {});
  const scheduleNextMoveRef = useRef<() => void>(() => {});

  /**
   * 휴식 후 다음 이동 스케줄링
   */
  const scheduleNextMove = useCallback(() => {
    const { movementMode: mode, movementActiveness: activeness } = settingsRef.current;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isPausedRef.current || mode === 'disabled') {
      return;
    }

    // 활동성에 따른 휴식 확률 (activeness가 높을수록 덜 쉼)
    // 0.1 -> 90% 휴식, 1.0 -> 10% 휴식
    const restProbability = 1.0 - (activeness * 0.9);
    const shouldRest = Math.random() < restProbability;

    if (shouldRest) {
      isRestingRef.current = true;
      // 휴식 시간: 기본 2초 + 랜덤 (활동성 낮을수록 길게)
      // activeness 0.1 -> 최대 12초, 1.0 -> 최대 4초
      const maxRest = 4000 + (1 - activeness) * 8000;
      const restDuration = 2000 + Math.random() * maxRest;

      timeoutRef.current = setTimeout(() => {
        isRestingRef.current = false;
        scheduleMovementRef.current();
      }, restDuration);
    } else {
      scheduleMovementRef.current();
    }
  }, []);

  /**
   * 실제 이동 스케줄링 (짧은 딜레이)
   */
  const scheduleMovement = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 반응성 향상을 위해 딜레이 단축 (0.1~0.5초)
    const delay = 100 + Math.random() * 400;

    timeoutRef.current = setTimeout(() => {
      moveToNextPosition();
    }, delay);
  }, [moveToNextPosition]);

  // 함수 ref 업데이트
  useEffect(() => {
    scheduleMovementRef.current = scheduleMovement;
    scheduleNextMoveRef.current = scheduleNextMove;
  }, [scheduleMovement, scheduleNextMove]);

  /**
   * 수동 이동
   */
  const moveTo = useCallback(
    (x: number, y: number) => {
      const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, x));
      const clampedY = Math.max(bounds.minY, Math.min(bounds.maxY, y));
      updateCharacterPosition(clampedX, clampedY);
    },
    [bounds, updateCharacterPosition]
  );

  /**
   * 이동 중지
   */
  const stop = useCallback(() => {
    isPausedRef.current = true;
    isRestingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (movementEndTimerRef.current) {
      clearTimeout(movementEndTimerRef.current);
      movementEndTimerRef.current = null;
    }
    updateMovementState({
      isMoving: false,
      intensity: 0,
    });
  }, [updateMovementState]);

  /**
   * 이동 재개
   */
  const resume = useCallback(() => {
    isPausedRef.current = false;
    if (settingsRef.current.movementMode !== 'disabled') {
      scheduleNextMoveRef.current();
    }
  }, []);

  // 움직임 모드 변경 시 처리
  useEffect(() => {
    if (!externalEnabled || !isCompanionMode || movementMode === 'disabled') {
      stop();
      return;
    }

    // 모드가 바뀌면 기존 이동을 취소하고 새로 시작
    isPausedRef.current = false;
    isRestingRef.current = false;
    
    // 즉시 반응
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (movementEndTimerRef.current) clearTimeout(movementEndTimerRef.current);

    scheduleMovement(); 

    return () => {
      stop();
    };
  }, [movementMode, externalEnabled, isCompanionMode, stop, scheduleMovement]);

  // 설정(속도, 활동성) 변경 시 처리
  useEffect(() => {
    if (!externalEnabled || !isCompanionMode || movementMode === 'disabled') return;
    if (isPausedRef.current) return;

    // 중요: 이미 이동 중이라면(transition 중) 간섭하지 않음 -> 자연스러운 연결
    if (movementEndTimerRef.current) return;

    // 휴식 중이었다면 휴식을 깨고 즉시 새로운 설정 적용
    if (isRestingRef.current || timeoutRef.current) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      isRestingRef.current = false;
      scheduleNextMoveRef.current();
    }
  }, [movementSpeed, movementActiveness, externalEnabled, isCompanionMode, movementMode]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (movementEndTimerRef.current) {
        clearTimeout(movementEndTimerRef.current);
      }
    };
  }, []);

  return {
    moveTo,
    stop,
    resume,
  };
}
