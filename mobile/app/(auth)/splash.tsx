import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';

export default function SplashScreenView() {
  const router = useRouter();
  const { colors } = useTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  useEffect(() => {
    // Fade in logo
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.2)) });

    // Slight delay before showing text
    const textTimer = setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 500 });
    }, 400);

    // Navigate after splash
    const navTimer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }, 2600);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(navTimer);
    };
  }, [isAuthenticated]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
          Bill <Text style={{ color: colors.primary }}>Split</Text>
        </Text>
        <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
          Split • Track • Settle
        </Text>
      </Animated.View>

      {/* Bottom loading indicator */}
      <View style={styles.dotRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === 1 ? colors.primary : colors.gray200 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 60,
  },
  brandTitle: {
    fontSize: 36,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 13,
    fontFamily: 'Nunito',
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dotRow: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
