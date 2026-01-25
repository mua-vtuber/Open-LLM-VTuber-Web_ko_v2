/**
 * useConfigSync Hook
 * 프론트엔드 설정을 백엔드와 동기화
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../../../shared/store';
import type { LLMProvider } from '../../../shared/types';

// 프론트엔드 프로바이더 ID → 백엔드 LLM 프로바이더 이름 매핑
const PROVIDER_MAP: Record<LLMProvider, string> = {
  openai: 'openai_llm',
  claude: 'claude_llm',
  gemini: 'gemini_llm',
  ollama: 'ollama_llm',
  groq: 'groq_llm',
  deepseek: 'deepseek_llm',
  mistral: 'mistral_llm',
  openai_compatible: 'openai_compatible_llm',
};

interface UseConfigSyncReturn {
  /** 저장 중 상태 */
  isSaving: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 성공 메시지 */
  success: string | null;
  /** AI 설정을 백엔드에 동기화 */
  syncAISettings: () => Promise<boolean>;
  /** 모든 설정 저장 (AI 설정만 백엔드 동기화) */
  saveAllSettings: () => Promise<boolean>;
  /** 에러 초기화 */
  clearError: () => void;
  /** 성공 메시지 초기화 */
  clearSuccess: () => void;
}

/**
 * 프론트엔드 AI 설정을 백엔드 형식으로 변환
 */
function convertToBackendFormat(aiSettings: ReturnType<typeof useAppStore.getState>['settings']['ai']) {
  const { currentProvider, providers } = aiSettings;
  const providerConfig = providers[currentProvider];
  const backendProviderName = PROVIDER_MAP[currentProvider];

  if (!providerConfig || !backendProviderName) {
    throw new Error(`Unknown provider: ${currentProvider}`);
  }

  // 백엔드 character_config.agent_config 형식으로 변환
  return {
    agent_config: {
      agent_settings: {
        basic_memory_agent: {
          llm_provider: backendProviderName,
        },
      },
      stateless_llm_configs: {
        [backendProviderName]: {
          llm_api_key: providerConfig.apiKey || '',
          base_url: providerConfig.baseUrl || '',
          model: providerConfig.model || '',
          temperature: providerConfig.temperature ?? 1.0,
        },
      },
    },
  };
}

/**
 * WebSocket을 통해 설정 업데이트 메시지 전송
 */
function sendUpdateConfig(config: object): Promise<{ success: boolean; message?: string }> {
  return new Promise((resolve, reject) => {
    const ws = (window as unknown as { __vtuberWebSocket?: WebSocket }).__vtuberWebSocket;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket not connected'));
      return;
    }

    // 응답 핸들러 설정
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'config-updated') {
          ws.removeEventListener('message', handleMessage);
          resolve({ success: true, message: data.message });
        } else if (data.type === 'config-update-error') {
          ws.removeEventListener('message', handleMessage);
          resolve({ success: false, message: data.error });
        }
      } catch {
        // 다른 메시지는 무시
      }
    };

    ws.addEventListener('message', handleMessage);

    // 타임아웃 설정 (10초)
    const timeout = setTimeout(() => {
      ws.removeEventListener('message', handleMessage);
      reject(new Error('Request timeout'));
    }, 10000);

    // 메시지 전송
    ws.send(
      JSON.stringify({
        type: 'update-config',
        config,
      })
    );

    // Promise가 resolve/reject될 때 타임아웃 클리어
    const originalResolve = resolve;
    const originalReject = reject;

    resolve = (value) => {
      clearTimeout(timeout);
      originalResolve(value);
    };
    reject = (reason) => {
      clearTimeout(timeout);
      originalReject(reason);
    };
  });
}

export function useConfigSync(): UseConfigSyncReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 에러 자동 클리어
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccess(null);
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, []);

  /**
   * AI 설정을 백엔드에 동기화
   */
  const syncAISettings = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const aiSettings = useAppStore.getState().settings.ai;
      const backendConfig = convertToBackendFormat(aiSettings);

      const result = await sendUpdateConfig(backendConfig);

      if (result.success) {
        setSuccess(result.message || 'Settings saved successfully');
        // 3초 후 성공 메시지 자동 클리어
        successTimeoutRef.current = setTimeout(() => {
          setSuccess(null);
        }, 3000);
        return true;
      } else {
        setError(result.message || 'Failed to save settings');
        // 5초 후 에러 자동 클리어
        errorTimeoutRef.current = setTimeout(() => {
          setError(null);
        }, 5000);
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      // 5초 후 에러 자동 클리어
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * 모든 설정 저장
   * - 프론트엔드 전용 설정: localStorage에 자동 저장 (Zustand persist)
   * - AI 설정: 백엔드에 동기화
   */
  const saveAllSettings = useCallback(async (): Promise<boolean> => {
    // AI 설정만 백엔드에 동기화
    // (다른 설정들은 Zustand persist가 자동으로 localStorage에 저장)
    return syncAISettings();
  }, [syncAISettings]);

  return {
    isSaving,
    error,
    success,
    syncAISettings,
    saveAllSettings,
    clearError,
    clearSuccess,
  };
}
