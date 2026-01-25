/**
 * Live Config Hook
 * 라이브 설정 조회/수정/저장 (2중 상태 관리)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { LiveConfig, LiveConfigUpdate } from '../types';
import { fetchLiveConfig, updateLiveConfig } from '../api';

interface UseLiveConfigReturn {
  /** 현재 설정 (수정 중인 값) */
  config: LiveConfig | null;
  /** 원본 설정 (서버 저장 값) */
  originalConfig: LiveConfig | null;
  /** 변경 여부 */
  isDirty: boolean;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 저장 중 상태 */
  isSaving: boolean;
  /** 에러 */
  error: string | null;
  /** 중첩 경로로 필드 업데이트 */
  updateField: (path: string, value: unknown) => void;
  /** 저장 */
  save: () => Promise<boolean>;
  /** 리셋 (원본으로 복원) */
  reset: () => void;
  /** 새로고침 */
  refresh: () => Promise<void>;
}

/**
 * 중첩 객체의 특정 경로에 값을 설정
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(obj));
  const keys = path.split('.');
  let current: Record<string, unknown> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return result;
}

/**
 * 두 객체를 비교하여 차이점만 추출 (LiveConfigUpdate 형태)
 */
function getDiff(original: LiveConfig, current: LiveConfig): LiveConfigUpdate {
  const update: LiveConfigUpdate = {};

  // chat_monitor 비교
  if (JSON.stringify(original.chat_monitor) !== JSON.stringify(current.chat_monitor)) {
    update.chat_monitor = {};

    // enabled
    if (original.chat_monitor.enabled !== current.chat_monitor.enabled) {
      update.chat_monitor.enabled = current.chat_monitor.enabled;
    }

    // max_retries
    if (original.chat_monitor.max_retries !== current.chat_monitor.max_retries) {
      update.chat_monitor.max_retries = current.chat_monitor.max_retries;
    }

    // retry_interval
    if (original.chat_monitor.retry_interval !== current.chat_monitor.retry_interval) {
      update.chat_monitor.retry_interval = current.chat_monitor.retry_interval;
    }

    // youtube
    const youtubeOrig = original.chat_monitor.youtube;
    const youtubeCurr = current.chat_monitor.youtube;
    if (JSON.stringify(youtubeOrig) !== JSON.stringify(youtubeCurr)) {
      update.chat_monitor.youtube = {};
      if (youtubeOrig.enabled !== youtubeCurr.enabled) {
        update.chat_monitor.youtube.enabled = youtubeCurr.enabled;
      }
      if (youtubeOrig.api_key !== youtubeCurr.api_key && youtubeCurr.api_key) {
        update.chat_monitor.youtube.api_key = youtubeCurr.api_key;
      }
      if (youtubeOrig.channel_id !== youtubeCurr.channel_id) {
        update.chat_monitor.youtube.channel_id = youtubeCurr.channel_id;
      }
    }

    // chzzk
    const chzzkOrig = original.chat_monitor.chzzk;
    const chzzkCurr = current.chat_monitor.chzzk;
    if (JSON.stringify(chzzkOrig) !== JSON.stringify(chzzkCurr)) {
      update.chat_monitor.chzzk = {};
      if (chzzkOrig.enabled !== chzzkCurr.enabled) {
        update.chat_monitor.chzzk.enabled = chzzkCurr.enabled;
      }
      if (chzzkOrig.channel_id !== chzzkCurr.channel_id) {
        update.chat_monitor.chzzk.channel_id = chzzkCurr.channel_id;
      }
      if (chzzkOrig.client_id !== chzzkCurr.client_id && chzzkCurr.client_id) {
        update.chat_monitor.chzzk.client_id = chzzkCurr.client_id;
      }
      if (chzzkOrig.client_secret !== chzzkCurr.client_secret && chzzkCurr.client_secret) {
        update.chat_monitor.chzzk.client_secret = chzzkCurr.client_secret;
      }
      if (chzzkOrig.redirect_uri !== chzzkCurr.redirect_uri) {
        update.chat_monitor.chzzk.redirect_uri = chzzkCurr.redirect_uri;
      }
    }
  }

  return update;
}

export function useLiveConfig(): UseLiveConfigReturn {
  const [config, setConfig] = useState<LiveConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<LiveConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 변경 여부 계산
  const isDirty = useMemo(() => {
    if (!config || !originalConfig) return false;
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  }, [config, originalConfig]);

  // 초기 로드
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchLiveConfig();
      setConfig(data);
      setOriginalConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 중첩 경로로 필드 업데이트
  const updateField = useCallback((path: string, value: unknown) => {
    setConfig((prev) => {
      if (!prev) return null;
      return setNestedValue(prev as unknown as Record<string, unknown>, path, value) as unknown as LiveConfig;
    });
  }, []);

  // 저장
  const save = useCallback(async (): Promise<boolean> => {
    if (!config || !originalConfig || !isDirty) return true;

    setIsSaving(true);
    setError(null);

    try {
      const update = getDiff(originalConfig, config);
      const result = await updateLiveConfig(update);
      setConfig(result.live_config);
      setOriginalConfig(result.live_config);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [config, originalConfig, isDirty]);

  // 리셋
  const reset = useCallback(() => {
    if (originalConfig) {
      setConfig(JSON.parse(JSON.stringify(originalConfig)));
    }
    setError(null);
  }, [originalConfig]);

  return {
    config,
    originalConfig,
    isDirty,
    isLoading,
    isSaving,
    error,
    updateField,
    save,
    reset,
    refresh,
  };
}
