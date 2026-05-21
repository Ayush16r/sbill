import React from 'react';
import { StyleSheet, View, ViewProps, Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface CardProps extends ViewProps {
  /**
   * Visual variation of card style.
   */
  variant?: 'glass' | 'filled' | 'glow';
  /**
   * Custom padding size inside the card.
   */
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  padding = 16,
  style,
  ...props
}) => {
  const { isDark, colors } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
          borderWidth: 1,
        };
      case 'filled':
        return {
          backgroundColor: colors.surfaceElevated,
          borderColor: 'transparent',
          borderWidth: 0,
        };
      case 'glow':
        return {
          backgroundColor: isDark ? 'rgba(26, 26, 26, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: colors.primary,
          borderWidth: 1.5,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 4,
        };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <View
      style={[
        styles.cardContainer,
        { padding },
        variantStyle as any,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});

export default Card;
