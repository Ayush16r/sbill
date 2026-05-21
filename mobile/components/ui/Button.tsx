import React from 'react';
import { StyleSheet, Text, ActivityIndicator, Pressable, PressableProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';

export interface ButtonProps extends PressableProps {
  /**
   * Title text of the button.
   */
  title: string;
  /**
   * Visual style variant.
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /**
   * Shows a loading spinner inside the button.
   */
  loading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  onPress,
  ...props
}) => {
  const { colors } = useTheme();
  const { lightImpact } = useHaptics();
  
  // Touch elastic spring scale
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 10, stiffness: 250 });
      lightImpact();
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 250 });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.primary,
            borderWidth: 0,
          },
          text: {
            color: colors.primaryDeep,
            fontFamily: 'SpaceGrotesk',
            fontWeight: '700' as const,
          },
          indicator: colors.primaryDeep,
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.surfaceElevated,
            borderWidth: 0,
          },
          text: {
            color: colors.textPrimary,
            fontFamily: 'Nunito',
            fontWeight: '600' as const,
          },
          indicator: colors.textPrimary,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.primary,
          },
          text: {
            color: colors.primary,
            fontFamily: 'SpaceGrotesk',
            fontWeight: '700' as const,
          },
          indicator: colors.primary,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: colors.textSecondary,
            fontFamily: 'Nunito',
            fontWeight: '600' as const,
          },
          indicator: colors.textSecondary,
        };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <AnimatedPressable
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.buttonContainer,
        variantStyle.container,
        disabled && styles.disabledContainer,
        style as any,
        animatedStyle,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.indicator} />
      ) : (
        <Text style={[styles.buttonText, variantStyle.text, disabled && styles.disabledText]}>
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    width: '100%',
  },
  buttonText: {
    fontSize: 15,
    letterSpacing: -0.1,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.8,
  },
});

export default Button;
