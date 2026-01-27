import { create, type StateCreator } from 'zustand';
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware';
import CONFIG from '../config';
import type { CharacterSettings, VoiceSettings, AISettings, BroadcastSettings, SystemSettings, MovementState, Message, Emotion, ConversationStatus, WebSocketStatus } from '../types';
import { isElectron, electronAPI } from '../utils/electron';
import {
  createUISlice,
  createConnectionSlice,
  createCharacterSlice,
  createConversationSlice,
  createMediaSlice,
  createSettingsSlice,
  initialUIState,
  initialConnectionState,
  initialCharacterState,
  initialConversationState,
  initialMediaState,
  initialSettingsState,
  type UISlice,
  type ConnectionSlice,
  type CharacterSlice,
  type ConversationSlice,
  type MediaSlice,
  type SettingsSlice,
} from './slices';

// ============================================================
// 전체 Store 타입
// ============================================================

type AppStore = UISlice &
  CharacterSlice &
  ConversationSlice &
  MediaSlice &
  SettingsSlice &
  ConnectionSlice & {
    reset: () => void;
  };

// ============================================================
// 초기 상태 결합
// ============================================================

const initialState = {
  ...initialUIState,
  ...initialCharacterState,
  ...initialConversationState,
  ...initialMediaState,
  ...initialSettingsState,
  ...initialConnectionState,
};

// ============================================================
// Store 생성
// ============================================================

export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        (...a) => {
          const [set] = a;

          // 각 슬라이스 생성 (타입 캐스팅 필요)
          const uiSlice = (createUISlice as StateCreator<AppStore, [], [], UISlice>)(...a);
          const connectionSlice = (createConnectionSlice as StateCreator<AppStore, [], [], ConnectionSlice>)(...a);
          const characterSlice = (createCharacterSlice as StateCreator<AppStore, [], [], CharacterSlice>)(...a);
          const conversationSlice = (createConversationSlice as StateCreator<AppStore, [], [], ConversationSlice>)(...a);
          const mediaSlice = (createMediaSlice as StateCreator<AppStore, [], [], MediaSlice>)(...a);
          const settingsSlice = (createSettingsSlice as StateCreator<AppStore, [], [], SettingsSlice>)(...a);

          return {
            // 슬라이스 결합
            ...uiSlice,
            ...connectionSlice,
            ...characterSlice,
            ...conversationSlice,
            ...mediaSlice,
            ...settingsSlice,

            // UI 슬라이스의 setMode를 Electron 지원 버전으로 오버라이드
            setMode: (mode) => {
              console.log('[Store] setMode:', mode, 'isElectron:', isElectron);
              if (isElectron) {
                console.log('[Store] Calling electronAPI.setMode');
                electronAPI.setMode?.(mode);
              }
              set((state) => ({ ui: { ...state.ui, mode } }));
            },

            // 초기화 액션
            reset: () => set(initialState),
          };
        },
        {
          name: 'open-llm-vtuber-storage',
          version: 4, // v4: 캐릭터 활동성 설정 추가
          partialize: (state) => ({
            settings: state.settings,
            character: {
              model: state.character.model,
            },
          }),
          // Deep merge to preserve non-persisted state like movement
          merge: (persistedState, currentState) => {
            const persisted = persistedState as Partial<AppStore>;
            return {
              ...currentState,
              ...persisted,
              // character는 deep merge (movement 등 비저장 상태 보존)
              character: {
                ...currentState.character,
                ...(persisted.character || {}),
              },
              // settings도 deep merge
              settings: {
                ...currentState.settings,
                ...(persisted.settings || {}),
                character: {
                  ...currentState.settings.character,
                  ...(persisted.settings?.character || {}),
                },
                voice: {
                  ...currentState.settings.voice,
                  ...(persisted.settings?.voice || {}),
                },
                ai: {
                  ...currentState.settings.ai,
                  ...(persisted.settings?.ai || {}),
                },
                broadcast: {
                  ...currentState.settings.broadcast,
                  ...(persisted.settings?.broadcast || {}),
                },
                system: {
                  ...currentState.settings.system,
                  ...(persisted.settings?.system || {}),
                },
              },
            };
          },
          migrate: (persistedState: unknown, version: number) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const state = persistedState as any;

            if (version === 0) {
              // v0 -> v1: AI 설정 구조 변경 (provider 기반으로)
              if (state?.settings?.ai && !state.settings.ai.providers) {
                state.settings.ai = initialSettingsState.settings.ai;
              }
            }

            if (version <= 1) {
              // v1 -> v2: WebSocket URL 수정 (/ws -> /client-ws)
              if (state?.settings?.system?.websocketUrl === 'ws://localhost:12393/ws') {
                state.settings.system.websocketUrl = CONFIG.wsUrl;
              }
            }

            if (version <= 2) {
              // v2 -> v3: 캐릭터 움직임 설정 추가
              if (state?.settings?.character) {
                state.settings.character.movementMode ??= 'disabled';
                state.settings.character.movementSpeed ??= 1.0;
              }
            }

            if (version <= 3) {
              // v3 -> v4: 캐릭터 활동성 설정 추가
              if (state?.settings?.character) {
                state.settings.character.movementActiveness ??= 0.5;
              }
            }

            return state;
          },
        }
      ),
      { name: 'OpenLLMVTuber' }
    )
  )
);

// ============================================================
// 타입 내보내기 (하위 호환성)
// ============================================================

export type {
  CharacterSettings,
  VoiceSettings,
  AISettings,
  BroadcastSettings,
  SystemSettings,
  MovementState,
  Message,
  Emotion,
  ConversationStatus,
  WebSocketStatus,
};

// ============================================================
// 선택자 (Selectors)
// ============================================================

export const selectUI = (state: AppStore) => state.ui;
export const selectCharacter = (state: AppStore) => state.character;
export const selectConversation = (state: AppStore) => state.conversation;
export const selectMedia = (state: AppStore) => state.media;
export const selectSettings = (state: AppStore) => state.settings;
export const selectConnection = (state: AppStore) => state.connection;

export const selectMode = (state: AppStore) => state.ui.mode;
export const selectStatus = (state: AppStore) => state.conversation.status;
export const selectMessages = (state: AppStore) => state.conversation.messages;
export const selectMicrophoneEnabled = (state: AppStore) => state.media.microphone.enabled;
