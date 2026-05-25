// constants/colors.ts — Matched to uploaded mockup (white/light bg, bright green CTA)
export const colors = {
  // Brand — bright green like the mockup
  primary:      '#22C55E',   // Main green CTA / accents
  primaryDark:  '#16A34A',   // Pressed / darker green
  primaryLight: '#86EFAC',   // Soft green tints
  primaryBg:    '#F0FDF4',   // Very light mint page bg
  primaryDeep:  '#FFFFFF',   // Text ON primary (white on green buttons)

  // Semantic
  danger:       '#EF4444',
  dangerBg:     '#FEF2F2',
  success:      '#16A34A',
  successBg:    '#F0FDF4',
  warning:      '#F59E0B',
  warningBg:    '#FFFBEB',

  // Neutrals — light theme dominant
  black:        '#111827',
  white:        '#FFFFFF',
  gray50:       '#F9FAFB',
  gray100:      '#F3F4F6',
  gray200:      '#E5E7EB',
  gray300:      '#D1D5DB',
  gray400:      '#9CA3AF',
  gray600:      '#6B7280',
  gray700:      '#374151',
  gray900:      '#111827',

  // Dark mode surfaces (kept for optional dark toggle)
  dark100:      '#1A1A1A',
  dark200:      '#1F1F1F',
  dark300:      '#2A2A2A',

  // Chart / card specific
  chartGreen:   '#22C55E',
  chartBlue:    '#3B82F6',
  cardDark:     '#1C1C1E',   // Dark card like the Total Balance card in mockup
};

// Personal Expense Tracking — Transaction Card Colors
export const TRANSACTION_COLORS = {
  income: {
    bg: '#14532D',        // dark green card bg
    bgLight: '#F0FDF4',   // light mode card bg
    text: '#4ADE80',      // income amount text
    icon: '#16A34A',
  },
  expense: {
    bg: '#4A0E0E',        // dark red card bg
    bgLight: '#FEF2F2',   // light mode card bg
    text: '#F87171',      // expense amount text
    icon: '#DC2626',
  },
  transfer: {
    bg: '#1E293B',        // slate card bg
    bgLight: '#F8FAFC',
    text: '#94A3B8',
    icon: '#64748B',
  },
  balance: {
    bg: '#1E2A3A',        // balance card bg
    text: '#FFFFFF',
    subtitle: '#94A3B8',
  },
};

// Budget Status Colors
export const BUDGET_STATUS = {
  safe:     { color: '#4ADE80', icon: '✅', label: 'On track' },
  warning:  { color: '#FBBF24', icon: '⚠️', label: 'Getting close' },
  exceeded: { color: '#F87171', icon: '🔴', label: 'Exceeded' },
};

