// store/accountStore.ts
import { create } from 'zustand';
import { Account, CreateAccountPayload } from '../types/account.types';
import * as accountService from '../services/account.service';

interface AccountState {
  accounts: Account[];
  loading: boolean;

  fetchAccounts: () => Promise<void>;
  addAccount: (payload: CreateAccountPayload) => Promise<Account>;
  updateAccount: (id: string, updates: Partial<CreateAccountPayload>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getDefaultAccount: () => Account | undefined;
  getTotalBalance: () => number;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  loading: false,

  fetchAccounts: async () => {
    set({ loading: true });
    try {
      const accounts = await accountService.fetchAccounts();
      set({ accounts, loading: false });
    } catch (error) {
      console.error('fetchAccounts error:', error);
      set({ loading: false });
    }
  },

  addAccount: async (payload) => {
    const account = await accountService.createAccount(payload);
    set((state) => ({ accounts: [account, ...state.accounts] }));
    return account;
  },

  updateAccount: async (id, updates) => {
    const updated = await accountService.updateAccount(id, updates);
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updated } : a)),
    }));
  },

  deleteAccount: async (id) => {
    const prev = get().accounts;
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    }));
    try {
      await accountService.deleteAccount(id);
    } catch (error) {
      set({ accounts: prev });
      throw error;
    }
  },

  getDefaultAccount: () => {
    return get().accounts.find((a) => a.isDefault) || get().accounts[0];
  },

  getTotalBalance: () => {
    return get().accounts.reduce((sum, a) => sum + a.balance, 0);
  },
}));
