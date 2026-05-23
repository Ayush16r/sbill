import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';

interface Slide {
  emoji: string;
  title: string;
  description: string;
  bgColor: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🤝',
    title: 'Split Expenses,\nStay Friends',
    description:
      'Easily split bills and track shared expenses with friends without the awkward conversations.',
    bgColor: '#F0FDF4',
  },
  {
    emoji: '📊',
    title: 'Track & Manage\nEvery Cent',
    description:
      'View category summaries, analytics and spending insights all inside one secure app.',
    bgColor: '#EFF6FF',
  },
  {
    emoji: '⚡',
    title: 'Settle Debts\nIn Seconds',
    description:
      'Calculate who owes who with smart algorithms. Clear your tabs instantly with one tap.',
    bgColor: '#FFF7ED',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const [activeIndex, setActiveIndex] = useState(0);
  const offsetX = useSharedValue(0);

  const animatedSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }],
  }));

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const nextIdx = activeIndex + 1;
      setActiveIndex(nextIdx);
      offsetX.value = withSpring(-nextIdx * width, { damping: 16, stiffness: 120 });
    } else {
      router.push('/(auth)/login');
    }
  };

  const handleSkip = () => router.push('/(auth)/login');

  const slide = SLIDES[activeIndex];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip */}
      <View style={styles.topBar}>
        <View />
        {activeIndex < SLIDES.length - 1 && (
          <Pressable onPress={handleSkip} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Slide area */}
      <View style={styles.slideArea}>
        <Animated.View
          style={[{ flexDirection: 'row', width: width * SLIDES.length }, animatedSlideStyle]}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={[styles.slide, { width }]}>
              {/* Illustration circle */}
              <View style={[styles.illustrationCircle, { backgroundColor: s.bgColor }]}>
                <Text style={styles.illustrationEmoji}>{s.emoji}</Text>
              </View>
              <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>{s.title}</Text>
              <Text style={[styles.slideDesc, { color: colors.textSecondary }]}>{s.description}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === activeIndex ? colors.primary : colors.gray200,
                  width: i === activeIndex ? 28 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Button
          title={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={styles.nextBtn}
        />

        {/* Login link */}
        <Pressable onPress={handleSkip} style={styles.loginRow}>
          <Text style={[styles.loginHintText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Text style={[styles.loginLink, { color: colors.primary }]}>Login</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    height: 52,
  },
  skipBtn: { padding: 8 },
  skipText: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700' },
  slideArea: { flex: 1, overflow: 'hidden' },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  illustrationCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 44,
  },
  illustrationEmoji: { fontSize: 90 },
  slideTitle: {
    fontSize: 30,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  slideDesc: {
    fontSize: 15,
    fontFamily: 'Nunito',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 6,
  },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: { width: '100%', marginBottom: 16 },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  loginHintText: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '600' },
  loginLink: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '800' },
});
