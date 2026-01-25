import { ipcMain, BrowserWindow, shell, screen, nativeImage, Tray, Menu, app, globalShortcut, dialog } from "electron";
import { is, electronApp, optimizer } from "@electron-toolkit/utils";
import { join } from "path";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const isMac = process.platform === "darwin";
class WindowManager {
  window = null;
  windowedBounds = null;
  hoveringComponents = /* @__PURE__ */ new Set();
  currentMode = "studio";
  forceIgnoreMouse = false;
  ignoreMouseDebounceTimer = null;
  constructor() {
    ipcMain.on("renderer-ready-for-mode-change", (_event, newMode) => {
      setTimeout(() => {
        this.applyModeSettings(newMode);
      }, 300);
    });
    ipcMain.on("mode-change-rendered", () => {
      this.window?.setOpacity(1);
    });
  }
  createWindow(options) {
    this.window = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false,
      transparent: true,
      backgroundColor: "#0f0f0f",
      autoHideMenuBar: true,
      frame: false,
      icon: process.platform === "win32" ? join(__dirname, "../../resources/icon.ico") : join(__dirname, "../../resources/icon.png"),
      ...isMac ? { titleBarStyle: "hiddenInset" } : {},
      webPreferences: {
        preload: join(__dirname, "../preload/index.mjs"),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      },
      hasShadow: true,
      ...options
    });
    this.setupWindowEvents();
    this.loadContent();
    return this.window;
  }
  setupWindowEvents() {
    if (!this.window) return;
    this.window.on("ready-to-show", () => {
      this.window?.show();
      this.window?.webContents.send("window-maximized-change", this.window.isMaximized());
    });
    this.window.on("maximize", () => {
      this.window?.webContents.send("window-maximized-change", true);
    });
    this.window.on("unmaximize", () => {
      this.window?.webContents.send("window-maximized-change", false);
    });
    this.window.on("enter-full-screen", () => {
      this.window?.webContents.send("window-fullscreen-change", true);
    });
    this.window.on("leave-full-screen", () => {
      this.window?.webContents.send("window-fullscreen-change", false);
    });
    this.window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: "deny" };
    });
  }
  loadContent() {
    if (!this.window) return;
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      this.window.loadURL(process.env.ELECTRON_RENDERER_URL);
    } else {
      this.window.loadFile(join(__dirname, "../renderer/index.html"));
    }
  }
  setWindowMode(mode) {
    if (!this.window || this.currentMode === mode) return;
    this.currentMode = mode;
    this.applyModeSettings(mode);
  }
  applyModeSettings(mode) {
    if (!this.window) return;
    switch (mode) {
      case "studio":
        this.applyStudioMode();
        break;
      case "live":
        this.applyLiveMode();
        break;
      case "companion":
        this.applyCompanionMode();
        break;
    }
    this.window.webContents.send("mode-changed", mode);
  }
  applyStudioMode() {
    if (!this.window) return;
    this.window.setAlwaysOnTop(false);
    this.window.setIgnoreMouseEvents(false);
    this.window.setSkipTaskbar(false);
    this.window.setResizable(true);
    this.window.setFocusable(true);
    this.window.setBackgroundColor("#0f0f0f");
    if (this.windowedBounds) {
      this.window.setBounds(this.windowedBounds);
    } else {
      this.window.setSize(1200, 800);
      this.window.center();
    }
    if (isMac) {
      this.window.setWindowButtonVisibility(true);
    }
  }
  applyLiveMode() {
    if (!this.window) return;
    this.windowedBounds = this.window.getBounds();
    this.window.setAlwaysOnTop(false);
    this.window.setIgnoreMouseEvents(false);
    this.window.setSkipTaskbar(false);
    this.window.setResizable(true);
    this.window.setFocusable(true);
    this.window.setBackgroundColor("#00ff00");
    this.window.setSize(800, 600);
    this.window.center();
  }
  applyCompanionMode() {
    if (!this.window) return;
    this.windowedBounds = this.window.getBounds();
    if (this.window.isFullScreen()) {
      this.window.setFullScreen(false);
    }
    this.window.setBackgroundColor("#00000000");
    this.window.setAlwaysOnTop(true, "screen-saver");
    const displays = screen.getAllDisplays();
    const minX = Math.min(...displays.map((d) => d.bounds.x));
    const minY = Math.min(...displays.map((d) => d.bounds.y));
    const maxX = Math.max(...displays.map((d) => d.bounds.x + d.bounds.width));
    const maxY = Math.max(...displays.map((d) => d.bounds.y + d.bounds.height));
    this.window.setBounds({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    });
    if (isMac) {
      this.window.setWindowButtonVisibility(false);
      this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }
    this.window.setResizable(false);
    this.window.setSkipTaskbar(true);
    this.window.setFocusable(false);
    if (isMac) {
      this.window.setIgnoreMouseEvents(true);
    } else {
      this.window.setIgnoreMouseEvents(true, { forward: true });
    }
  }
  getWindow() {
    return this.window;
  }
  getCurrentMode() {
    return this.currentMode;
  }
  setIgnoreMouseEvents(ignore) {
    if (!this.window) return;
    if (isMac) {
      this.window.setIgnoreMouseEvents(ignore);
    } else {
      this.window.setIgnoreMouseEvents(ignore, { forward: true });
    }
  }
  maximizeWindow() {
    if (!this.window) return;
    if (this.isWindowMaximized()) {
      if (this.windowedBounds) {
        this.window.setBounds(this.windowedBounds);
        this.windowedBounds = null;
        this.window.webContents.send("window-maximized-change", false);
      }
    } else {
      this.windowedBounds = this.window.getBounds();
      const { width, height } = screen.getPrimaryDisplay().workArea;
      this.window.setBounds({ x: 0, y: 0, width, height });
      this.window.webContents.send("window-maximized-change", true);
    }
  }
  isWindowMaximized() {
    if (!this.window) return false;
    const bounds = this.window.getBounds();
    const { width, height } = screen.getPrimaryDisplay().workArea;
    return bounds.width >= width && bounds.height >= height;
  }
  updateComponentHover(componentId, isHovering) {
    if (this.currentMode !== "companion") return;
    if (this.forceIgnoreMouse) return;
    if (this.ignoreMouseDebounceTimer) {
      clearTimeout(this.ignoreMouseDebounceTimer);
      this.ignoreMouseDebounceTimer = null;
    }
    if (isHovering) {
      this.hoveringComponents.add(componentId);
      if (this.window) {
        if (isMac) {
          this.window.setIgnoreMouseEvents(false);
        } else {
          this.window.setIgnoreMouseEvents(false, { forward: true });
        }
        this.window.setFocusable(true);
      }
    } else {
      this.hoveringComponents.delete(componentId);
      const shouldIgnore = this.hoveringComponents.size === 0;
      if (shouldIgnore && this.window) {
        this.ignoreMouseDebounceTimer = setTimeout(() => {
          if (this.hoveringComponents.size === 0 && !this.forceIgnoreMouse) {
            if (isMac) {
              this.window?.setIgnoreMouseEvents(true);
            } else {
              this.window?.setIgnoreMouseEvents(true, { forward: true });
            }
          }
          this.ignoreMouseDebounceTimer = null;
        }, 150);
      }
    }
  }
  toggleForceIgnoreMouse() {
    this.forceIgnoreMouse = !this.forceIgnoreMouse;
    if (this.forceIgnoreMouse) {
      if (isMac) {
        this.window?.setIgnoreMouseEvents(true);
      } else {
        this.window?.setIgnoreMouseEvents(true, { forward: true });
      }
    } else {
      const shouldIgnore = this.hoveringComponents.size === 0;
      if (isMac) {
        this.window?.setIgnoreMouseEvents(shouldIgnore);
      } else {
        this.window?.setIgnoreMouseEvents(shouldIgnore, { forward: true });
      }
    }
    this.window?.webContents.send("force-ignore-mouse-changed", this.forceIgnoreMouse);
  }
}
class MenuManager {
  tray = null;
  currentMode = "studio";
  onModeChange;
  constructor(onModeChange) {
    this.onModeChange = onModeChange;
  }
  createTray() {
    const iconPath = process.platform === "win32" ? join(__dirname, "../../resources/icon.ico") : join(__dirname, "../../resources/icon.png");
    let icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));
    this.tray.setToolTip("Open-LLM-VTuber");
    this.updateTrayMenu();
    this.tray.on("click", () => {
      this.updateTrayMenu();
    });
  }
  setMode(mode) {
    this.currentMode = mode;
    this.updateTrayMenu();
  }
  updateTrayMenu() {
    if (!this.tray) return;
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Open-LLM-VTuber",
        enabled: false
      },
      { type: "separator" },
      {
        label: "Studio Mode",
        type: "radio",
        checked: this.currentMode === "studio",
        click: () => {
          this.currentMode = "studio";
          this.onModeChange("studio");
          this.updateTrayMenu();
        }
      },
      {
        label: "Live Mode",
        type: "radio",
        checked: this.currentMode === "live",
        click: () => {
          this.currentMode = "live";
          this.onModeChange("live");
          this.updateTrayMenu();
        }
      },
      {
        label: "Companion Mode",
        type: "radio",
        checked: this.currentMode === "companion",
        click: () => {
          this.currentMode = "companion";
          this.onModeChange("companion");
          this.updateTrayMenu();
        }
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          app.quit();
        }
      }
    ]);
    this.tray.setContextMenu(contextMenu);
  }
  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
let windowManager;
let menuManager;
let isQuitting = false;
function setupIPC() {
  ipcMain.handle("get-platform", () => process.platform);
  ipcMain.handle("select-folder", async () => {
    const window = windowManager.getWindow();
    const result = await dialog.showOpenDialog(window, {
      properties: ["openDirectory"],
      title: "Live2D 모델 폴더 선택"
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
  ipcMain.on("set-ignore-mouse-events", (_event, ignore) => {
    const window = windowManager.getWindow();
    if (window) {
      windowManager.setIgnoreMouseEvents(ignore);
    }
  });
  ipcMain.on("get-current-mode", (event) => {
    event.returnValue = windowManager.getCurrentMode();
  });
  ipcMain.on("set-mode", (_event, mode) => {
    windowManager.setWindowMode(mode);
  });
  ipcMain.on("window-minimize", () => {
    windowManager.getWindow()?.minimize();
  });
  ipcMain.on("window-maximize", () => {
    const window = windowManager.getWindow();
    if (window) {
      windowManager.maximizeWindow();
    }
  });
  ipcMain.on("window-close", () => {
    const window = windowManager.getWindow();
    if (window) {
      if (process.platform === "darwin") {
        window.hide();
      } else {
        window.close();
      }
    }
  });
  ipcMain.on("update-component-hover", (_event, componentId, isHovering) => {
    windowManager.updateComponentHover(componentId, isHovering);
  });
  ipcMain.on("toggle-force-ignore-mouse", () => {
    windowManager.toggleForceIgnoreMouse();
  });
}
function setupGlobalShortcuts() {
  globalShortcut.register("Alt+M", () => {
    const window = windowManager.getWindow();
    if (window) {
      window.webContents.send("global-mic-toggle");
    }
  });
  globalShortcut.register("Alt+Escape", () => {
    const window = windowManager.getWindow();
    if (window) {
      window.webContents.send("global-interrupt");
    }
  });
}
app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.openllmvtuber");
  windowManager = new WindowManager();
  menuManager = new MenuManager((mode) => windowManager.setWindowMode(mode));
  const window = windowManager.createWindow({
    titleBarOverlay: {
      color: "#0f0f0f",
      symbolColor: "#ffffff",
      height: 30
    }
  });
  menuManager.createTray();
  window.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      window.hide();
    }
    return false;
  });
  setupIPC();
  setupGlobalShortcuts();
  app.on("activate", () => {
    const window2 = windowManager.getWindow();
    if (window2) {
      window2.show();
    }
  });
  app.on("browser-window-created", (_, window2) => {
    optimizer.watchWindowShortcuts(window2);
  });
  app.on("web-contents-created", (_, contents) => {
    contents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === "media") {
        callback(true);
      } else {
        callback(false);
      }
    });
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("before-quit", () => {
  isQuitting = true;
  menuManager.destroy();
  globalShortcut.unregisterAll();
});
