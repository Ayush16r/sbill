// components/dashboard/BudgetOverview.tsx
import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Budget } from '../../types/budget.types';
import { CATEGORIES } from '../../constants/categories';
import { BUDGET_STATUS } from '../../constants/colors';
import { formatINR } from '../../utils/currency';

interface BudgetOverviewProps {
  budgets: Budget[];
}

export default function BudgetOverview({ budgets }: BudgetOverviewProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  if (budgets.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Monthly Budget</Text>
        <Pressable onPress={() => router.push('/budget' as any)}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {budgets.map((budget) => {
          const cat = CATEGORIES.find((c) => c.id === budget.category);
          const statusInfo = BUDGET_STATUS[budget.status] || BUDGET_STATUS.safe;
          const progressWidth = Math.min(budget.percentage, 100);

          return (
            <Pressable
              key={budget.id}
              style={[styles.budgetCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderColor: colors.border }]}
              onPress={() => router.push(`/budget/${budget.id}` as any)}
            >
              <View style={styles.budgetTopRow}>
                <Text style={styles.budgetEmoji}>{cat?.icon || '📦'}</Text>
                <Text style={[styles.budgetName, { color: colors.textPrimary }]}>{budget.name}</Text>
              </View>

              {/* Progress bar */}
              <View style={[styles.progressTrack, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}>
                <View
                  style={[styles.progressFill, { width: `${progressWidth}%`, backgroundColor: statusInfo.color }]}
                />
              </View>

              <View style={styles.budgetBottomRow}>
                <Text style={[styles.budgetPct, { color: statusInfo.color }]}>
                  {budget.percentage}% used
                </Text>
                <Text style={[styles.budgetAmount, { color: colors.textSecondary }]}>
                  {formatINR(budget.spentAmount)} / {formatINR(budget.amount)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  budgetCard: {
    width: 200,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  budgetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  budgetEmoji: {
    fontSize: 20,
  },
  budgetName: {
    fontSize: 14,
    fontFamily: 'Nunito',
    fontWeight: '700',
    flex: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetPct: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  budgetAmount: {
    fontSize: 10,
    fontFamily: 'Nunito',
    fontWeight: '600',
  },
});
