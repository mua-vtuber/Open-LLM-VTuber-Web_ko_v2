import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const setMode = useAppStore((state) => state.setMode);
  const toggleMicrophone = useAppStore((state) => state.toggleMicrophone);
  const openSettings = useAppStore((state) => state.openSettings);
  const closeSettings = useAppStore((state) => state.closeSettings);
  const settingsOpen = useAppStore((state) => state.ui.settingsOpen);

  const shortcuts: ShortcutConfig[] = [
    // 모드 전환
    {
      key: '1',
      ctrl: true,
      action: () => setMode('studio'),
      description: 'Switch to Studio Mode',
    },
    {
      key: '2',
      ctrl: true,
      action: () => setMode('live'),
      description: 'Switch to Live Mode',
    },
    {
      key: '3',
      ctrl: true,
      action: () => setMode('companion'),
      description: 'Switch to Companion Mode',
    },

    // 마이크
    {
      key: 'm',
      ctrl: true,
      action: toggleMicrophone,
      description: 'Toggle Microphone',
    },

    // 설정
    {
      key: ',',
      ctrl: true,
      action: () => {
        if (settingsOpen) {
          closeSettings();
        } else {
          openSettings();
        }
      },
      description: 'Toggle Settings',
    },

    // ESC로 설정 닫기
    {
      key: 'Escape',
      action: () => {
        if (settingsOpen) {
          closeSettings();
        }
      },
      description: 'Close Settings',
    },
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 입력 필드에서는 단축키 무시
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // ESC는 예외적으로 허용
        if (e.key !== 'Escape') {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, settingsOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}
