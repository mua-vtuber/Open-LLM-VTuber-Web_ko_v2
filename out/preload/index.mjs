import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
const api = {
  // Window controls
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  // Mode management
  setMode: (mode) => ipcRenderer.send("set-mode", mode),
  getCurrentMode: () => ipcRenderer.sendSync("get-current-mode"),
  onModeChanged: (callback) => {
    const handler = (_event, mode) => callback(mode);
    ipcRenderer.on("mode-changed", handler);
    return () => ipcRenderer.removeListener("mode-changed", handler);
  },
  onPreModeChanged: (callback) => {
    const handler = (_event, mode) => callback(mode);
    ipcRenderer.on("pre-mode-changed", handler);
    return () => ipcRenderer.removeListener("pre-mode-changed", handler);
  },
  notifyModeChangeReady: (mode) => {
    ipcRenderer.send("renderer-ready-for-mode-change", mode);
  },
  notifyModeChangeRendered: () => {
    ipcRenderer.send("mode-change-rendered");
  },
  // Mouse events (for companion mode)
  setIgnoreMouseEvents: (ignore) => {
    ipcRenderer.send("set-ignore-mouse-events", ignore);
  },
  updateComponentHover: (componentId, isHovering) => {
    ipcRenderer.send("update-component-hover", componentId, isHovering);
  },
  toggleForceIgnoreMouse: () => {
    ipcRenderer.send("toggle-force-ignore-mouse");
  },
  onForceIgnoreMouseChanged: (callback) => {
    const handler = (_event, isForced) => callback(isForced);
    ipcRenderer.on("force-ignore-mouse-changed", handler);
    return () => ipcRenderer.removeListener("force-ignore-mouse-changed", handler);
  },
  // Window state
  onWindowMaximizedChange: (callback) => {
    const handler = (_event, isMaximized) => callback(isMaximized);
    ipcRenderer.on("window-maximized-change", handler);
    return () => ipcRenderer.removeListener("window-maximized-change", handler);
  },
  onWindowFullscreenChange: (callback) => {
    const handler = (_event, isFullscreen) => callback(isFullscreen);
    ipcRenderer.on("window-fullscreen-change", handler);
    return () => ipcRenderer.removeListener("window-fullscreen-change", handler);
  },
  // Global shortcuts
  onGlobalMicToggle: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("global-mic-toggle", handler);
    return () => ipcRenderer.removeListener("global-mic-toggle", handler);
  },
  onGlobalInterrupt: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("global-interrupt", handler);
    return () => ipcRenderer.removeListener("global-interrupt", handler);
  },
  // Platform info
  getPlatform: () => ipcRenderer.invoke("get-platform"),
  platform: process.platform,
  // File dialogs
  selectFolder: () => ipcRenderer.invoke("select-folder")
};
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error("Failed to expose APIs:", error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}
