// components/transactions/TransactionCard.tsx
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Transaction } from '../../types/transaction.types';
import { CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';
import { TRANSACTION_COLORS } from '../../constants/colors';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';

interface TransactionCardProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export default function TransactionCard({ transaction: tx, onDelete }: TransactionCardProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const allCats = [...CATEGORIES, ...INCOME_CATEGORIES];
  const cat = allCats.find((c) => c.id === tx.category);
  const isIncome = tx.type === 'INCOME';
  const isTransfer = tx.type === 'TRANSFER';

  const amountColor = isIncome
    ? TRANSACTION_COLORS.income.text
    : isTransfer
    ? TRANSACTION_COLORS.transfer.text
    : TRANSACTION_COLORS.expense.text;

  const amountPrefix = isIncome ? '+' : isTransfer ? '' : '-';

  return (
    <Pressable
      style={[styles.container, { borderBottomColor: colors.border }]}
      onPress={() => router.push(`/transaction/${tx.id}` as any)}
    >
      <View style={[styles.iconCircle, { backgroundColor: cat?.color || (isDark ? '#2A2A2A' : '#F3F4F6') }]}>
        <Text style={styles.emoji}>{cat?.icon || (isTransfer ? '⇄' : '📦')}</Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {tx.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {formatDate(tx.date)}
          {tx.account ? ` · ${tx.account.name}` : ''}
          {tx.groupId ? ' · 👥 Split' : ''}
        </Text>
      </View>

      <Text style={[styles.amount, { color: amountColor }]}>
        {amountPrefix}{formatINR(tx.amount)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emoji: { fontSize: 20 },
  info: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700', marginBottom: 2 },
  subtitle: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600' },
  amount: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginLeft: 8 },
});
