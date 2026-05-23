import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  currency: string;
  balance: number;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: UserProfile) => void;
  updateUserBalance: (newBalance: number) => void;
  updateCurrency: (currency: string) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setSession: (token, user) =>
        set({ token, user, isAuthenticated: true }),

      updateUserBalance: (newBalance) =>
        set((state) => ({
          user: state.user ? { ...state.user, balance: newBalance } : null,
        })),

      updateCurrency: (currency) =>
        set((state) => ({
          user: state.user ? { ...state.user, currency } : null,
        })),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'billsplit-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these fields — not derived/transient ones
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
