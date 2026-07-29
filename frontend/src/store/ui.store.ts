import { create } from 'zustand';

export type NavTab = 'chats' | 'people' | 'groups' | 'calls' | 'saved' | 'settings';

interface UIState {
  darkMode: boolean;
  activeTab: NavTab;
  isNewChatOpen: boolean;
  isProfileModalOpen: boolean;
  toggleDarkMode: () => void;
  setActiveTab: (tab: NavTab) => void;
  setNewChatOpen: (open: boolean) => void;
  setProfileModalOpen: (open: boolean) => void;
}

const initialDarkMode =
  localStorage.getItem('theme') === 'dark' ||
  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

if (initialDarkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

export const useUIStore = create<UIState>((set) => ({
  darkMode: initialDarkMode,
  activeTab: 'chats',
  isNewChatOpen: false,
  isProfileModalOpen: false,

  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.darkMode;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return { darkMode: newMode };
    }),

  setActiveTab: (activeTab) => set({ activeTab }),
  setNewChatOpen: (isNewChatOpen) => set({ isNewChatOpen }),
  setProfileModalOpen: (isProfileModalOpen) => set({ isProfileModalOpen }),
}));
