// services/transaction.service.ts
import api from './api';
import { Transaction, CreateTransactionPayload, TransactionFilter, TransactionSummary } from '../types/transaction.types';

export async function fetchTransactions(filters?: TransactionFilter): Promise<Transaction[]> {
  const params: Record<string, string> = {};
  if (filters?.type) params.type = filters.type;
  if (filters?.month) params.month = String(filters.month);
  if (filters?.year) params.year = String(filters.year);
  if (filters?.category) params.category = filters.category;
  if (filters?.accountId) params.accountId = filters.accountId;

  const res = await api.get('/transactions', { params });
  return res.data;
}

export async function fetchTransactionById(id: string): Promise<Transaction> {
  const res = await api.get(`/transactions/${id}`);
  return res.data;
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  const res = await api.post('/transactions', payload);
  return res.data;
}

export async function updateTransaction(id: string, updates: Partial<CreateTransactionPayload>): Promise<Transaction> {
  const res = await api.patch(`/transactions/${id}`, updates);
  return res.data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/transactions/${id}`);
}

export async function fetchTransactionSummary(month?: number, year?: number): Promise<TransactionSummary> {
  const params: Record<string, string> = {};
  if (month) params.month = String(month);
  if (year) params.year = String(year);

  const res = await api.get('/transactions/summary', { params });
  return res.data;
}
