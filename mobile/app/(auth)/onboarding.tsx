import React, { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';

interface Slide {
  icon: string;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    icon: '🍕',
    title: 'Split Expenses,\nStay Friends',
    description: 'Easily split bills and track shared expenses with friends without the awkward conversations.',
  },
  {
    icon: '📈',
    title: 'Track & Manage\nEvery Cent',
    description: 'View category summaries, dynamic charts, and financial analytics all inside one secure app.',
  },
  {
    icon: '⚡',
    title: 'Settle Debts\nIn Seconds',
    description: 'Calculate who owes who dynamically using advanced algorithms. Clear your tabs instantly.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const [activeIndex, setActiveIndex] = useState(0);

  // Reanimated slide transition offset
  const offsetX = useSharedValue(0);

  const animatedSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }],
  }));

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const nextIdx = activeIndex + 1;
      setActiveIndex(nextIdx);
      offsetX.value = withSpring(-nextIdx * width, { damping: 15 });
    } else {
      router.push('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Skip Button */}
      <View style={styles.header}>
        {activeIndex < SLIDES.length - 1 && (
          <Pressable onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Slide Carousel Track */}
      <Animated.View style={[styles.track, { width: width * SLIDES.length }, animatedSlideStyle]}>
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={[styles.illustrationWrapper, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={styles.illustrationEmoji}>{slide.icon}</Text>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{slide.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{slide.description}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Pagination & CTA Footer */}
      <View style={styles.footer}>
        {/* Progress dots */}
        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.indicatorDot,
                {
                  backgroundColor: i === activeIndex ? colors.primary : colors.border,
                  width: i === activeIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Navigation Action CTA */}
        <Button
          title={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginTop: 40,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Nunito',
    fontWeight: '700',
  },
  track: {
    flex: 1,
    flexDirection: 'row',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  illustrationWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  illustrationEmoji: {
    fontSize: 70,
  },
  title: {
    fontSize: 28,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Nunito',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  indicatorDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
