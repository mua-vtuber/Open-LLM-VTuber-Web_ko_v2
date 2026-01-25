import { Menu, Tray, nativeImage, app } from 'electron';
import { join } from 'path';

type AppMode = 'studio' | 'live' | 'companion';

export class MenuManager {
  private tray: Tray | null = null;
  private currentMode: AppMode = 'studio';
  private onModeChange: (mode: AppMode) => void;

  constructor(onModeChange: (mode: AppMode) => void) {
    this.onModeChange = onModeChange;
  }

  createTray(): void {
    const iconPath = process.platform === 'win32'
      ? join(__dirname, '../../resources/icon.ico')
      : join(__dirname, '../../resources/icon.png');

    let icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      // Create a simple colored icon if no icon file exists
      icon = nativeImage.createEmpty();
    }

    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));
    this.tray.setToolTip('Open-LLM-VTuber');
    this.updateTrayMenu();

    this.tray.on('click', () => {
      this.updateTrayMenu();
    });
  }

  setMode(mode: AppMode): void {
    this.currentMode = mode;
    this.updateTrayMenu();
  }

  private updateTrayMenu(): void {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open-LLM-VTuber',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Studio Mode',
        type: 'radio',
        checked: this.currentMode === 'studio',
        click: () => {
          this.currentMode = 'studio';
          this.onModeChange('studio');
          this.updateTrayMenu();
        },
      },
      {
        label: 'Live Mode',
        type: 'radio',
        checked: this.currentMode === 'live',
        click: () => {
          this.currentMode = 'live';
          this.onModeChange('live');
          this.updateTrayMenu();
        },
      },
      {
        label: 'Companion Mode',
        type: 'radio',
        checked: this.currentMode === 'companion',
        click: () => {
          this.currentMode = 'companion';
          this.onModeChange('companion');
          this.updateTrayMenu();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
