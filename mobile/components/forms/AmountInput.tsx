// components/forms/AmountInput.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { Delete } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  type?: 'income' | 'expense' | 'transfer';
}

export default function AmountInput({ value, onChange, currency = '₹', type = 'expense' }: AmountInputProps) {
  const { colors, isDark } = useTheme();
  const [shakeAnim] = useState(new Animated.Value(0));

  const typeColors = {
    income: '#4ADE80',
    expense: '#F87171',
    transfer: '#94A3B8',
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === 'backspace') {
      onChange(value.slice(0, -1) || '0');
      return;
    }

    if (key === '.') {
      if (value.includes('.')) {
        shake();
        return;
      }
      onChange(value + '.');
      return;
    }

    // Prevent more than 2 decimal places
    const decimalIdx = value.indexOf('.');
    if (decimalIdx !== -1 && value.length - decimalIdx > 2) {
      shake();
      return;
    }

    // Prevent leading zeros
    if (value === '0' && key !== '.') {
      onChange(key);
      return;
    }

    onChange(value + key);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.displayContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={[styles.currencySymbol, { color: typeColors[type] }]}>{currency}</Text>
        <Text style={[styles.amountDisplay, { color: typeColors[type] }]}>
          {value || '0'}
        </Text>
      </Animated.View>

      <View style={styles.numpad}>
        {keys.map((key) => (
          <Pressable
            key={key}
            onPress={() => handlePress(key)}
            style={({ pressed }) => [
              styles.numKey,
              { backgroundColor: pressed ? (isDark ? '#2A2A2A' : '#E5E7EB') : 'transparent' },
            ]}
          >
            {key === 'backspace' ? (
              <Delete size={22} color={colors.textPrimary} />
            ) : (
              <Text style={[styles.numKeyText, { color: colors.textPrimary }]}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  currencySymbol: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginRight: 4,
  },
  amountDisplay: {
    fontSize: 48,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    letterSpacing: -2,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
  },
  numKey: {
    width: '33.33%',
    aspectRatio: 1.8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  numKeyText: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '600',
  },
});
