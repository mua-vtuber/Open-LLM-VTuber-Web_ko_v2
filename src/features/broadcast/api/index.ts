/**
 * Broadcast API Client
 * REST API 호출 함수들
 */

import CONFIG from '../../../shared/config';
import { useAppStore } from '../../../shared/store';
import type {
  QueueStatus,
  QueueHistory,
  PriorityRules,
  PriorityRulesUpdate,
  LiveConfig,
  LiveConfigUpdate,
} from '../types';

// API Base URL - Store 상태에서 실시간으로 조회
const getBaseUrl = () => {
  return useAppStore.getState().settings.system.apiUrl || CONFIG.apiUrl;
};


// ============================================================
// Queue API
// ============================================================

/**
 * 큐 상태 조회
 */
export async function fetchQueueStatus(): Promise<QueueStatus> {
  const res = await fetch(`${getBaseUrl()}/api/queue/status`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * 큐 메트릭 히스토리 조회
 */
export async function fetchQueueHistory(minutes: number = 5): Promise<QueueHistory> {
  const res = await fetch(`${getBaseUrl()}/api/queue/history?minutes=${minutes}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * 우선순위 규칙 조회
 */
export async function fetchPriorityRules(): Promise<PriorityRules> {
  const res = await fetch(`${getBaseUrl()}/api/queue/priority-rules`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * 우선순위 규칙 업데이트
 */
export async function updatePriorityRules(
  update: PriorityRulesUpdate
): Promise<{ success: boolean; priority_rules: PriorityRules }> {
  const res = await fetch(`${getBaseUrl()}/api/queue/priority-rules`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ============================================================
// Live Config API
// ============================================================

/**
 * 라이브 설정 조회
 */
export async function fetchLiveConfig(): Promise<LiveConfig> {
  const res = await fetch(`${getBaseUrl()}/api/live-config`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * 라이브 설정 업데이트
 */
export async function updateLiveConfig(
  update: LiveConfigUpdate
): Promise<{ success: boolean; live_config: LiveConfig }> {
  const res = await fetch(`${getBaseUrl()}/api/live-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ============================================================
// Chzzk OAuth
// ============================================================

/**
 * Chzzk OAuth 시작 URL
 */
export function getChzzkAuthUrl(): string {
  return `${getBaseUrl()}/chzzk/auth`;
}

/**
 * Chzzk OAuth 팝업 열기
 */
export function openChzzkAuth(): void {
  const url = getChzzkAuthUrl();
  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  window.open(
    url,
    'ChzzkAuth',
    `width=${width},height=${height},left=${left},top=${top}`
  );
}
