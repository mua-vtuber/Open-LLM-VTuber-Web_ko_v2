import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store';
import type { Message } from '../types';
import { generateId } from '../utils';

interface WebSocketMessage {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/** 오디오 메시지 데이터 */
export interface AudioMessageData {
  audioBase64: string;
  volumes: number[];
  sliceLength?: number;
  expressions?: string[] | number[];
}

interface UseWebSocketOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  /** 오디오 메시지 수신 콜백 */
  onAudio?: (data: AudioMessageData) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    onOpen,
    onClose,
    onError,
    onAudio,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wsUrl = useAppStore((state) => state.settings.system.websocketUrl);
  const setWebSocketStatus = useAppStore((state) => state.setWebSocketStatus);
  const setStatus = useAppStore((state) => state.setStatus);
  const addMessage = useAppStore((state) => state.addMessage);
  const setDisplayText = useAppStore((state) => state.setDisplayText);
  const setIsTyping = useAppStore((state) => state.setIsTyping);
  const setEmotion = useAppStore((state) => state.setEmotion);
  const setExpression = useAppStore((state) => state.setExpression);

  // 메시지 핸들러
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'full-text':
            // AI 응답 텍스트
            setDisplayText(data.text || '');
            setIsTyping(true);
            break;

          case 'control':
            // 상태 제어 메시지
            if (data.text === 'conversation-chain-start') {
              setStatus('thinking');
            } else if (data.text === 'conversation-chain-end') {
              setStatus('idle');
              setIsTyping(false);
              // 기본 표정으로 복원
              setExpression('neutral');
            }
            break;

          case 'audio':
            // 오디오 재생 시작
            setStatus('speaking');
            // 표정 처리 - 백엔드에서 actions.expressions으로 전송
            if (data.actions?.expressions?.length > 0) {
              const expression = data.actions.expressions[0];
              setExpression(String(expression));
            }
            // 오디오 콜백 호출
            if (onAudio && data.audio) {
              onAudio({
                audioBase64: data.audio,
                volumes: data.volumes || [],
                sliceLength: data.slice_length,
                expressions: data.actions?.expressions,
              });
            }
            break;

          case 'audio-end':
            // 오디오 재생 종료
            // full-text가 완료된 후 표시 유지
            break;

          case 'emotion':
            // 감정 변화
            if (data.emotion) {
              setEmotion(data.emotion);
              setExpression(data.emotion);
            }
            break;

          case 'set-expression':
            // 표정 변경
            if (data.expression) {
              setExpression(data.expression);
            }
            break;

          case 'backend-synced':
            // 백엔드 동기화 완료
            console.log('Backend synced');
            break;

          case 'error':
            console.error('WebSocket error from server:', data.message);
            break;

          default:
            console.log('Unknown message type:', data.type, data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    },
    [setDisplayText, setIsTyping, setStatus, setEmotion, setExpression, onAudio]
  );

  // 연결
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setWebSocketStatus('connecting');

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWebSocketStatus('connected');
        reconnectAttemptsRef.current = 0;
        // Global reference for components that need direct WebSocket access
        (window as unknown as { __vtuberWebSocket?: WebSocket }).__vtuberWebSocket = ws;
        onOpen?.();
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setWebSocketStatus('disconnected');
        wsRef.current = null;
        // Clear global reference
        (window as unknown as { __vtuberWebSocket?: WebSocket }).__vtuberWebSocket = undefined;
        onClose?.();

        // 재연결 시도
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWebSocketStatus('error');
        onError?.(error);
      };

      ws.onmessage = handleMessage;

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setWebSocketStatus('error');
    }
  }, [
    wsUrl,
    setWebSocketStatus,
    handleMessage,
    onOpen,
    onClose,
    onError,
    maxReconnectAttempts,
    reconnectInterval,
  ]);

  // 연결 해제
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWebSocketStatus('disconnected');
  }, [setWebSocketStatus]);

  // 메시지 전송
  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected');
      return false;
    }

    const message: WebSocketMessage = {
      type: 'text-input',
      text: content,
    };

    wsRef.current.send(JSON.stringify(message));

    // 로컬 메시지 기록에 추가
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(userMessage);
    setStatus('thinking');

    return true;
  }, [addMessage, setStatus]);

  // 대화 중단
  const interruptConversation = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;

    const message: WebSocketMessage = {
      type: 'interrupt-signal',
    };

    wsRef.current.send(JSON.stringify(message));
    setStatus('idle');
    setIsTyping(false);
  }, [setStatus, setIsTyping]);

  // 마이크 오디오 전송
  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return false;

    wsRef.current.send(audioData);
    return true;
  }, []);

  // 자동 연결
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    connect,
    disconnect,
    sendMessage,
    sendAudio,
    interruptConversation,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}
