import type { StateCreator } from 'zustand';
import type {
  CharacterSettings,
  VoiceSettings,
  AISettings,
  BroadcastSettings,
  SystemSettings,
} from '../../types';

// ============================================================
// Settings 슬라이스 타입 정의
// ============================================================

export interface SettingsState {
  settings: {
    character: CharacterSettings;
    voice: VoiceSettings;
    ai: AISettings;
    broadcast: BroadcastSettings;
    system: SystemSettings;
  };
}

export interface SettingsActions {
  updateCharacterSettings: (settings: Partial<CharacterSettings>) => void;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  updateAISettings: (settings: Partial<AISettings>) => void;
  updateBroadcastSettings: (settings: Partial<BroadcastSettings>) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
}

export type SettingsSlice = SettingsState & SettingsActions;

// ============================================================
// 초기 상태
// ============================================================

export const initialSettingsState: SettingsState = {
  settings: {
    character: {
      lipSyncEnabled: true,
      eyeBlinkEnabled: true,
      autoBreathing: true,
      idleMotion: true,
      movementMode: 'disabled',
      movementSpeed: 1.0,
      movementActiveness: 0.5, // 0.1 ~ 1.0 (낮을수록 자주 쉼)
    },
    voice: {
      input: {
        enabled: true,
        deviceId: 'default',
        sensitivity: 0.5,
        vadEnabled: true,
      },
      output: {
        engine: 'edge-tts',
        voice: 'ko-KR-SunHiNeural',
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
      },
      volume: 80,
      rate: 1.0,
      pitch: 1.0,
      sttLanguage: 'ko-KR',
      autoListenEnabled: false,
      vadSensitivity: 'medium',
      echoCancellation: true,
      noiseSuppression: true,
    },
    ai: {
      currentProvider: 'ollama',
      providers: {
        openai: {
          apiKey: '',
          baseUrl: 'https://api.openai.com/v1',
          model: 'gpt-4o',
          temperature: 1.0,
        },
        claude: {
          apiKey: '',
          baseUrl: 'https://api.anthropic.com',
          model: 'claude-3-haiku-20240307',
          temperature: 1.0,
        },
        gemini: {
          apiKey: '',
          baseUrl: '',
          model: 'gemini-2.0-flash-exp',
          temperature: 1.0,
        },
        ollama: {
          apiKey: '',
          baseUrl: 'http://localhost:11434/v1',
          model: 'qwen2.5:latest',
          temperature: 1.0,
        },
        groq: {
          apiKey: '',
          baseUrl: '',
          model: 'llama-3.3-70b-versatile',
          temperature: 1.0,
        },
        deepseek: {
          apiKey: '',
          baseUrl: '',
          model: 'deepseek-chat',
          temperature: 0.7,
        },
        mistral: {
          apiKey: '',
          baseUrl: '',
          model: 'pixtral-large-latest',
          temperature: 1.0,
        },
        openai_compatible: {
          apiKey: '',
          baseUrl: 'http://localhost:11434/v1',
          model: '',
          temperature: 1.0,
        },
      },
      systemPrompt: '',
      memoryEnabled: true,
      memoryLength: 20,
      maxTokens: 2048,
      streamingEnabled: true,
    },
    broadcast: {
      platforms: [],
      chatFilter: {
        enabled: false,
        blockedWords: [],
        minLength: 1,
        maxLength: 500,
      },
      priorityRules: [],
      chatEnabled: false,
      mentionTrigger: '@AI',
      responseDelay: 2,
      maxQueueSize: 20,
      // Discord
      discordBotToken: '',
      discordGuildId: '',
      discordChannelId: '',
      // YouTube
      youtubeVideoId: '',
      youtubeApiKey: '',
      // Chzzk
      chzzkChannelId: '',
    },
    system: {
      language: 'ko',
      theme: 'dark',
      websocketUrl: 'ws://localhost:12393/client-ws',
      apiUrl: 'http://localhost:12393',
      shortcuts: {
        toggleMicrophone: 'Ctrl+M',
        stopResponse: 'Escape',
        sendMessage: 'Ctrl+Enter',
      },
      developerMode: false,
      debugMode: false,
      autoConnect: true,
    },
  },
};

// ============================================================
// 슬라이스 생성자
// ============================================================

export const createSettingsSlice: StateCreator<SettingsSlice, [], [], SettingsSlice> = (
  set
) => ({
  ...initialSettingsState,

  updateCharacterSettings: (settings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        character: { ...state.settings.character, ...settings },
      },
    })),

  updateVoiceSettings: (settings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        voice: { ...state.settings.voice, ...settings },
      },
    })),

  updateAISettings: (settings) =>
    set((state) => ({
      settings: { ...state.settings, ai: { ...state.settings.ai, ...settings } },
    })),

  updateBroadcastSettings: (settings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        broadcast: { ...state.settings.broadcast, ...settings },
      },
    })),

  updateSystemSettings: (settings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        system: { ...state.settings.system, ...settings },
      },
    })),
});
