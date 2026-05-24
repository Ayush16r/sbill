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
