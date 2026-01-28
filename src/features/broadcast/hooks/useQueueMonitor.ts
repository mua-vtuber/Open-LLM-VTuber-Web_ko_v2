/**
 * Queue Monitor Hook
 * Real-time queue metrics monitoring via WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  MetricSnapshot,
  QueueAlert,
  QueueConnectionStatus,
} from '../types';
import { BroadcastMessageType } from '../../../shared/types';

/** Maximum number of metric history entries to keep */
const MAX_HISTORY_LENGTH = 60;

interface UseQueueMonitorReturn {
  /** Current metric snapshot */
  currentMetric: MetricSnapshot | null;
  /** History of metric snapshots (up to 60 entries) */
  history: MetricSnapshot[];
  /** List of alerts */
  alerts: QueueAlert[];
  /** Count of unacknowledged alerts */
  unacknowledgedCount: number;
  /** WebSocket connection status */
  connectionStatus: QueueConnectionStatus;
  /** Last update timestamp */
  lastUpdated: number | null;
  /** Acknowledge a specific alert */
  acknowledgeAlert: (alertId: string) => void;
  /** Acknowledge all alerts */
  acknowledgeAllAlerts: () => void;
  /** Clear all alerts */
  clearAlerts: () => void;
  /** Error message */
  error: string | null;
}

/**
 * Hook for real-time queue monitoring via WebSocket
 *
 * Listens for broadcast:metrics and broadcast:queue_alert messages
 * from the WebSocket connection and manages the monitoring state.
 */
export function useQueueMonitor(): UseQueueMonitorReturn {
  // State
  const [currentMetric, setCurrentMetric] = useState<MetricSnapshot | null>(null);
  const [history, setHistory] = useState<MetricSnapshot[]>([]);
  const [alerts, setAlerts] = useState<QueueAlert[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<QueueConnectionStatus>('disconnected');
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for WebSocket listener management
  const listenerRegisteredRef = useRef(false);

  // Calculate unacknowledged count
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  // Handle incoming metrics message
  const handleMetricsMessage = useCallback((data: Record<string, unknown>) => {
    const metric: MetricSnapshot = {
      timestamp: (data.timestamp as number) || Date.now(),
      queue_size: (data.queue_size as number) || 0,
      queue_max: (data.queue_max as number) || 100,
      processing_rate: (data.processing_rate as number) || 0,
      avg_wait_time: (data.avg_wait_time as number) || 0,
      priority_distribution: (data.priority_distribution as MetricSnapshot['priority_distribution']) || {
        high: 0,
        normal: 0,
        low: 0,
      },
    };

    setCurrentMetric(metric);
    setLastUpdated(Date.now());
    setError(null);

    // Add to history, keeping only the last MAX_HISTORY_LENGTH entries
    setHistory((prev) => {
      const updated = [...prev, metric];
      if (updated.length > MAX_HISTORY_LENGTH) {
        return updated.slice(-MAX_HISTORY_LENGTH);
      }
      return updated;
    });
  }, []);

  // Handle incoming alert message
  const handleAlertMessage = useCallback((data: Record<string, unknown>) => {
    const alert: QueueAlert = {
      id: (data.id as string) || `alert_${Date.now()}`,
      timestamp: (data.timestamp as number) || Date.now(),
      type: (data.alert_type as QueueAlert['type']) || 'overflow',
      message: (data.message as string) || 'Unknown alert',
      severity: (data.severity as QueueAlert['severity']) || 'warning',
      acknowledged: false,
    };

    setAlerts((prev) => [alert, ...prev]);
  }, []);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>;
        const messageType = data.type as string;

        if (messageType === BroadcastMessageType.METRICS) {
          handleMetricsMessage(data);
        } else if (messageType === BroadcastMessageType.QUEUE_ALERT) {
          handleAlertMessage(data);
        }
      } catch {
        // Ignore parse errors for non-JSON messages
      }
    },
    [handleMetricsMessage, handleAlertMessage]
  );

  // Set up WebSocket listeners
  useEffect(() => {
    // Access the global WebSocket reference
    const getWebSocket = (): WebSocket | null => {
      return (window as unknown as { __vtuberWebSocket?: WebSocket }).__vtuberWebSocket || null;
    };

    const setupListener = () => {
      const ws = getWebSocket();

      if (ws && ws.readyState === WebSocket.OPEN) {
        if (!listenerRegisteredRef.current) {
          ws.addEventListener('message', handleWebSocketMessage);
          listenerRegisteredRef.current = true;
          setConnectionStatus('connected');
          setError(null);
        }
      } else {
        setConnectionStatus('disconnected');
        listenerRegisteredRef.current = false;
      }
    };

    // Initial setup
    setupListener();

    // Check periodically for WebSocket availability
    const intervalId = setInterval(setupListener, 1000);

    return () => {
      clearInterval(intervalId);

      const ws = getWebSocket();
      if (ws && listenerRegisteredRef.current) {
        ws.removeEventListener('message', handleWebSocketMessage);
        listenerRegisteredRef.current = false;
      }
    };
  }, [handleWebSocketMessage]);

  // Acknowledge a specific alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  }, []);

  // Acknowledge all alerts
  const acknowledgeAllAlerts = useCallback(() => {
    setAlerts((prev) =>
      prev.map((alert) => ({ ...alert, acknowledged: true }))
    );
  }, []);

  // Clear all alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    currentMetric,
    history,
    alerts,
    unacknowledgedCount,
    connectionStatus,
    lastUpdated,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    clearAlerts,
    error,
  };
}
