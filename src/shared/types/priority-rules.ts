/**
 * Priority Rules Type Definitions
 *
 * Types for configuring chat and voice input priority handling.
 */

// ============================================================
// Priority Mode
// ============================================================

/**
 * Priority mode determines how chat and voice inputs are prioritized
 * when they occur simultaneously.
 */
export type PriorityMode = 'chat_first' | 'voice_first' | 'superchat_priority' | 'balanced';

// ============================================================
// Priority Rules Data
// ============================================================

/**
 * Priority rules configuration data structure.
 * Matches the backend PriorityRules.to_dict() output.
 */
export interface PriorityRulesData {
  /** Priority handling mode */
  priority_mode: PriorityMode;
  /** Wait time before processing input (seconds) */
  wait_time: number;
  /** Whether higher priority inputs can interrupt current processing */
  allow_interruption: boolean;
  /** Whether superchats always have highest priority */
  superchat_always_priority: boolean;
  /** Delay for chat messages when voice is active (seconds) */
  voice_active_chat_delay: number;
  /** Delay for voice input when chat is being processed (seconds) */
  chat_active_voice_delay: number;
}

// ============================================================
// Priority Mode Options
// ============================================================

/**
 * Options for the priority mode selector.
 */
export const PRIORITY_MODE_OPTIONS = [
  {
    value: 'balanced' as const,
    label: 'Balanced Mode',
    labelKey: 'settings.priority.modes.balanced',
    description: 'First-come-first-served processing',
    descriptionKey: 'settings.priority.modes.balancedDesc',
  },
  {
    value: 'chat_first' as const,
    label: 'Chat First',
    labelKey: 'settings.priority.modes.chatFirst',
    description: 'Chat messages are processed with priority',
    descriptionKey: 'settings.priority.modes.chatFirstDesc',
  },
  {
    value: 'voice_first' as const,
    label: 'Voice First',
    labelKey: 'settings.priority.modes.voiceFirst',
    description: 'Voice input is processed with priority',
    descriptionKey: 'settings.priority.modes.voiceFirstDesc',
  },
  {
    value: 'superchat_priority' as const,
    label: 'Superchat Priority',
    labelKey: 'settings.priority.modes.superchatPriority',
    description: 'Superchats first, then voice priority',
    descriptionKey: 'settings.priority.modes.superchatPriorityDesc',
  },
] as const;

// ============================================================
// Validation Rules
// ============================================================

/**
 * Validation rules for priority settings fields.
 */
export const PRIORITY_VALIDATION_RULES = {
  wait_time: { min: 0, max: 30, step: 0.5 },
  voice_active_chat_delay: { min: 0, max: 60, step: 0.5 },
  chat_active_voice_delay: { min: 0, max: 60, step: 0.5 },
} as const;

// ============================================================
// Default Values
// ============================================================

/**
 * Default priority rules configuration.
 */
export const DEFAULT_PRIORITY_RULES: PriorityRulesData = {
  priority_mode: 'balanced',
  wait_time: 2.0,
  allow_interruption: false,
  superchat_always_priority: true,
  voice_active_chat_delay: 5.0,
  chat_active_voice_delay: 3.0,
};
