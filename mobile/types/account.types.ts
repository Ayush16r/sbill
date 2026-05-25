// types/account.types.ts

export type AccountType = 'BANK' | 'WALLET' | 'CASH' | 'CREDIT_CARD' | 'UPI';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  bankName: string | null;
  accountLast4: string | null;
  icon: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountPayload {
  name: string;
  type?: AccountType;
  balance?: number;
  currency?: string;
  bankName?: string;
  accountLast4?: string;
  icon?: string;
  isDefault?: boolean;
}
