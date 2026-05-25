// constants/categories.ts
export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'food',        label: 'Food',        icon: '🍕', color: '#FEF3C7' },
  { id: 'travel',      label: 'Travel',      icon: '✈️',  color: '#EDE9FE' },
  { id: 'rent',        label: 'Rent',        icon: '🏠',  color: '#DBEAFE' },
  { id: 'shopping',    label: 'Shopping',    icon: '🛍️',  color: '#FCE7F3' },
  { id: 'party',       label: 'Party',       icon: '🎉',  color: '#F0FDF4' },
  { id: 'utilities',   label: 'Utilities',   icon: '⚡',  color: '#FEF9C3' },
  { id: 'transport',   label: 'Transport',   icon: '🚗',  color: '#E0F2FE' },
  { id: 'health',      label: 'Health',      icon: '💊',  color: '#FCE7F3' },
  { id: 'entertainment', label: 'Fun',       icon: '🎬',  color: '#EDE9FE' },
  { id: 'other',       label: 'Other',       icon: '📦',  color: '#F3F4F6' },
];

// Income source categories
export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary',     label: 'Salary',      icon: '💼', color: '#D1FAE5' },
  { id: 'freelance',  label: 'Freelance',   icon: '💻', color: '#DBEAFE' },
  { id: 'investment', label: 'Investment',  icon: '📈', color: '#EDE9FE' },
  { id: 'gift',       label: 'Gift',        icon: '🎁', color: '#FCE7F3' },
  { id: 'rental',     label: 'Rental',      icon: '🏠', color: '#FEF9C3' },
  { id: 'business',   label: 'Business',    icon: '🏪', color: '#FFEDD5' },
  { id: 'refund',     label: 'Refund',      icon: '↩️',  color: '#F0FDF4' },
  { id: 'other',      label: 'Other',       icon: '📦', color: '#F3F4F6' },
];

