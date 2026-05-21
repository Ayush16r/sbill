import { create } from 'zustand';

export interface ExpenseSplitInfo {
  id: string;
  userId: string;
  amount: number;
  percentage?: number | null;
  shares?: number | null;
  isPaid: boolean;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

export interface ExpenseInfo {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  paidById: string;
  groupId?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  splitType: 'EQUAL' | 'PERCENTAGE' | 'CUSTOM' | 'SHARES';
  date: string;
  createdAt: string;
  paidBy: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  splits: ExpenseSplitInfo[];
}

interface ExpenseState {
  expenses: ExpenseInfo[];
  setExpenses: (expenses: ExpenseInfo[]) => void;
  addExpense: (expense: ExpenseInfo) => void;
  removeExpense: (expenseId: string) => void;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (expense) => set((state) => ({ expenses: [expense, ...state.expenses] })),
  removeExpense: (expenseId) => 
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== expenseId),
    })),
}));
