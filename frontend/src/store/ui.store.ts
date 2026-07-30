import { create } from 'zustand';

export type NavTab = 'chats' | 'people' | 'groups' | 'calls' | 'saved' | 'settings' | 'notifications';

export type AccentColor = 'violet' | 'cyan' | 'green' | 'rose' | 'pink' | 'amber';

interface ThemeColors {
  name: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryGlow: string;
  gradientFrom: string;
  gradientTo: string;
}

const ACCENT_PALETTE: Record<AccentColor, ThemeColors> = {
  violet: {
    name: 'Electric Violet',
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    primaryLight: '#A78BFA',
    primaryGlow: 'rgba(124, 58, 237, 0.4)',
    gradientFrom: '#7C3AED',
    gradientTo: '#4F46E5',
  },
  cyan: {
    name: 'Radiant Cyan',
    primary: '#06B6D4',
    primaryHover: '#0891B2',
    primaryLight: '#67E8F9',
    primaryGlow: 'rgba(6, 182, 212, 0.4)',
    gradientFrom: '#06B6D4',
    gradientTo: '#2563EB',
  },
  green: {
    name: 'Emerald Mint',
    primary: '#10B981',
    primaryHover: '#059669',
    primaryLight: '#6EE7B7',
    primaryGlow: 'rgba(16, 185, 129, 0.4)',
    gradientFrom: '#10B981',
    gradientTo: '#059669',
  },
  rose: {
    name: 'Sunset Rose',
    primary: '#F43F5E',
    primaryHover: '#E11D48',
    primaryLight: '#FDA4AF',
    primaryGlow: 'rgba(244, 63, 94, 0.4)',
    gradientFrom: '#F43F5E',
    gradientTo: '#E11D48',
  },
  pink: {
    name: 'Neon Pink',
    primary: '#EC4899',
    primaryHover: '#DB2777',
    primaryLight: '#F472B6',
    primaryGlow: 'rgba(236, 72, 153, 0.4)',
    gradientFrom: '#EC4899',
    gradientTo: '#8B5CF6',
  },
  amber: {
    name: 'Warm Amber',
    primary: '#F59E0B',
    primaryHover: '#D97706',
    primaryLight: '#FCD34D',
    primaryGlow: 'rgba(245, 158, 11, 0.4)',
    gradientFrom: '#F59E0B',
    gradientTo: '#EA580C',
  },
};

function applyAccent(color: AccentColor) {
  const theme = ACCENT_PALETTE[color] || ACCENT_PALETTE.violet;
  const root = document.documentElement;
  root.style.setProperty('--accent-primary', theme.primary);
  root.style.setProperty('--accent-hover', theme.primaryHover);
  root.style.setProperty('--accent-light', theme.primaryLight);
  root.style.setProperty('--accent-glow', theme.primaryGlow);
  root.style.setProperty('--accent-gradient-from', theme.gradientFrom);
  root.style.setProperty('--accent-gradient-to', theme.gradientTo);
  root.setAttribute('data-accent', color);
}

interface UIState {
  darkMode: boolean;
  activeTab: NavTab;
  isNewChatOpen: boolean;
  isProfileModalOpen: boolean;
  isMobileDrawerOpen: boolean;
  isNotificationOpen: boolean;
  isUserProfileDrawerOpen: boolean;
  accentColor: AccentColor;
  toggleDarkMode: () => void;
  setActiveTab: (tab: NavTab) => void;
  setNewChatOpen: (open: boolean) => void;
  setProfileModalOpen: (open: boolean) => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setNotificationOpen: (open: boolean) => void;
  setUserProfileDrawerOpen: (open: boolean) => void;
  setAccentColor: (color: AccentColor) => void;
}

const initialDarkMode =
  localStorage.getItem('theme') === 'dark' ||
  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

const savedAccent = (localStorage.getItem('accent') as AccentColor) || 'violet';

if (initialDarkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}
applyAccent(savedAccent);

export const useUIStore = create<UIState>((set) => ({
  darkMode: initialDarkMode,
  activeTab: 'chats',
  isNewChatOpen: false,
  isProfileModalOpen: false,
  isMobileDrawerOpen: false,
  isNotificationOpen: false,
  isUserProfileDrawerOpen: false,
  accentColor: savedAccent,

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

  setAccentColor: (accentColor) => {
    localStorage.setItem('accent', accentColor);
    applyAccent(accentColor);
    set({ accentColor });
  },

  setActiveTab: (activeTab) => set({ activeTab }),
  setNewChatOpen: (isNewChatOpen) => set({ isNewChatOpen }),
  setProfileModalOpen: (isProfileModalOpen) => set({ isProfileModalOpen }),
  setMobileDrawerOpen: (isMobileDrawerOpen) => set({ isMobileDrawerOpen }),
  setNotificationOpen: (isNotificationOpen) => set({ isNotificationOpen }),
  setUserProfileDrawerOpen: (isUserProfileDrawerOpen) => set({ isUserProfileDrawerOpen }),
}));

export { ACCENT_PALETTE };
export type { ThemeColors };
