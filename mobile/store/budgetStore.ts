// store/budgetStore.ts
import { create } from 'zustand';
import { Budget, CreateBudgetPayload } from '../types/budget.types';
import * as budgetService from '../services/budget.service';

interface BudgetState {
  budgets: Budget[];
  loading: boolean;

  fetchBudgets: () => Promise<void>;
  addBudget: (payload: CreateBudgetPayload) => Promise<Budget>;
  updateBudget: (id: string, updates: Partial<CreateBudgetPayload> & { isActive?: boolean }) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  loading: false,

  fetchBudgets: async () => {
    set({ loading: true });
    try {
      const budgets = await budgetService.fetchBudgets();
      set({ budgets, loading: false });
    } catch (error) {
      console.error('fetchBudgets error:', error);
      set({ loading: false });
    }
  },

  addBudget: async (payload) => {
    const budget = await budgetService.createBudget(payload);
    set((state) => ({ budgets: [budget, ...state.budgets] }));
    return budget;
  },

  updateBudget: async (id, updates) => {
    const updated = await budgetService.updateBudget(id, updates);
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...updated } : b)),
    }));
  },

  deleteBudget: async (id) => {
    const prev = get().budgets;
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
    try {
      await budgetService.deleteBudget(id);
    } catch (error) {
      set({ budgets: prev });
      throw error;
    }
  },
}));
