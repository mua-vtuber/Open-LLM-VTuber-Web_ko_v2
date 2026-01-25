/**
 * useModelList Hook
 * Live2D 모델 목록 관리 및 외부 폴더 등록
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../../../shared/store';

const STORAGE_KEY = 'open-llm-vtuber-external-model-folders';

/** 모델 정보 */
export interface Live2DModel {
  /** 모델 이름 (폴더명) */
  name: string;
  /** 아바타 이미지 URL */
  avatar: string | null;
  /** 모델 파일 경로 (model3.json) */
  model_path: string;
  /** 모델 소스 (internal: 기본, external: 외부 폴더) */
  source: 'internal' | 'external';
  /** 외부 폴더 경로 (source가 external일 때만) */
  folder_path?: string;
}

/** 외부 폴더 정보 */
export interface ExternalFolder {
  /** 폴더 경로 */
  path: string;
  /** 마운트 경로 */
  mount_path: string;
}

interface UseModelListReturn {
  /** 모델 목록 */
  models: Live2DModel[];
  /** 등록된 외부 폴더 목록 */
  externalFolders: ExternalFolder[];
  /** 로딩 중 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 모델 목록 새로고침 */
  refresh: () => Promise<void>;
  /** 외부 폴더 추가 */
  addFolder: (path: string) => Promise<boolean>;
  /** 외부 폴더 제거 */
  removeFolder: (path: string) => Promise<boolean>;
  /** Electron에서 폴더 선택 다이얼로그 열기 */
  selectAndAddFolder: () => Promise<boolean>;
  /** Electron 환경 여부 */
  isElectron: boolean;
}

/**
 * WebSocket URL에서 HTTP base URL 추출
 * ws://localhost:12393/client-ws -> http://localhost:12393
 */
function getHttpBaseUrl(wsUrl: string): string {
  try {
    const url = new URL(wsUrl);
    const protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    return `${protocol}//${url.host}`;
  } catch {
    // 기본값 반환
    return 'http://localhost:12393';
  }
}

/**
 * localStorage에서 저장된 외부 폴더 경로 로드
 */
function loadSavedFolderPaths(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load saved folder paths:', e);
  }
  return [];
}

/**
 * localStorage에 외부 폴더 경로 저장
 */
function saveFolderPaths(paths: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
  } catch (e) {
    console.error('Failed to save folder paths:', e);
  }
}

export function useModelList(): UseModelListReturn {
  const [models, setModels] = useState<Live2DModel[]>([]);
  const [externalFolders, setExternalFolders] = useState<ExternalFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const wsUrl = useAppStore((state) => state.settings.system.websocketUrl);
  const baseUrl = getHttpBaseUrl(wsUrl);

  // Electron 환경 확인
  const isElectron = typeof window !== 'undefined' && !!window.api?.selectFolder;

  /**
   * 모델 목록 가져오기
   */
  const fetchModels = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/live2d-models/info`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.characters || [];
    } catch (err) {
      console.error('Failed to fetch models:', err);
      throw err;
    }
  }, [baseUrl]);

  /**
   * 외부 폴더 목록 가져오기
   */
  const fetchExternalFolders = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/live2d-models/external-folders`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.folders || [];
    } catch (err) {
      console.error('Failed to fetch external folders:', err);
      throw err;
    }
  }, [baseUrl]);

  /**
   * 전체 새로고침
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [modelsData, foldersData] = await Promise.all([
        fetchModels(),
        fetchExternalFolders(),
      ]);

      setModels(modelsData);
      setExternalFolders(foldersData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchModels, fetchExternalFolders]);

  /**
   * 백엔드에 폴더 등록 (내부용, localStorage 저장 안함)
   */
  const registerFolderToBackend = useCallback(
    async (path: string): Promise<boolean> => {
      try {
        const response = await fetch(`${baseUrl}/live2d-models/add-folder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path }),
        });

        const data = await response.json();
        return data.success === true;
      } catch (err) {
        console.error('Failed to register folder to backend:', path, err);
        return false;
      }
    },
    [baseUrl]
  );

  /**
   * 외부 폴더 추가
   */
  const addFolder = useCallback(
    async (path: string): Promise<boolean> => {
      setError(null);

      try {
        const response = await fetch(`${baseUrl}/live2d-models/add-folder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Failed to add folder');
          return false;
        }

        // localStorage에 저장
        const savedPaths = loadSavedFolderPaths();
        if (!savedPaths.includes(path)) {
          saveFolderPaths([...savedPaths, path]);
        }

        // 목록 새로고침
        await refresh();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return false;
      }
    },
    [baseUrl, refresh]
  );

  /**
   * 외부 폴더 제거
   */
  const removeFolder = useCallback(
    async (path: string): Promise<boolean> => {
      setError(null);

      try {
        const response = await fetch(`${baseUrl}/live2d-models/remove-folder`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Failed to remove folder');
          return false;
        }

        // localStorage에서 제거
        const savedPaths = loadSavedFolderPaths();
        saveFolderPaths(savedPaths.filter((p) => p !== path));

        // 목록 새로고침
        await refresh();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return false;
      }
    },
    [baseUrl, refresh]
  );

  /**
   * Electron 폴더 선택 다이얼로그로 폴더 추가
   */
  const selectAndAddFolder = useCallback(async (): Promise<boolean> => {
    if (!isElectron) {
      setError('This feature is only available in the desktop app');
      return false;
    }

    try {
      const selectedPath = await window.api.selectFolder();

      if (!selectedPath) {
        // 사용자가 취소함
        return false;
      }

      return await addFolder(selectedPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    }
  }, [isElectron, addFolder]);

  // 초기화: 저장된 폴더 재등록 및 모델 목록 로드
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      setIsLoading(true);

      // 저장된 외부 폴더 경로를 백엔드에 재등록
      const savedPaths = loadSavedFolderPaths();
      if (savedPaths.length > 0) {
        console.log('[useModelList] Re-registering saved folders:', savedPaths);
        await Promise.all(savedPaths.map((path) => registerFolderToBackend(path)));
      }

      // 모델 목록 로드
      await refresh();
    };

    initialize();
  }, [refresh, registerFolderToBackend]);

  return {
    models,
    externalFolders,
    isLoading,
    error,
    refresh,
    addFolder,
    removeFolder,
    selectAndAddFolder,
    isElectron,
  };
}
