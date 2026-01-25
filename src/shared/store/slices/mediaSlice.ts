import type { StateCreator } from 'zustand';
import type { MediaState } from '../../types';

// ============================================================
// Media 슬라이스 타입 정의
// ============================================================

export interface MediaSliceState {
  media: MediaState;
}

export interface MediaActions {
  toggleMicrophone: () => void;
  setMicrophoneVolume: (volume: number) => void;
  toggleCamera: () => void;
  setCameraStream: (stream: MediaStream | null) => void;
  toggleScreenShare: () => void;
  setScreenStream: (stream: MediaStream | null) => void;
}

export type MediaSlice = MediaSliceState & MediaActions;

// ============================================================
// 초기 상태
// ============================================================

export const initialMediaState: MediaSliceState = {
  media: {
    microphone: {
      enabled: false,
      volume: 1,
      deviceId: 'default',
    },
    camera: {
      enabled: false,
      stream: null,
      deviceId: 'default',
    },
    screen: {
      enabled: false,
      stream: null,
    },
  },
};

// ============================================================
// 슬라이스 생성자
// ============================================================

export const createMediaSlice: StateCreator<MediaSlice, [], [], MediaSlice> = (set) => ({
  ...initialMediaState,

  toggleMicrophone: () =>
    set((state) => ({
      media: {
        ...state.media,
        microphone: {
          ...state.media.microphone,
          enabled: !state.media.microphone.enabled,
        },
      },
    })),

  setMicrophoneVolume: (volume) =>
    set((state) => ({
      media: {
        ...state.media,
        microphone: { ...state.media.microphone, volume },
      },
    })),

  toggleCamera: () =>
    set((state) => ({
      media: {
        ...state.media,
        camera: { ...state.media.camera, enabled: !state.media.camera.enabled },
      },
    })),

  setCameraStream: (stream) =>
    set((state) => ({
      media: { ...state.media, camera: { ...state.media.camera, stream } },
    })),

  toggleScreenShare: () =>
    set((state) => ({
      media: {
        ...state.media,
        screen: { ...state.media.screen, enabled: !state.media.screen.enabled },
      },
    })),

  setScreenStream: (stream) =>
    set((state) => ({
      media: { ...state.media, screen: { ...state.media.screen, stream } },
    })),
});
