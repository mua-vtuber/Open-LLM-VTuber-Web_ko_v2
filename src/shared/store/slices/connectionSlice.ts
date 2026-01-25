import type { StateCreator } from 'zustand';
import type { WebSocketStatus, PlatformConnection } from '../../types';

// ============================================================
// Connection 슬라이스 타입 정의
// ============================================================

export interface ConnectionState {
  connection: {
    websocket: {
      status: WebSocketStatus;
      url: string;
      reconnectAttempts: number;
    };
    platforms: PlatformConnection[];
  };
}

export interface ConnectionActions {
  setWebSocketStatus: (status: WebSocketStatus) => void;
  updatePlatformConnection: (id: string, status: string) => void;
}

export type ConnectionSlice = ConnectionState & ConnectionActions;

// ============================================================
// 초기 상태
// ============================================================

export const initialConnectionState: ConnectionState = {
  connection: {
    websocket: {
      status: 'disconnected',
      url: 'ws://localhost:12393/client-ws',
      reconnectAttempts: 0,
    },
    platforms: [],
  },
};

// ============================================================
// 슬라이스 생성자
// ============================================================

export const createConnectionSlice: StateCreator<ConnectionSlice, [], [], ConnectionSlice> = (
  set
) => ({
  ...initialConnectionState,

  setWebSocketStatus: (status) =>
    set((state) => ({
      connection: {
        ...state.connection,
        websocket: { ...state.connection.websocket, status },
      },
    })),

  updatePlatformConnection: (id, status) =>
    set((state) => ({
      connection: {
        ...state.connection,
        platforms: state.connection.platforms.map((p) =>
          p.id === id ? { ...p, status: status as PlatformConnection['status'] } : p
        ),
      },
    })),
});
