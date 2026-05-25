// components/shared/CurrencyText.tsx
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { formatINR } from '../../utils/currency';

interface CurrencyTextProps extends TextProps {
  amount: number;
  showSign?: boolean;
  type?: 'income' | 'expense' | 'transfer' | 'neutral';
}

const TYPE_COLORS = {
  income: '#4ADE80',
  expense: '#F87171',
  transfer: '#94A3B8',
  neutral: '#FFFFFF',
};

export default function CurrencyText({ amount, showSign, type = 'neutral', style, ...props }: CurrencyTextProps) {
  const sign = showSign ? (amount >= 0 ? '+' : '') : '';
  const color = TYPE_COLORS[type];

  return (
    <Text style={[styles.text, { color }, style]} {...props}>
      {sign}{formatINR(amount)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
});
