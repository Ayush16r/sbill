// components/budget/BudgetProgressCard.tsx
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Budget } from '../../types/budget.types';
import { CATEGORIES } from '../../constants/categories';
import { BUDGET_STATUS } from '../../constants/colors';
import { formatINR } from '../../utils/currency';

interface BudgetProgressCardProps {
  budget: Budget;
}

export default function BudgetProgressCard({ budget }: BudgetProgressCardProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const cat = CATEGORIES.find((c) => c.id === budget.category);
  const statusInfo = BUDGET_STATUS[budget.status] || BUDGET_STATUS.safe;
  const progressWidth = Math.min(budget.percentage, 100);

  return (
    <Pressable
      style={[styles.card, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderColor: colors.border }]}
      onPress={() => router.push(`/budget/${budget.id}` as any)}
    >
      <View style={styles.topRow}>
        <View style={styles.nameRow}>
          <Text style={styles.emoji}>{cat?.icon || '📦'}</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{budget.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
          <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}>
        <View style={[styles.progressFill, { width: `${progressWidth}%`, backgroundColor: statusInfo.color }]} />
      </View>

      <View style={styles.bottomRow}>
        <Text style={[styles.pctText, { color: statusInfo.color }]}>{budget.percentage}% used</Text>
        <Text style={[styles.amountText, { color: colors.textSecondary }]}>
          Budget {formatINR(budget.amount)} · Spent {formatINR(budget.spentAmount)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 22 },
  name: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: { fontSize: 12 },
  statusLabel: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 4 },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pctText: { fontSize: 13, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  amountText: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600' },
});
