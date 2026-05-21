import { create } from 'zustand';

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
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  setSession: (token, user) => set({ token, user, isAuthenticated: true }),
  updateUserBalance: (newBalance) => 
    set((state) => ({
      user: state.user ? { ...state.user, balance: newBalance } : null,
    })),
  logout: () => set({ token: null, user: null, isAuthenticated: false }),
}));
