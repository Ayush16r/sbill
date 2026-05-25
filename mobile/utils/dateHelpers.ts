// utils/dateHelpers.ts
/**
 * Formats a Date object or ISO string into a human-readable string.
 * Example outputs: "Today", "Yesterday", "May 21, 2026", etc.
 */
export function formatDate(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  
  // Reset hours to compare calendar days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (compareDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (compareDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined,
  };

  try {
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    // Basic fallback formatting
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return now.getFullYear() !== year ? `${month} ${day}, ${year}` : `${month} ${day}`;
  }
}

/**
 * Returns start and end Date for a given month/year range.
 */
export function getMonthRange(month: number, year: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Returns human-readable month label: "May 2026".
 */
export function getMonthLabel(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
  } catch {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[month - 1]} ${year}`;
  }
}

/**
 * Returns short month label: "May".
 */
export function getShortMonthLabel(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
}

/**
 * Groups an array of items by their date into sections.
 * Returns: [{ title: "Today", data: [...] }, { title: "Yesterday", data: [...] }, ...]
 */
export function groupByDate<T extends { date: string }>(
  items: T[]
): Array<{ title: string; data: T[] }> {
  const groups: Record<string, T[]> = {};

  items.forEach((item) => {
    const label = formatDate(item.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  });

  // Sort groups: Today first, Yesterday second, then by date descending
  const order = ['Today', 'Yesterday'];
  return Object.entries(groups)
    .sort(([a], [b]) => {
      const aIdx = order.indexOf(a);
      const bIdx = order.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0; // Keep existing order for older dates
    })
    .map(([title, data]) => ({ title, data }));
}

/**
 * Returns the last N months as { month, year } pairs (most recent first).
 */
export function getLastNMonths(n: number): Array<{ month: number; year: number; label: string }> {
  const now = new Date();
  const result = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: getMonthLabel(d.getMonth() + 1, d.getFullYear()),
    });
  }
  return result;
}
