// hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { colors } from '../constants/colors';

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    isDark,
    colors: {
      ...colors,
      background: isDark ? colors.black : colors.primaryBg,
      surface: isDark ? colors.dark100 : colors.white,
      surfaceElevated: isDark ? colors.dark200 : colors.gray50,
      textPrimary: isDark ? colors.white : colors.black,
      textSecondary: isDark ? colors.gray400 : colors.gray600,
      border: isDark ? colors.dark300 : colors.gray200,
      cardBg: isDark ? 'rgba(26, 26, 26, 0.85)' : 'rgba(255, 255, 255, 0.9)',
      cardGlow: isDark ? 'rgba(74, 222, 128, 0.12)' : 'rgba(74, 222, 128, 0.05)',
      textOnPrimary: colors.primaryDeep,
    },
  };
}

export type Theme = ReturnType<typeof useTheme>;
export default useTheme;
