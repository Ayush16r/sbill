// components/dashboard/BalanceCard.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TRANSACTION_COLORS } from '../../constants/colors';
import { formatBalance } from '../../utils/currency';

interface BalanceCardProps {
  balance: number;
  bankName?: string;
  bankBalance?: number;
}

export default function BalanceCard({ balance, bankName, bankBalance }: BalanceCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Balance</Text>
        <Text style={styles.amount}>{formatBalance(balance)}</Text>
        {bankName && (
          <Text style={styles.subtitle}>
            🏛 {bankName}{bankBalance !== undefined ? ` · ₹${bankBalance.toFixed(2)}` : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: TRANSACTION_COLORS.balance.bg,
    borderRadius: 16,
    padding: 20,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    color: TRANSACTION_COLORS.balance.subtitle,
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    color: TRANSACTION_COLORS.balance.text,
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    color: TRANSACTION_COLORS.balance.subtitle,
  },
});
