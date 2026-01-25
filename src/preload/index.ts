import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

export type AppMode = 'studio' | 'live' | 'companion';

const api = {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Mode management
  setMode: (mode: AppMode) => ipcRenderer.send('set-mode', mode),
  getCurrentMode: (): AppMode => ipcRenderer.sendSync('get-current-mode'),
  onModeChanged: (callback: (mode: AppMode) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, mode: AppMode) => callback(mode);
    ipcRenderer.on('mode-changed', handler);
    return () => ipcRenderer.removeListener('mode-changed', handler);
  },
  onPreModeChanged: (callback: (mode: AppMode) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, mode: AppMode) => callback(mode);
    ipcRenderer.on('pre-mode-changed', handler);
    return () => ipcRenderer.removeListener('pre-mode-changed', handler);
  },
  notifyModeChangeReady: (mode: AppMode) => {
    ipcRenderer.send('renderer-ready-for-mode-change', mode);
  },
  notifyModeChangeRendered: () => {
    ipcRenderer.send('mode-change-rendered');
  },

  // Mouse events (for companion mode)
  setIgnoreMouseEvents: (ignore: boolean) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore);
  },
  updateComponentHover: (componentId: string, isHovering: boolean) => {
    ipcRenderer.send('update-component-hover', componentId, isHovering);
  },
  toggleForceIgnoreMouse: () => {
    ipcRenderer.send('toggle-force-ignore-mouse');
  },
  onForceIgnoreMouseChanged: (callback: (isForced: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isForced: boolean) => callback(isForced);
    ipcRenderer.on('force-ignore-mouse-changed', handler);
    return () => ipcRenderer.removeListener('force-ignore-mouse-changed', handler);
  },

  // Window state
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => callback(isMaximized);
    ipcRenderer.on('window-maximized-change', handler);
    return () => ipcRenderer.removeListener('window-maximized-change', handler);
  },
  onWindowFullscreenChange: (callback: (isFullscreen: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isFullscreen: boolean) => callback(isFullscreen);
    ipcRenderer.on('window-fullscreen-change', handler);
    return () => ipcRenderer.removeListener('window-fullscreen-change', handler);
  },

  // Global shortcuts
  onGlobalMicToggle: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('global-mic-toggle', handler);
    return () => ipcRenderer.removeListener('global-mic-toggle', handler);
  },
  onGlobalInterrupt: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('global-interrupt', handler);
    return () => ipcRenderer.removeListener('global-interrupt', handler);
  },

  // Platform info
  getPlatform: () => ipcRenderer.invoke('get-platform') as Promise<NodeJS.Platform>,
  platform: process.platform,

  // File dialogs
  selectFolder: () => ipcRenderer.invoke('select-folder') as Promise<string | null>,
};

// Expose APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error('Failed to expose APIs:', error);
  }
} else {
  // @ts-ignore
  window.electron = electronAPI;
  // @ts-ignore
  window.api = api;
}
