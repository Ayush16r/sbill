import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface BadgeProps {
  /**
   * Title / label content of the badge.
   */
  label: string;
  /**
   * Color variations.
   */
  variant?: 'danger' | 'success' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral' }) => {
  const { colors, isDark } = useTheme();

  const getStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          container: { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : colors.dangerBg },
          text: { color: colors.danger },
        };
      case 'success':
        return {
          container: { backgroundColor: isDark ? 'rgba(74, 222, 128, 0.15)' : colors.successBg },
          text: { color: isDark ? colors.primary : colors.success },
        };
      case 'neutral':
        return {
          container: { backgroundColor: isDark ? colors.dark300 : colors.gray100 },
          text: { color: colors.textSecondary },
        };
    }
  };

  const badgeStyle = getStyles();

  return (
    <View style={[styles.container, badgeStyle.container]}>
      <Text style={[styles.text, badgeStyle.text]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    textTransform: 'lowercase',
  },
});

export default Badge;
