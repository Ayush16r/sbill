// services/account.service.ts
import api from './api';
import { Account, CreateAccountPayload } from '../types/account.types';

export async function fetchAccounts(): Promise<Account[]> {
  const res = await api.get('/accounts');
  return res.data;
}

export async function createAccount(payload: CreateAccountPayload): Promise<Account> {
  const res = await api.post('/accounts', payload);
  return res.data;
}

export async function updateAccount(id: string, updates: Partial<CreateAccountPayload>): Promise<Account> {
  const res = await api.patch(`/accounts/${id}`, updates);
  return res.data;
}

export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/accounts/${id}`);
}
