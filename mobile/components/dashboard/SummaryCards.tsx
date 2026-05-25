// components/dashboard/SummaryCards.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { TRANSACTION_COLORS } from '../../constants/colors';
import { formatINR } from '../../utils/currency';

interface SummaryCardsProps {
  income: number;
  expenses: number;
}

export default function SummaryCards({ income, expenses }: SummaryCardsProps) {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Income Card */}
      <View style={[styles.card, {
        backgroundColor: isDark ? TRANSACTION_COLORS.income.bg : TRANSACTION_COLORS.income.bgLight,
      }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardLabel, { color: isDark ? '#86EFAC' : '#16A34A' }]}>Income</Text>
          <TrendingUp size={16} color={TRANSACTION_COLORS.income.icon} />
        </View>
        <Text style={[styles.cardAmount, { color: TRANSACTION_COLORS.income.text }]}>
          {formatINR(income)}
        </Text>
      </View>

      {/* Expenses Card */}
      <View style={[styles.card, {
        backgroundColor: isDark ? TRANSACTION_COLORS.expense.bg : TRANSACTION_COLORS.expense.bgLight,
      }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardLabel, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>Expenses</Text>
          <TrendingDown size={16} color={TRANSACTION_COLORS.expense.icon} />
        </View>
        <Text style={[styles.cardAmount, { color: TRANSACTION_COLORS.expense.text }]}>
          {formatINR(expenses)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontFamily: 'Nunito',
    fontWeight: '700',
  },
  cardAmount: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
