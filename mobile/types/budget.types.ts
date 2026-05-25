// types/budget.types.ts

export type BudgetPeriod = 'MONTHLY' | 'WEEKLY' | 'YEARLY' | 'CUSTOM';
export type BudgetStatus = 'safe' | 'warning' | 'exceeded';

export interface Budget {
  id: string;
  userId: string;
  category: string;
  name: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed by backend
  spentAmount: number;
  percentage: number;
  remaining: number;
  status: BudgetStatus;
}

export interface CreateBudgetPayload {
  category: string;
  name: string;
  amount: number;
  currency?: string;
  period?: BudgetPeriod;
  startDate?: string;
  endDate?: string;
}
