import type { StateCreator } from 'zustand';
import CONFIG from '../../config';
import type { CharacterConfig, MovementState } from '../../types';

// ============================================================
// Character 슬라이스 타입 정의
// ============================================================

export interface CharacterState {
  character: {
    model: CharacterConfig;
    expression: string;
    motion: string;
    isLoading: boolean;
    lipSyncValue: number; // 립싱크 값 (0.0 ~ 1.0)
    movement: MovementState; // 이동 상태 (기울기 효과용)
  };
}

export interface CharacterActions {
  setExpression: (expression: string) => void;
  triggerMotion: (motion: string) => void;
  updateCharacterPosition: (x: number, y: number) => void;
  setModelUrl: (url: string) => void;
  setModelScale: (scale: number) => void;
  setModelPosition: (x: number, y: number) => void;
  setLipSyncValue: (value: number) => void;
  updateMovementState: (state: Partial<MovementState>) => void;
}

export type CharacterSlice = CharacterState & CharacterActions;

// ============================================================
// 초기 상태
// ============================================================

export const initialCharacterState: CharacterState = {
  character: {
    model: {
      // 기본 모델 (백엔드 서버에서 제공)
      modelUrl: `${CONFIG.apiUrl}/live2d-models/shizuku/runtime/shizuku.model3.json`,
      modelName: 'shizuku',
      scale: 0.3,
      position: { x: 0, y: 0 },
      expressionMapping: {
        neutral: 'normal',
        happy: 'smile',
        sad: 'sad',
        angry: 'angry',
        surprised: 'surprise',
        thinking: 'think',
        confused: 'confused',
      },
    },
    expression: 'neutral',
    motion: 'idle',
    isLoading: false,
    lipSyncValue: 0,
    movement: {
      direction: { x: 0, y: 0 },
      isMoving: false,
      intensity: 0,
      transitionDuration: 0,
    },
  },
};

// ============================================================
// 슬라이스 생성자
// ============================================================

export const createCharacterSlice: StateCreator<CharacterSlice, [], [], CharacterSlice> = (
  set
) => ({
  ...initialCharacterState,

  setExpression: (expression) =>
    set((state) => ({ character: { ...state.character, expression } })),

  triggerMotion: (motion) =>
    set((state) => ({ character: { ...state.character, motion } })),

  updateCharacterPosition: (x, y) =>
    set((state) => ({
      character: {
        ...state.character,
        model: { ...state.character.model, position: { x, y } },
      },
    })),

  setModelUrl: (url) =>
    set((state) => ({
      character: {
        ...state.character,
        model: { ...state.character.model, modelUrl: url },
      },
    })),

  setModelScale: (scale) =>
    set((state) => ({
      character: {
        ...state.character,
        model: { ...state.character.model, scale },
      },
    })),

  setModelPosition: (x, y) =>
    set((state) => ({
      character: {
        ...state.character,
        model: { ...state.character.model, position: { x, y } },
      },
    })),

  setLipSyncValue: (value) =>
    set((state) => ({ character: { ...state.character, lipSyncValue: value } })),

  updateMovementState: (movementState) =>
    set((state) => ({
      character: {
        ...state.character,
        movement: { ...state.character.movement, ...movementState },
      },
    })),
});