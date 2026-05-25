// utils/budgetCalculator.ts
import { BUDGET_STATUS } from '../constants/colors';

export interface BudgetProgressInfo {
  percentage: number;
  remaining: number;
  status: 'safe' | 'warning' | 'exceeded';
  color: string;
  icon: string;
  label: string;
}

/**
 * Calculates budget progress including status, color, and icon.
 */
export function calculateBudgetProgress(
  spent: number,
  budget: number
): BudgetProgressInfo {
  const percentage = budget > 0 ? +((spent / budget) * 100).toFixed(1) : 0;
  const remaining = +(budget - spent).toFixed(2);

  let statusKey: 'safe' | 'warning' | 'exceeded';
  if (percentage >= 100) {
    statusKey = 'exceeded';
  } else if (percentage >= 75) {
    statusKey = 'warning';
  } else {
    statusKey = 'safe';
  }

  const statusInfo = BUDGET_STATUS[statusKey];

  return {
    percentage,
    remaining,
    status: statusKey,
    color: statusInfo.color,
    icon: statusInfo.icon,
    label: statusInfo.label,
  };
}

/**
 * Returns the daily budget remaining for a given budget and days left.
 */
export function getDailyBudgetRemaining(
  remaining: number,
  daysLeft: number
): number {
  if (daysLeft <= 0 || remaining <= 0) return 0;
  return +(remaining / daysLeft).toFixed(2);
}

/**
 * Returns the number of days remaining in the current month.
 */
export function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}
