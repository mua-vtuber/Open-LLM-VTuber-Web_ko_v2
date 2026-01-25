/**
 * Broadcast Feature Types
 */

// ============================================================
// Queue Types
// ============================================================

export interface QueueStatus {
  pending: number;
  processing: number;
  max_size: number;
  total_received: number;
  total_processed: number;
  total_dropped: number;
  running: boolean;
  avg_processing_time: number;
  processing_rate: number;
}

export interface QueueHistoryEntry {
  timestamp: number;
  pending: number;
  processing: number;
  processed: number;
  dropped: number;
}

export interface QueueHistory {
  minutes: number;
  data_points: number;
  history: QueueHistoryEntry[];
}

// ============================================================
// Priority Rules Types
// ============================================================

export type PriorityMode = 'chat_first' | 'voice_first' | 'superchat_priority' | 'balanced';

export interface PriorityRules {
  priority_mode: PriorityMode;
  wait_time: number;
  allow_interruption: boolean;
  superchat_always_priority: boolean;
  voice_active_chat_delay: number;
  chat_active_voice_delay: number;
}

export interface PriorityRulesUpdate {
  priority_mode?: PriorityMode;
  wait_time?: number;
  allow_interruption?: boolean;
  superchat_always_priority?: boolean;
  voice_active_chat_delay?: number;
  chat_active_voice_delay?: number;
}

// ============================================================
// Live Config Types
// ============================================================

export interface YouTubeConfig {
  enabled: boolean;
  api_key: string;
  channel_id: string;
}

export interface ChzzkConfig {
  enabled: boolean;
  channel_id: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  access_token?: string;
  refresh_token?: string;
}

export interface ChatMonitorConfig {
  enabled: boolean;
  youtube: YouTubeConfig;
  chzzk: ChzzkConfig;
  max_retries: number;
  retry_interval: number;
}

export interface LiveConfig {
  chat_monitor: ChatMonitorConfig;
}

export interface LiveConfigUpdate {
  chat_monitor?: Partial<{
    enabled?: boolean;
    youtube?: Partial<YouTubeConfig>;
    chzzk?: Partial<Omit<ChzzkConfig, 'access_token' | 'refresh_token'>>;
    max_retries?: number;
    retry_interval?: number;
  }>;
}

// ============================================================
// Platform Types
// ============================================================

export type PlatformType = 'youtube' | 'chzzk' | 'bilibili' | 'discord';

export interface PlatformStatus {
  id: PlatformType;
  name: string;
  connected: boolean;
  enabled: boolean;
  viewerCount?: number;
  chatCount?: number;
  error?: string;
}

// ============================================================
// Chat Message Types
// ============================================================

export type MessagePriority = 'HIGH' | 'NORMAL' | 'LOW';

export interface ChatMessage {
  id: string;
  platform: PlatformType;
  author: string;
  content: string;
  timestamp: number;
  priority: MessagePriority;
  isSuperchat?: boolean;
  superchatAmount?: number;
  avatarUrl?: string;
  badges?: string[];
}
