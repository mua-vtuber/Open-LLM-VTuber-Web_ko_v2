import type { StateCreator } from 'zustand';
import type { AppMode } from '../../types';
import { isElectron, electronAPI } from '../../utils/electron';

// ============================================================
// UI 슬라이스 타입 정의
// ============================================================

export interface UIState {
  ui: {
    mode: AppMode;
    sidebarOpen: boolean;
    settingsOpen: boolean;
    settingsSection: string | null;
  };
}

export interface UIActions {
  setMode: (mode: AppMode) => void;
  toggleSidebar: () => void;
  openSettings: (section?: string) => void;
  closeSettings: () => void;
}

export type UISlice = UIState & UIActions;

// ============================================================
// 초기 상태
// ============================================================

export const initialUIState: UIState = {
  ui: {
    mode: 'studio',
    sidebarOpen: true,
    settingsOpen: false,
    settingsSection: null,
  },
};

// ============================================================
// 슬라이스 생성자
// ============================================================

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  ...initialUIState,

  setMode: (mode) => {
    console.log('[Store] setMode:', mode, 'isElectron:', isElectron);
    // Electron에서는 창 설정도 함께 변경
    if (isElectron) {
      console.log('[Store] Calling electronAPI.setMode');
      electronAPI.setMode?.(mode);
    }
    set((state) => ({ ui: { ...state.ui, mode } }));
  },

  toggleSidebar: () =>
    set((state) => ({ ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen } })),

  openSettings: (section) =>
    set((state) => ({
      ui: { ...state.ui, settingsOpen: true, settingsSection: section || null },
    })),

  closeSettings: () =>
    set((state) => ({
      ui: { ...state.ui, settingsOpen: false, settingsSection: null },
    })),
});
