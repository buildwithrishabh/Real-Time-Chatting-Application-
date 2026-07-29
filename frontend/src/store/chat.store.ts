import { create } from 'zustand';

interface ChatState {
  activeConversationId: string | null;
  unreadCounts: Record<string, number>;
  setActiveConversation: (id: string | null) => void;
  incrementUnread: (convId: string) => void;
  resetUnread: (convId: string) => void;
  setUnreadCounts: (counts: Record<string, number>) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  unreadCounts: {},

  setActiveConversation: (activeConversationId) => set({ activeConversationId }),

  incrementUnread: (convId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [convId]: (state.unreadCounts[convId] || 0) + 1,
      },
    })),

  resetUnread: (convId) =>
    set((state) => {
      const updated = { ...state.unreadCounts };
      delete updated[convId];
      return { unreadCounts: updated };
    }),

  setUnreadCounts: (unreadCounts) => set({ unreadCounts }),
}));
