// services/budget.service.ts
import api from './api';
import { Budget, CreateBudgetPayload } from '../types/budget.types';

export async function fetchBudgets(): Promise<Budget[]> {
  const res = await api.get('/budgets');
  return res.data;
}

export async function fetchBudgetById(id: string): Promise<Budget & { transactions: any[] }> {
  const res = await api.get(`/budgets/${id}`);
  return res.data;
}

export async function createBudget(payload: CreateBudgetPayload): Promise<Budget> {
  const res = await api.post('/budgets', payload);
  return res.data;
}

export async function updateBudget(id: string, updates: Partial<CreateBudgetPayload> & { isActive?: boolean }): Promise<Budget> {
  const res = await api.patch(`/budgets/${id}`, updates);
  return res.data;
}

export async function deleteBudget(id: string): Promise<void> {
  await api.delete(`/budgets/${id}`);
}
