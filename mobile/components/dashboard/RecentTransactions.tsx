// components/dashboard/RecentTransactions.tsx
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Transaction } from '../../types/transaction.types';
import { CATEGORIES } from '../../constants/categories';
import { TRANSACTION_COLORS } from '../../constants/colors';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Recent Transactions</Text>
        <Pressable onPress={() => router.push('/(tabs)/transactions' as any)}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
        </Pressable>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💸</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No transactions yet. Tap + to add your first one!
          </Text>
        </View>
      ) : (
        transactions.slice(0, 5).map((tx) => {
          const cat = CATEGORIES.find((c) => c.id === tx.category);
          const isIncome = tx.type === 'INCOME';
          const isTransfer = tx.type === 'TRANSFER';
          const amountColor = isIncome
            ? TRANSACTION_COLORS.income.text
            : isTransfer
            ? TRANSACTION_COLORS.transfer.text
            : TRANSACTION_COLORS.expense.text;

          return (
            <Pressable
              key={tx.id}
              style={[styles.txRow, { borderBottomColor: colors.border }]}
              onPress={() => router.push(`/transaction/${tx.id}` as any)}
            >
              <View style={[styles.txIcon, { backgroundColor: cat?.color || '#F3F4F6' }]}>
                <Text style={styles.txEmoji}>{cat?.icon || (isTransfer ? '⇄' : '📦')}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={[styles.txTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {tx.title}
                </Text>
                <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                  {formatDate(tx.date)}
                  {tx.account ? ` · ${tx.account.name}` : ''}
                </Text>
              </View>
              <Text style={[styles.txAmount, { color: amountColor }]}>
                {isIncome ? '+' : isTransfer ? '' : '-'}{formatINR(tx.amount)}
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 13,
    fontFamily: 'Nunito',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Nunito',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txEmoji: {
    fontSize: 18,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontFamily: 'Nunito',
    fontWeight: '700',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '600',
  },
  txAmount: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
});
