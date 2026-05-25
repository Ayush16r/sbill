// store/transactionStore.ts
import { create } from 'zustand';
import { Transaction, TransactionFilter, TransactionSummary, TransactionType } from '../types/transaction.types';
import * as txService from '../services/transaction.service';

interface TransactionState {
  transactions: Transaction[];
  summary: TransactionSummary | null;
  selectedMonth: { month: number; year: number };
  loading: boolean;
  filters: TransactionFilter;

  // Actions
  fetchTransactions: (filters?: TransactionFilter) => Promise<void>;
  fetchSummary: (month?: number, year?: number) => Promise<void>;
  addTransaction: (payload: Parameters<typeof txService.createTransaction>[0]) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Parameters<typeof txService.createTransaction>[0]>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setSelectedMonth: (month: number, year: number) => void;
  setFilters: (filters: Partial<TransactionFilter>) => void;
  clearFilters: () => void;
}

const now = new Date();

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  summary: null,
  selectedMonth: { month: now.getMonth() + 1, year: now.getFullYear() },
  loading: false,
  filters: {},

  fetchTransactions: async (filters?: TransactionFilter) => {
    set({ loading: true });
    try {
      const { selectedMonth } = get();
      const mergedFilters: TransactionFilter = {
        month: selectedMonth.month,
        year: selectedMonth.year,
        ...get().filters,
        ...filters,
      };
      const transactions = await txService.fetchTransactions(mergedFilters);
      set({ transactions, loading: false });
    } catch (error) {
      console.error('fetchTransactions error:', error);
      set({ loading: false });
    }
  },

  fetchSummary: async (month?: number, year?: number) => {
    try {
      const { selectedMonth } = get();
      const m = month ?? selectedMonth.month;
      const y = year ?? selectedMonth.year;
      const summary = await txService.fetchTransactionSummary(m, y);
      set({ summary });
    } catch (error) {
      console.error('fetchSummary error:', error);
    }
  },

  addTransaction: async (payload) => {
    const transaction = await txService.createTransaction(payload);
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    }));
    // Refresh summary
    get().fetchSummary();
    return transaction;
  },

  updateTransaction: async (id, updates) => {
    const updated = await txService.updateTransaction(id, updates);
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
    }));
    get().fetchSummary();
  },

  deleteTransaction: async (id) => {
    // Optimistic delete
    const prev = get().transactions;
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    try {
      await txService.deleteTransaction(id);
      get().fetchSummary();
    } catch (error) {
      // Rollback on failure
      set({ transactions: prev });
      throw error;
    }
  },

  setSelectedMonth: (month, year) => {
    set({ selectedMonth: { month, year } });
    get().fetchTransactions();
    get().fetchSummary(month, year);
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },
}));
