// utils/currency.ts
/**
 * Formats a numeric value into a standard currency string.
 * Supports customization of currency code, locale, and fraction digits.
 */
export function formatCurrency(
  amount: number,
  currencyCode = 'INR',
  locale = 'en-IN'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fail-safe manual formatting if Intl fails or is not fully supported in some environments
    const absoluteAmount = Math.abs(amount).toFixed(2);
    const symbol = currencyCode === 'USD' ? '$' : currencyCode === 'EUR' ? '€' : currencyCode === 'INR' ? '₹' : `${currencyCode} `;
    const sign = amount < 0 ? '-' : '';
    return `${sign}${symbol}${absoluteAmount}`;
  }
}
