// ============================================================
// 앱 모드 타입
// ============================================================

export type AppMode = 'studio' | 'live' | 'companion';

// ============================================================
// 대화 상태 타입
// ============================================================

export type ConversationStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  emotion?: Emotion;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'file';
  url: string;
  name: string;
}

// ============================================================
// 감정 타입
// ============================================================

export type Emotion =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'thinking'
  | 'confused';

// ============================================================
// 말풍선 타입
// ============================================================

export type BubbleType = 'speech' | 'thought' | 'shout' | 'whisper' | 'system';

export interface BubbleConfig {
  type: BubbleType;
  maxWidth: number;
  maxLines: number;
  typingSpeed: number;
  syncWithTTS: boolean;
}

// ============================================================
// 캐릭터 설정 타입
// ============================================================

export interface CharacterConfig {
  modelUrl: string;
  modelName: string;
  scale: number;
  position: { x: number; y: number };
  expressionMapping: Record<Emotion, string>;
}

// ============================================================
// 음성 설정 타입
// ============================================================

export interface VoiceSettings {
  input: {
    enabled: boolean;
    deviceId: string;
    sensitivity: number;
    vadEnabled: boolean;
  };
  output: {
    engine: string;
    voice: string;
    speed: number;
    pitch: number;
    volume: number;
  };
  // Extended settings for UI
  volume: number;
  rate: number;
  pitch: number;
  sttLanguage: string;
  autoListenEnabled: boolean;
  vadSensitivity: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
}

// ============================================================
// 캐릭터 설정 타입 (확장)
// ============================================================

/** 캐릭터 움직임 모드 */
export type MovementMode = 'disabled' | 'free' | 'horizontal' | 'vertical';

/** 캐릭터 이동 상태 (기울기 효과용) */
export interface MovementState {
  /** 이동 방향 (-1 ~ 1) */
  direction: { x: number; y: number };
  /** 현재 이동 중인지 */
  isMoving: boolean;
  /** 이동 강도 (속도에 비례, 0 ~ 1) */
  intensity: number;
  /** CSS transition 시간 (초 단위) */
  transitionDuration: number;
}

export interface CharacterSettings {
  lipSyncEnabled: boolean;
  eyeBlinkEnabled: boolean;
  autoBreathing: boolean;
  idleMotion: boolean;
  // 캐릭터 움직임 설정
  movementMode: MovementMode;
  movementSpeed: number; // 0.1 ~ 2.0
  movementActiveness: number; // 0.1 ~ 1.0 (낮을수록 자주 쉼)
}

// ============================================================
// AI 설정 타입
// ============================================================

// LLM 프로바이더 타입
export type LLMProvider =
  | 'openai'
  | 'claude'
  | 'gemini'
  | 'ollama'
  | 'groq'
  | 'deepseek'
  | 'mistral'
  | 'openai_compatible';

// 각 프로바이더별 설정
export interface LLMProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
}

// 프로바이더별 기본 모델 옵션
export interface LLMProviderInfo {
  id: LLMProvider;
  name: string;
  models: { value: string; label: string }[];
  requiresApiKey: boolean;
  defaultBaseUrl: string;
}

export interface AISettings {
  // 현재 선택된 프로바이더
  currentProvider: LLMProvider;

  // 프로바이더별 설정 (저장되어 전환 시에도 유지)
  providers: Record<LLMProvider, LLMProviderConfig>;

  // 공통 설정
  systemPrompt: string;
  memoryEnabled: boolean;
  memoryLength: number;
  maxTokens: number;
  streamingEnabled: boolean;
}

// ============================================================
// 방송 설정 타입
// ============================================================

export interface BroadcastSettings {
  platforms: string[];
  chatFilter: ChatFilter;
  priorityRules: PriorityRule[];
  chatEnabled: boolean;
  mentionTrigger: string;
  responseDelay: number;
  maxQueueSize: number;
  // Discord 설정
  discordBotToken: string;
  discordGuildId: string;
  discordChannelId: string;
  // YouTube 설정
  youtubeVideoId: string;
  youtubeApiKey: string;
  // Chzzk 설정
  chzzkChannelId: string;
}

export interface PlatformConnection {
  id: string;
  type: 'youtube' | 'chzzk' | 'discord';
  enabled: boolean;
  config: Record<string, unknown>;
  status: 'connected' | 'disconnected' | 'error';
}

export interface ChatFilter {
  enabled: boolean;
  blockedWords: string[];
  minLength: number;
  maxLength: number;
}

export interface PriorityRule {
  id: string;
  name: string;
  condition: PriorityCondition;
  priority: number;
  enabled: boolean;
}

export interface PriorityCondition {
  type: 'keyword' | 'superchat' | 'member' | 'moderator';
  value?: string;
}

// ============================================================
// 시스템 설정 타입
// ============================================================

export interface SystemSettings {
  language: string;
  theme: 'dark' | 'light' | 'system';
  websocketUrl: string;
  apiUrl: string;
  shortcuts: Record<string, string>;
  developerMode: boolean;
  debugMode: boolean;
  autoConnect: boolean;
}

// ============================================================
// 미디어 상태 타입
// ============================================================

export interface MediaState {
  microphone: {
    enabled: boolean;
    volume: number;
    deviceId: string;
  };
  camera: {
    enabled: boolean;
    stream: MediaStream | null;
    deviceId: string;
  };
  screen: {
    enabled: boolean;
    stream: MediaStream | null;
  };
}

// ============================================================
// WebSocket 상태 타입
// ============================================================

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ConnectionState {
  websocket: {
    status: WebSocketStatus;
    url: string;
    reconnectAttempts: number;
  };
  platforms: PlatformConnection[];
}

// ============================================================
// 유틸리티 타입
// ============================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================
// Priority Rules Types
// ============================================================

export type {
  PriorityMode,
  PriorityRulesData,
} from './priority-rules';

export {
  PRIORITY_MODE_OPTIONS,
  PRIORITY_VALIDATION_RULES,
  DEFAULT_PRIORITY_RULES,
} from './priority-rules';

// ============================================================
// WebSocket Message Types
// ============================================================

export {
  BroadcastMessageType,
  PriorityRulesMessageType,
} from './websocket-messages';

export type {
  BroadcastMessageTypeValue,
  PriorityRulesMessageTypeValue,
} from './websocket-messages';
