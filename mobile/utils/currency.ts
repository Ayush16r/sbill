// utils/currency.ts
/**
 * Formats a numeric value into a standard currency string.
 * Defaults to INR (Indian Rupee).
 */
export function formatCurrency(
  amount: number,
  currencyCode = 'INR',
  locale?: string
): string {
  // Always format as INR/₹ to replace ALL currency symbols with Indian Rupee (₹)
  const resolvedLocale = 'en-IN';

  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fail-safe manual formatting
    const sign = amount < 0 ? '-' : '';
    return `${sign}₹${Math.abs(amount).toFixed(2)}`;
  }
}

/**
 * Indian lakh/crore abbreviated formatting.
 * ₹1.25L for lakhs, ₹1.50Cr for crores.
 */
export function formatINR(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  }
  // Indian comma style: 1,00,000
  try {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    });
  } catch {
    return `${sign}₹${abs.toFixed(2)}`;
  }
}

/**
 * Formats balance with explicit + or - sign prefix.
 */
export function formatBalance(amount: number): string {
  const prefix = amount >= 0 ? '+' : '';
  return `${prefix}${formatINR(amount)}`;
}

/**
 * Returns budget status based on percentage used.
 */
export function getBudgetStatus(spent: number, budget: number) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  if (pct >= 100) return { status: 'exceeded' as const, pct: +pct.toFixed(1), color: '#F87171' };
  if (pct >= 75)  return { status: 'warning' as const,  pct: +pct.toFixed(1), color: '#FBBF24' };
  return { status: 'safe' as const, pct: +pct.toFixed(1), color: '#4ADE80' };
}
