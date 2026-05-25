// types/transaction.types.ts

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface TransactionAccount {
  id: string;
  name: string;
  bankName: string | null;
  type: string;
  icon: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string | null;
  title: string;
  note: string | null;
  date: string;
  accountId: string | null;
  toAccountId: string | null;
  receiptUrl: string | null;
  groupId: string | null;
  expenseId: string | null;
  isRecurring: boolean;
  recurringPeriod: string | null;
  createdAt: string;
  updatedAt: string;
  account: TransactionAccount | null;
  toAccount: TransactionAccount | null;
}

export interface CreateTransactionPayload {
  type: TransactionType;
  amount: number;
  currency?: string;
  category?: string;
  title: string;
  note?: string;
  date?: string;
  accountId?: string;
  toAccountId?: string;
  receiptUrl?: string;
  groupId?: string;
  expenseId?: string;
  isRecurring?: boolean;
  recurringPeriod?: string;
}

export interface TransactionFilter {
  type?: TransactionType;
  month?: number;
  year?: number;
  category?: string;
  accountId?: string;
}

export interface TransactionSummary {
  month: number;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdownItem[];
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}
