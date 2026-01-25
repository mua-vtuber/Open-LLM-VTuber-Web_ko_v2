/**
 * Queue Status Hook
 * 큐 상태 조회 및 자동 갱신
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { QueueStatus } from '../types';
import { fetchQueueStatus } from '../api';

interface UseQueueStatusOptions {
  /** 자동 갱신 활성화 (기본: true) */
  autoRefresh?: boolean;
  /** 갱신 간격 (ms, 기본: 2000) */
  refreshInterval?: number;
  /** 초기 로드 활성화 (기본: true) */
  initialFetch?: boolean;
}

interface UseQueueStatusReturn {
  /** 큐 상태 */
  status: QueueStatus | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 */
  error: string | null;
  /** 수동 갱신 */
  refresh: () => Promise<void>;
  /** 마지막 업데이트 시간 */
  lastUpdated: number | null;
}

export function useQueueStatus(options: UseQueueStatusOptions = {}): UseQueueStatusReturn {
  const { autoRefresh = true, refreshInterval = 2000, initialFetch = true } = options;

  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchQueueStatus();
      setStatus(data);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    if (initialFetch) {
      refresh();
    }
  }, [initialFetch, refresh]);

  // 자동 갱신
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(refresh, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    status,
    isLoading,
    error,
    refresh,
    lastUpdated,
  };
}
