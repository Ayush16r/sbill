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
  // Pick locale based on currency for proper formatting
  const localeMap: Record<string, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    AED: 'ar-AE',
    SGD: 'en-SG',
    JPY: 'ja-JP',
    CAD: 'en-CA',
  };
  const resolvedLocale = locale || localeMap[currencyCode] || 'en-IN';

  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fail-safe manual formatting
    const symbolMap: Record<string, string> = {
      USD: '$', EUR: '€', INR: '₹', GBP: '£',
      AED: 'د.إ', SGD: 'S$', JPY: '¥', CAD: 'C$',
    };
    const symbol = symbolMap[currencyCode] || `${currencyCode} `;
    const sign = amount < 0 ? '-' : '';
    return `${sign}${symbol}${Math.abs(amount).toFixed(2)}`;
  }
}
