/**
 * usePriorityRules Hook
 *
 * Manages priority rules configuration with WebSocket synchronization.
 * Handles fetching, updating, and real-time sync of priority rules.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { PriorityRulesData, PriorityMode } from '../../../shared/types';
import { DEFAULT_PRIORITY_RULES } from '../../../shared/types';

interface UsePriorityRulesReturn {
  /** Current priority rules data */
  rules: PriorityRulesData;
  /** Whether rules are being loaded */
  isLoading: boolean;
  /** Whether rules are being saved */
  isSaving: boolean;
  /** Error message if any */
  error: string | null;
  /** Success message if any */
  success: string | null;
  /** Update a single field */
  updateField: <K extends keyof PriorityRulesData>(
    field: K,
    value: PriorityRulesData[K]
  ) => void;
  /** Save all changes to backend */
  saveRules: () => Promise<boolean>;
  /** Reset to default values */
  resetToDefaults: () => void;
  /** Refresh rules from backend */
  refreshRules: () => Promise<void>;
  /** Clear error message */
  clearError: () => void;
  /** Clear success message */
  clearSuccess: () => void;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
}

/**
 * Send priority rules update via WebSocket
 */
function sendPriorityRulesUpdate(
  rules: PriorityRulesData
): Promise<{ success: boolean; message?: string }> {
  return new Promise((resolve, reject) => {
    const ws = (window as unknown as { __vtuberWebSocket?: WebSocket }).__vtuberWebSocket;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket not connected'));
      return;
    }

    // Set up response handler
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'priority-rules-updated') {
          ws.removeEventListener('message', handleMessage);
          clearTimeout(timeout);
          resolve({ success: true, message: 'Priority rules saved successfully' });
        } else if (data.type === 'priority-rules-update-error') {
          ws.removeEventListener('message', handleMessage);
          clearTimeout(timeout);
          resolve({ success: false, message: data.error });
        }
      } catch {
        // Ignore other messages
      }
    };

    ws.addEventListener('message', handleMessage);

    // Set timeout (10 seconds)
    const timeout = setTimeout(() => {
      ws.removeEventListener('message', handleMessage);
      reject(new Error('Request timeout'));
    }, 10000);

    // Send message
    ws.send(
      JSON.stringify({
        type: 'update-priority-rules',
        priority_rules: rules,
      })
    );
  });
}

/**
 * Fetch current priority rules from backend
 */
function fetchPriorityRules(): Promise<PriorityRulesData> {
  return new Promise((resolve, reject) => {
    const ws = (window as unknown as { __vtuberWebSocket?: WebSocket }).__vtuberWebSocket;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket not connected'));
      return;
    }

    // Set up response handler
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'priority-rules-data') {
          ws.removeEventListener('message', handleMessage);
          clearTimeout(timeout);
          resolve(data.priority_rules);
        } else if (data.type === 'priority-rules-error') {
          ws.removeEventListener('message', handleMessage);
          clearTimeout(timeout);
          reject(new Error(data.error));
        }
      } catch {
        // Ignore other messages
      }
    };

    ws.addEventListener('message', handleMessage);

    // Set timeout (5 seconds)
    const timeout = setTimeout(() => {
      ws.removeEventListener('message', handleMessage);
      // Return defaults on timeout
      resolve(DEFAULT_PRIORITY_RULES);
    }, 5000);

    // Send request
    ws.send(JSON.stringify({ type: 'fetch-priority-rules' }));
  });
}

export function usePriorityRules(): UsePriorityRulesReturn {
  const [rules, setRules] = useState<PriorityRulesData>(DEFAULT_PRIORITY_RULES);
  const [savedRules, setSavedRules] = useState<PriorityRulesData>(DEFAULT_PRIORITY_RULES);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Timeout refs for auto-clearing messages
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  // Listen for real-time updates from other clients
  useEffect(() => {
    const ws = (window as unknown as { __vtuberWebSocket?: WebSocket }).__vtuberWebSocket;

    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'priority-rules-updated' && data.priority_rules) {
          // Update local state with server values
          setRules(data.priority_rules);
          setSavedRules(data.priority_rules);
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccess(null);
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, []);

  /**
   * Refresh rules from backend
   */
  const refreshRules = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedRules = await fetchPriorityRules();
      setRules(fetchedRules);
      setSavedRules(fetchedRules);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch priority rules';
      setError(message);
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update a single field
   */
  const updateField = useCallback(<K extends keyof PriorityRulesData>(
    field: K,
    value: PriorityRulesData[K]
  ): void => {
    setRules((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Save all changes to backend
   */
  const saveRules = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await sendPriorityRulesUpdate(rules);

      if (result.success) {
        setSavedRules(rules);
        setSuccess(result.message || 'Priority rules saved successfully');
        // Auto-clear success message after 3 seconds
        successTimeoutRef.current = setTimeout(() => {
          setSuccess(null);
        }, 3000);
        return true;
      } else {
        setError(result.message || 'Failed to save priority rules');
        // Auto-clear error after 5 seconds
        errorTimeoutRef.current = setTimeout(() => {
          setError(null);
        }, 5000);
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      // Auto-clear error after 5 seconds
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [rules]);

  /**
   * Reset to default values
   */
  const resetToDefaults = useCallback((): void => {
    setRules(DEFAULT_PRIORITY_RULES);
  }, []);

  // Check if there are unsaved changes
  const hasChanges = JSON.stringify(rules) !== JSON.stringify(savedRules);

  return {
    rules,
    isLoading,
    isSaving,
    error,
    success,
    updateField,
    saveRules,
    resetToDefaults,
    refreshRules,
    clearError,
    clearSuccess,
    hasChanges,
  };
}
