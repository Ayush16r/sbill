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
