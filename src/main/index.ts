import { app, ipcMain, globalShortcut, BrowserWindow, dialog } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { WindowManager } from './window-manager';
import { MenuManager } from './menu-manager';

let windowManager: WindowManager;
let menuManager: MenuManager;
let isQuitting = false;

function setupIPC(): void {
  ipcMain.handle('get-platform', () => process.platform);

  // 폴더 선택 다이얼로그 (Live2D 모델 폴더 선택용)
  ipcMain.handle('select-folder', async () => {
    const window = windowManager.getWindow();
    const result = await dialog.showOpenDialog(window!, {
      properties: ['openDirectory'],
      title: 'Live2D 모델 폴더 선택',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.on('set-ignore-mouse-events', (_event, ignore: boolean) => {
    const window = windowManager.getWindow();
    if (window) {
      windowManager.setIgnoreMouseEvents(ignore);
    }
  });

  ipcMain.on('get-current-mode', (event) => {
    event.returnValue = windowManager.getCurrentMode();
  });

  ipcMain.on('set-mode', (_event, mode: 'studio' | 'live' | 'companion') => {
    windowManager.setWindowMode(mode);
  });

  ipcMain.on('window-minimize', () => {
    windowManager.getWindow()?.minimize();
  });

  ipcMain.on('window-maximize', () => {
    const window = windowManager.getWindow();
    if (window) {
      windowManager.maximizeWindow();
    }
  });

  ipcMain.on('window-close', () => {
    const window = windowManager.getWindow();
    if (window) {
      if (process.platform === 'darwin') {
        window.hide();
      } else {
        window.close();
      }
    }
  });

  ipcMain.on('update-component-hover', (_event, componentId: string, isHovering: boolean) => {
    windowManager.updateComponentHover(componentId, isHovering);
  });

  ipcMain.on('toggle-force-ignore-mouse', () => {
    windowManager.toggleForceIgnoreMouse();
  });
}

function setupGlobalShortcuts(): void {
  // Global microphone toggle (Alt+M)
  globalShortcut.register('Alt+M', () => {
    const window = windowManager.getWindow();
    if (window) {
      window.webContents.send('global-mic-toggle');
    }
  });

  // Global interrupt (Escape - only when not focused)
  globalShortcut.register('Alt+Escape', () => {
    const window = windowManager.getWindow();
    if (window) {
      window.webContents.send('global-interrupt');
    }
  });
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.openllmvtuber');

  windowManager = new WindowManager();
  menuManager = new MenuManager((mode) => windowManager.setWindowMode(mode));

  const window = windowManager.createWindow({
    titleBarOverlay: {
      color: '#0f0f0f',
      symbolColor: '#ffffff',
      height: 30,
    },
  });

  menuManager.createTray();

  window.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      window.hide();
    }
    return false;
  });

  setupIPC();
  setupGlobalShortcuts();

  app.on('activate', () => {
    const window = windowManager.getWindow();
    if (window) {
      window.show();
    }
  });

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Allow microphone access
  app.on('web-contents-created', (_, contents) => {
    contents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === 'media') {
        callback(true);
      } else {
        callback(false);
      }
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  menuManager.destroy();
  globalShortcut.unregisterAll();
});
