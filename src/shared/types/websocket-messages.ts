/**
 * WebSocket Message Type Constants
 *
 * Defines message types for real-time WebSocket communication
 * between backend and frontend.
 */

// ============================================================
// Broadcast Message Types
// ============================================================

/**
 * Broadcast message types sent from server to all clients
 */
export const BroadcastMessageType = {
  /** Queue monitoring metrics */
  METRICS: 'broadcast:metrics',
  /** Queue alert notifications */
  QUEUE_ALERT: 'broadcast:queue_alert',
} as const;

/**
 * Type for BroadcastMessageType values
 */
export type BroadcastMessageTypeValue =
  (typeof BroadcastMessageType)[keyof typeof BroadcastMessageType];

// ============================================================
// Request/Response Message Types
// ============================================================

/**
 * Client-to-server message types for priority rules
 */
export const PriorityRulesMessageType = {
  FETCH: 'fetch-priority-rules',
  UPDATE: 'update-priority-rules',
  DATA: 'priority-rules-data',
  UPDATED: 'priority-rules-updated',
  ERROR: 'priority-rules-error',
  UPDATE_ERROR: 'priority-rules-update-error',
} as const;

/**
 * Type for PriorityRulesMessageType values
 */
export type PriorityRulesMessageTypeValue =
  (typeof PriorityRulesMessageType)[keyof typeof PriorityRulesMessageType];
