import { BrowserWindow, screen, shell, ipcMain } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';

const isMac = process.platform === 'darwin';

export type AppMode = 'studio' | 'live' | 'companion';

export class WindowManager {
  private window: BrowserWindow | null = null;
  private windowedBounds: { x: number; y: number; width: number; height: number } | null = null;
  private hoveringComponents: Set<string> = new Set();
  private currentMode: AppMode = 'studio';
  private forceIgnoreMouse = false;
  private ignoreMouseDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    ipcMain.on('renderer-ready-for-mode-change', (_event, newMode: AppMode) => {
      setTimeout(() => {
        this.applyModeSettings(newMode);
      }, 300);
    });

    ipcMain.on('mode-change-rendered', () => {
      this.window?.setOpacity(1);
    });
  }

  createWindow(options: Electron.BrowserWindowConstructorOptions): BrowserWindow {
    this.window = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false,
      transparent: true,
      backgroundColor: '#0f0f0f',
      autoHideMenuBar: true,
      frame: false,
      icon: process.platform === 'win32'
        ? join(__dirname, '../../resources/icon.ico')
        : join(__dirname, '../../resources/icon.png'),
      ...(isMac ? { titleBarStyle: 'hiddenInset' } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false,
      },
      hasShadow: true,
      ...options,
    });

    this.setupWindowEvents();
    this.loadContent();

    return this.window;
  }

  private setupWindowEvents(): void {
    if (!this.window) return;

    this.window.on('ready-to-show', () => {
      this.window?.show();
      this.window?.webContents.send('window-maximized-change', this.window.isMaximized());
    });

    this.window.on('maximize', () => {
      this.window?.webContents.send('window-maximized-change', true);
    });

    this.window.on('unmaximize', () => {
      this.window?.webContents.send('window-maximized-change', false);
    });

    this.window.on('enter-full-screen', () => {
      this.window?.webContents.send('window-fullscreen-change', true);
    });

    this.window.on('leave-full-screen', () => {
      this.window?.webContents.send('window-fullscreen-change', false);
    });

    this.window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });
  }

  private loadContent(): void {
    if (!this.window) return;

    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      this.window.loadURL(process.env.ELECTRON_RENDERER_URL);
    } else {
      this.window.loadFile(join(__dirname, '../renderer/index.html'));
    }
  }

  setWindowMode(mode: AppMode): void {
    if (!this.window || this.currentMode === mode) return;

    this.currentMode = mode;

    // 직접 모드 설정 적용 (간단한 방식)
    this.applyModeSettings(mode);
  }

  private applyModeSettings(mode: AppMode): void {
    if (!this.window) return;

    switch (mode) {
      case 'studio':
        this.applyStudioMode();
        break;
      case 'live':
        this.applyLiveMode();
        break;
      case 'companion':
        this.applyCompanionMode();
        break;
    }

    this.window.webContents.send('mode-changed', mode);
  }

  private applyStudioMode(): void {
    if (!this.window) return;

    this.window.setAlwaysOnTop(false);
    this.window.setIgnoreMouseEvents(false);
    this.window.setSkipTaskbar(false);
    this.window.setResizable(true);
    this.window.setFocusable(true);
    this.window.setBackgroundColor('#0f0f0f');

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

  private applyLiveMode(): void {
    if (!this.window) return;

    this.windowedBounds = this.window.getBounds();

    this.window.setAlwaysOnTop(false);
    this.window.setIgnoreMouseEvents(false);
    this.window.setSkipTaskbar(false);
    this.window.setResizable(true);
    this.window.setFocusable(true);
    this.window.setBackgroundColor('#00ff00'); // Green screen for OBS

    this.window.setSize(800, 600);
    this.window.center();
  }

  private applyCompanionMode(): void {
    if (!this.window) return;

    this.windowedBounds = this.window.getBounds();

    if (this.window.isFullScreen()) {
      this.window.setFullScreen(false);
    }

    this.window.setBackgroundColor('#00000000');
    this.window.setAlwaysOnTop(true, 'screen-saver');

    // Cover all displays
    const displays = screen.getAllDisplays();
    const minX = Math.min(...displays.map((d) => d.bounds.x));
    const minY = Math.min(...displays.map((d) => d.bounds.y));
    const maxX = Math.max(...displays.map((d) => d.bounds.x + d.bounds.width));
    const maxY = Math.max(...displays.map((d) => d.bounds.y + d.bounds.height));

    this.window.setBounds({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
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

  getWindow(): BrowserWindow | null {
    return this.window;
  }

  getCurrentMode(): AppMode {
    return this.currentMode;
  }

  setIgnoreMouseEvents(ignore: boolean): void {
    if (!this.window) return;

    if (isMac) {
      this.window.setIgnoreMouseEvents(ignore);
    } else {
      this.window.setIgnoreMouseEvents(ignore, { forward: true });
    }
  }

  maximizeWindow(): void {
    if (!this.window) return;

    if (this.isWindowMaximized()) {
      if (this.windowedBounds) {
        this.window.setBounds(this.windowedBounds);
        this.windowedBounds = null;
        this.window.webContents.send('window-maximized-change', false);
      }
    } else {
      this.windowedBounds = this.window.getBounds();
      const { width, height } = screen.getPrimaryDisplay().workArea;
      this.window.setBounds({ x: 0, y: 0, width, height });
      this.window.webContents.send('window-maximized-change', true);
    }
  }

  isWindowMaximized(): boolean {
    if (!this.window) return false;
    const bounds = this.window.getBounds();
    const { width, height } = screen.getPrimaryDisplay().workArea;
    return bounds.width >= width && bounds.height >= height;
  }

  updateComponentHover(componentId: string, isHovering: boolean): void {
    if (this.currentMode !== 'companion') return;
    if (this.forceIgnoreMouse) return;

    // 기존 디바운스 타이머 취소
    if (this.ignoreMouseDebounceTimer) {
      clearTimeout(this.ignoreMouseDebounceTimer);
      this.ignoreMouseDebounceTimer = null;
    }

    if (isHovering) {
      this.hoveringComponents.add(componentId);
      // 호버 시작: 즉시 마우스 이벤트 활성화
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
      // 호버 종료: 지연 후 마우스 이벤트 비활성화 (다른 컴포넌트로 이동 시 깜빡임 방지)
      const shouldIgnore = this.hoveringComponents.size === 0;
      if (shouldIgnore && this.window) {
        this.ignoreMouseDebounceTimer = setTimeout(() => {
          // 타이머 실행 시점에 다시 확인 (그 사이에 다른 컴포넌트에 호버했을 수 있음)
          if (this.hoveringComponents.size === 0 && !this.forceIgnoreMouse) {
            if (isMac) {
              this.window?.setIgnoreMouseEvents(true);
            } else {
              this.window?.setIgnoreMouseEvents(true, { forward: true });
            }
          }
          this.ignoreMouseDebounceTimer = null;
        }, 150); // 150ms 지연
      }
    }
  }

  toggleForceIgnoreMouse(): void {
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

    this.window?.webContents.send('force-ignore-mouse-changed', this.forceIgnoreMouse);
  }
}
