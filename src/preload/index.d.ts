import { ElectronAPI } from '@electron-toolkit/preload';

export type AppMode = 'studio' | 'live' | 'companion';

export interface ElectronAppAPI {
  // Window controls
  minimize: () => void;
  maximize: () => void;
  close: () => void;

  // Mode management
  setMode: (mode: AppMode) => void;
  getCurrentMode: () => AppMode;
  onModeChanged: (callback: (mode: AppMode) => void) => () => void;
  onPreModeChanged: (callback: (mode: AppMode) => void) => () => void;
  notifyModeChangeReady: (mode: AppMode) => void;
  notifyModeChangeRendered: () => void;

  // Mouse events (for companion mode)
  setIgnoreMouseEvents: (ignore: boolean) => void;
  updateComponentHover: (componentId: string, isHovering: boolean) => void;
  toggleForceIgnoreMouse: () => void;
  onForceIgnoreMouseChanged: (callback: (isForced: boolean) => void) => () => void;

  // Window state
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
  onWindowFullscreenChange: (callback: (isFullscreen: boolean) => void) => () => void;

  // Global shortcuts
  onGlobalMicToggle: (callback: () => void) => () => void;
  onGlobalInterrupt: (callback: () => void) => () => void;

  // Platform info
  getPlatform: () => Promise<NodeJS.Platform>;
  platform: NodeJS.Platform;

  // File dialogs
  selectFolder: () => Promise<string | null>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: ElectronAppAPI;
  }
}
