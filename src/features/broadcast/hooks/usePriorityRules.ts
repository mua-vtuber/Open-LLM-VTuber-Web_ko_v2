/**
 * Priority Rules Hook
 * 우선순위 규칙 조회/수정/저장 (2중 상태 관리)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PriorityRules, PriorityRulesUpdate } from '../types';
import { fetchPriorityRules, updatePriorityRules } from '../api';

interface UsePriorityRulesReturn {
  /** 현재 규칙 (수정 중인 값) */
  rules: PriorityRules | null;
  /** 원본 규칙 (서버 저장 값) */
  originalRules: PriorityRules | null;
  /** 변경 여부 */
  isDirty: boolean;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 저장 중 상태 */
  isSaving: boolean;
  /** 에러 */
  error: string | null;
  /** 필드 업데이트 */
  updateField: <K extends keyof PriorityRules>(key: K, value: PriorityRules[K]) => void;
  /** 저장 */
  save: () => Promise<boolean>;
  /** 리셋 (원본으로 복원) */
  reset: () => void;
  /** 새로고침 */
  refresh: () => Promise<void>;
}

export function usePriorityRules(): UsePriorityRulesReturn {
  const [rules, setRules] = useState<PriorityRules | null>(null);
  const [originalRules, setOriginalRules] = useState<PriorityRules | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 변경 여부 계산
  const isDirty = useMemo(() => {
    if (!rules || !originalRules) return false;
    return JSON.stringify(rules) !== JSON.stringify(originalRules);
  }, [rules, originalRules]);

  // 초기 로드
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPriorityRules();
      setRules(data);
      setOriginalRules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 필드 업데이트
  const updateField = useCallback(<K extends keyof PriorityRules>(
    key: K,
    value: PriorityRules[K]
  ) => {
    setRules((prev) => (prev ? { ...prev, [key]: value } : null));
  }, []);

  // 저장
  const save = useCallback(async (): Promise<boolean> => {
    if (!rules || !originalRules || !isDirty) return true;

    setIsSaving(true);
    setError(null);

    try {
      // 변경된 필드만 추출
      const update: PriorityRulesUpdate = {};
      for (const key of Object.keys(rules) as Array<keyof PriorityRules>) {
        if (rules[key] !== originalRules[key]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (update as any)[key] = rules[key];
        }
      }

      const result = await updatePriorityRules(update);
      setRules(result.priority_rules);
      setOriginalRules(result.priority_rules);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [rules, originalRules, isDirty]);

  // 리셋
  const reset = useCallback(() => {
    if (originalRules) {
      setRules({ ...originalRules });
    }
    setError(null);
  }, [originalRules]);

  return {
    rules,
    originalRules,
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
