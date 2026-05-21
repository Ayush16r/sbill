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
