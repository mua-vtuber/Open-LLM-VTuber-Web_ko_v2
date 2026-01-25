/**
 * useAudio - 오디오 재생 및 립싱크 동기화 훅
 *
 * 백엔드에서 받은 오디오 데이터를 재생하고,
 * volumes 배열을 이용해 Live2D 립싱크를 동기화합니다.
 */

import { useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../store';

interface AudioTask {
  audioBase64: string;
  volumes: number[];
  sliceLength?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

interface UseAudioReturn {
  /** 오디오 태스크 추가 */
  addAudioTask: (task: AudioTask) => void;
  /** 현재 오디오 중단 */
  stopAudio: () => void;
  /** 모든 오디오 큐 클리어 */
  clearQueue: () => void;
  /** 현재 재생 중인지 여부 */
  isPlaying: boolean;
}

export function useAudio(): UseAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const queueRef = useRef<AudioTask[]>([]);
  const isPlayingRef = useRef(false);
  const currentVolumesRef = useRef<number[]>([]);
  const playStartTimeRef = useRef<number>(0);

  const lipSyncEnabled = useAppStore((state) => state.settings.character.lipSyncEnabled);
  const setLipSyncValue = useAppStore((state) => state.setLipSyncValue);

  // 립싱크 업데이트 루프
  const updateLipSync = useCallback(() => {
    if (!audioRef.current || !isPlayingRef.current || !lipSyncEnabled) {
      return;
    }

    const audio = audioRef.current;
    const volumes = currentVolumesRef.current;

    if (volumes.length === 0 || audio.paused) {
      setLipSyncValue(0);
      return;
    }

    // 현재 재생 위치에 해당하는 볼륨 인덱스 계산
    const currentTime = audio.currentTime;
    const duration = audio.duration || 1;
    const progress = currentTime / duration;
    const volumeIndex = Math.min(
      Math.floor(progress * volumes.length),
      volumes.length - 1
    );

    // 볼륨값 적용 (0~1 범위로 정규화)
    const volume = volumes[volumeIndex] || 0;
    const normalizedVolume = Math.min(1, Math.max(0, volume));

    setLipSyncValue(normalizedVolume);

    // 다음 프레임 예약
    animationFrameRef.current = requestAnimationFrame(updateLipSync);
  }, [lipSyncEnabled, setLipSyncValue]);

  // 오디오 재생
  const playAudio = useCallback(
    async (task: AudioTask) => {
      const { audioBase64, volumes, onStart, onEnd } = task;

      // 기존 오디오 정리
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // 오디오 데이터 URL 생성
      const audioDataUrl = `data:audio/wav;base64,${audioBase64}`;
      const audio = new Audio(audioDataUrl);
      audioRef.current = audio;
      currentVolumesRef.current = volumes;
      isPlayingRef.current = true;

      onStart?.();

      return new Promise<void>((resolve) => {
        const cleanup = () => {
          isPlayingRef.current = false;
          setLipSyncValue(0);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          onEnd?.();
          resolve();
          // 다음 큐 처리
          processQueue();
        };

        audio.addEventListener('canplaythrough', () => {
          playStartTimeRef.current = performance.now();
          audio.play().catch((err) => {
            console.error('[useAudio] 재생 에러:', err);
            cleanup();
          });

          // 립싱크 업데이트 시작
          if (lipSyncEnabled && volumes.length > 0) {
            animationFrameRef.current = requestAnimationFrame(updateLipSync);
          }
        });

        audio.addEventListener('ended', cleanup);
        audio.addEventListener('error', (e) => {
          console.error('[useAudio] 오디오 에러:', e);
          cleanup();
        });

        audio.load();
      });
    },
    [lipSyncEnabled, setLipSyncValue, updateLipSync]
  );

  // 큐 처리
  const processQueue = useCallback(async () => {
    if (isPlayingRef.current || queueRef.current.length === 0) {
      return;
    }

    const task = queueRef.current.shift();
    if (task) {
      await playAudio(task);
    }
  }, [playAudio]);

  // 오디오 태스크 추가
  const addAudioTask = useCallback(
    (task: AudioTask) => {
      queueRef.current.push(task);
      processQueue();
    },
    [processQueue]
  );

  // 현재 오디오 중단
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isPlayingRef.current = false;
    setLipSyncValue(0);
  }, [setLipSyncValue]);

  // 모든 큐 클리어
  const clearQueue = useCallback(() => {
    queueRef.current = [];
    stopAudio();
  }, [stopAudio]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopAudio();
      queueRef.current = [];
    };
  }, [stopAudio]);

  return {
    addAudioTask,
    stopAudio,
    clearQueue,
    isPlaying: isPlayingRef.current,
  };
}
