import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';

export const Toast: React.FC = () => {
  const toast = useUIStore((state) => state.toast);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const translateY = useSharedValue(-150);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (toast) {
      // Slide down to active position
      translateY.value = withSpring(insets.top + 10, {
        damping: 15,
        stiffness: 120,
      });
    } else {
      // Slide back up offscreen
      translateY.value = withTiming(-150, { duration: 250 });
    }
  }, [toast, insets.top]);

  if (!toast) {
    return null;
  }

  const getThemeDetails = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: colors.successBg,
          text: colors.success,
          border: 'rgba(22, 163, 74, 0.2)',
        };
      case 'error':
        return {
          bg: colors.dangerBg,
          text: colors.danger,
          border: 'rgba(220, 38, 38, 0.2)',
        };
      case 'info':
        return {
          bg: colors.surfaceElevated,
          text: colors.textPrimary,
          border: colors.border,
        };
    }
  };

  const toastStyle = getThemeDetails();

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          width: width - 32,
          backgroundColor: toastStyle.bg,
          borderColor: toastStyle.border,
          shadowColor: toastStyle.text,
        },
        animatedStyle,
      ]}
    >
      <Text style={[styles.messageText, { color: toastStyle.text }]}>
        {toast.message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    zIndex: 9999,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  messageText: {
    fontSize: 13,
    fontFamily: 'Nunito',
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default Toast;
