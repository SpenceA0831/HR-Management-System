import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AppModule, ThemeMode } from '../types';

interface AppState {
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (authenticated: boolean) => void;

  // Module state
  activeModule: AppModule | null;
  setActiveModule: (module: AppModule | null) => void;

  // Theme state
  mode: ThemeMode;
  toggleMode: () => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Clear all state (sign out)
  clearState: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // User state
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      isAuthenticated: false,
      setIsAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),

      // Module state
      activeModule: null,
      setActiveModule: (module) => set({ activeModule: module }),

      // Theme state
      mode: 'light',
      toggleMode: () =>
        set((state) => ({
          mode: state.mode === 'light' ? 'dark' : 'light',
        })),

      // Loading state
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Clear all state
      clearState: () =>
        set({
          currentUser: null,
          isAuthenticated: false,
          activeModule: null,
          isLoading: false,
        }),
    }),
    {
      name: 'hr-management-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        mode: state.mode,
      }),
    }
  )
);
