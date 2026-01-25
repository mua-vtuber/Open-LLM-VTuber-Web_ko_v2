import type { StateCreator } from 'zustand';
import type { ConversationStatus, Message, Emotion } from '../../types';

// ============================================================
// Conversation 슬라이스 타입 정의
// ============================================================

export interface ConversationState {
  conversation: {
    status: ConversationStatus;
    messages: Message[];
    currentInput: string;
    currentEmotion: Emotion;
    displayText: string;
    isTyping: boolean;
  };
}

export interface ConversationActions {
  setStatus: (status: ConversationStatus) => void;
  sendMessage: (content: string) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setCurrentInput: (input: string) => void;
  setDisplayText: (text: string) => void;
  setIsTyping: (isTyping: boolean) => void;
  setEmotion: (emotion: Emotion) => void;
}

export type ConversationSlice = ConversationState & ConversationActions;

// ============================================================
// 초기 상태
// ============================================================

export const initialConversationState: ConversationState = {
  conversation: {
    status: 'idle',
    messages: [],
    currentInput: '',
    currentEmotion: 'neutral',
    displayText: '',
    isTyping: false,
  },
};

// ============================================================
// 슬라이스 생성자
// ============================================================

export const createConversationSlice: StateCreator<
  ConversationSlice,
  [],
  [],
  ConversationSlice
> = (set) => ({
  ...initialConversationState,

  setStatus: (status) =>
    set((state) => ({ conversation: { ...state.conversation, status } })),

  sendMessage: (content) => {
    const message: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    set((state) => ({
      conversation: {
        ...state.conversation,
        messages: [...state.conversation.messages, message],
        currentInput: '',
      },
    }));
  },

  addMessage: (message) =>
    set((state) => ({
      conversation: {
        ...state.conversation,
        messages: [...state.conversation.messages, message],
      },
    })),

  clearMessages: () =>
    set((state) => ({ conversation: { ...state.conversation, messages: [] } })),

  setCurrentInput: (input) =>
    set((state) => ({ conversation: { ...state.conversation, currentInput: input } })),

  setDisplayText: (text) =>
    set((state) => ({ conversation: { ...state.conversation, displayText: text } })),

  setIsTyping: (isTyping) =>
    set((state) => ({ conversation: { ...state.conversation, isTyping } })),

  setEmotion: (emotion) =>
    set((state) => ({ conversation: { ...state.conversation, currentEmotion: emotion } })),
});
