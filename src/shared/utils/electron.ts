/**
 * Electron 환경 감지 및 API 유틸리티
 */

import type { ElectronAppAPI, AppMode } from '../../preload/index.d';

// Electron 환경인지 확인
export const isElectron = typeof window !== 'undefined' && !!window.api;

// Electron API 래퍼 (웹에서도 안전하게 호출 가능)
export const electronAPI: Partial<ElectronAppAPI> = {
  // Window controls
  minimize: () => window.api?.minimize?.(),
  maximize: () => window.api?.maximize?.(),
  close: () => window.api?.close?.(),

  // Mode management
  setMode: (mode: AppMode) => window.api?.setMode?.(mode),
  getCurrentMode: () => window.api?.getCurrentMode?.() ?? 'studio',

  // Platform info
  platform: window.api?.platform ?? 'browser' as unknown as NodeJS.Platform,
};

// 이벤트 리스너 등록 헬퍼
export function onElectronEvent<T>(
  eventName: keyof ElectronAppAPI,
  callback: (data: T) => void
): (() => void) | undefined {
  if (!isElectron || !window.api) return undefined;

  const handler = window.api[eventName];
  if (typeof handler === 'function') {
    return (handler as (cb: (data: T) => void) => () => void)(callback);
  }
  return undefined;
}

// Companion 모드용 마우스 이벤트 헬퍼
export const companionMouse = {
  setIgnore: (ignore: boolean) => {
    if (isElectron) {
      window.api?.setIgnoreMouseEvents?.(ignore);
    }
  },
  updateHover: (componentId: string, isHovering: boolean) => {
    if (isElectron) {
      window.api?.updateComponentHover?.(componentId, isHovering);
    }
  },
  toggleForceIgnore: () => {
    if (isElectron) {
      window.api?.toggleForceIgnoreMouse?.();
    }
  },
};
