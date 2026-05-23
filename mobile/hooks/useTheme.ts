// hooks/useTheme.ts — Light theme by default matching the mockup
import { useUIStore } from '../store/uiStore';
import { colors } from '../constants/colors';

export function useTheme() {
  const isDark = useUIStore((state) => state.isDark);

  const lightColors = {
    ...colors,
    background:      '#FFFFFF',
    surface:         '#FFFFFF',
    surfaceElevated: '#F9FAFB',
    textPrimary:     '#111827',
    textSecondary:   '#6B7280',
    border:          '#E5E7EB',
    cardBg:          '#FFFFFF',
    cardGlow:        'rgba(34, 197, 94, 0.08)',
    textOnPrimary:   '#FFFFFF',
    inputBg:         '#F9FAFB',
    shadow:          'rgba(0,0,0,0.08)',
  };

  const darkColors = {
    ...colors,
    background:      '#0A0A0A',
    surface:         '#1A1A1A',
    surfaceElevated: '#1F1F1F',
    textPrimary:     '#FFFFFF',
    textSecondary:   '#9CA3AF',
    border:          '#2A2A2A',
    cardBg:          'rgba(26,26,26,0.85)',
    cardGlow:        'rgba(34, 197, 94, 0.12)',
    textOnPrimary:   '#FFFFFF',
    inputBg:         '#1F1F1F',
    shadow:          'rgba(0,0,0,0.4)',
  };

  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
  };
}

export type Theme = ReturnType<typeof useTheme>;
export default useTheme;
