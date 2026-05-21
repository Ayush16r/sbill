import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence 
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';

export default function SplashScreenView() {
  const router = useRouter();
  const { colors } = useTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Logo animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.2);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    // Pulse animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(0.9, { duration: 1000 })
      ),
      -1, // infinite loop
      true // reverse direction
    );

    opacity.value = withTiming(1, { duration: 800 });

    // Transition timer
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
        <View style={[styles.logoGlow, { shadowColor: colors.primary }]} />
        <Text style={[styles.logoIcon, { color: colors.primaryDeep, backgroundColor: colors.primary }]}>
          $
        </Text>
      </Animated.View>
      <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
        Bill<Text style={{ color: colors.primary }}>Split</Text>
      </Text>
      <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
        Neo-banking meets social fintech
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
  },
  logoIcon: {
    fontSize: 42,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    width: 80,
    height: 80,
    borderRadius: 40,
    textAlign: 'center',
    lineHeight: 80,
    overflow: 'hidden',
  },
  brandTitle: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
