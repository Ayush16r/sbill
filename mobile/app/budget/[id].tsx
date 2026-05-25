// app/budget/[id].tsx — Budget Detail
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useBudgetStore } from '../../store/budgetStore';
import { useUIStore } from '../../store/uiStore';
import { Budget } from '../../types/budget.types';
import { CATEGORIES } from '../../constants/categories';
import { BUDGET_STATUS } from '../../constants/colors';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';
import { fetchBudgetById } from '../../services/budget.service';

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const deleteBudget = useBudgetStore((s) => s.deleteBudget);
  const showToast = useUIStore((s) => s.showToast);

  const [budget, setBudget] = useState<(Budget & { transactions: any[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBudgetById(id)
        .then(setBudget)
        .catch(() => showToast('Budget not found', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleDelete = () => {
    Alert.alert('Delete Budget', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteBudget(id as string);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            showToast('Budget deleted', 'success');
            router.back();
          } catch (error: any) {
            showToast(error.message || 'Failed to delete', 'error');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!budget) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Budget not found</Text>
      </View>
    );
  }

  const cat = CATEGORIES.find((c) => c.id === budget.category);
  const statusInfo = BUDGET_STATUS[budget.status] || BUDGET_STATUS.safe;
  const progressWidth = Math.min(budget.percentage, 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Budget Detail</Text>
        <Pressable onPress={handleDelete} style={styles.headerBtn}>
          <Trash2 size={20} color="#DC2626" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>{cat?.icon || '📦'}</Text>
          <Text style={[styles.heroName, { color: colors.textPrimary }]}>{budget.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
            <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={[styles.progressTrack, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}>
            <View style={[styles.progressFill, { width: `${progressWidth}%`, backgroundColor: statusInfo.color }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressPct, { color: statusInfo.color }]}>{budget.percentage}%</Text>
            <Text style={[styles.progressAmt, { color: colors.textSecondary }]}>
              {formatINR(budget.spentAmount)} of {formatINR(budget.amount)}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Spent</Text>
            <Text style={[styles.statValue, { color: '#F87171' }]}>{formatINR(budget.spentAmount)}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
            <Text style={[styles.statValue, { color: '#4ADE80' }]}>{formatINR(budget.remaining)}</Text>
          </View>
        </View>

        {/* Related Transactions */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Transactions in this budget
        </Text>
        {budget.transactions.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No expenses in this category yet
          </Text>
        ) : (
          budget.transactions.map((tx: any) => (
            <View key={tx.id} style={[styles.txRow, { borderBottomColor: colors.border }]}>
              <View style={styles.txInfo}>
                <Text style={[styles.txTitle, { color: colors.textPrimary }]}>{tx.title}</Text>
                <Text style={[styles.txDate, { color: colors.textSecondary }]}>{formatDate(tx.date)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: '#F87171' }]}>-{formatINR(tx.amount)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  heroSection: { alignItems: 'center', paddingVertical: 24 },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroName: { fontSize: 22, fontFamily: 'SpaceGrotesk', fontWeight: '800', marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusIcon: { fontSize: 14 },
  statusLabel: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '700' },
  progressSection: { marginBottom: 24 },
  progressTrack: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressPct: { fontSize: 16, fontFamily: 'SpaceGrotesk', fontWeight: '800' },
  progressAmt: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600' },
  statsRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 24 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, marginHorizontal: 8 },
  statLabel: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: 'SpaceGrotesk', fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginBottom: 12 },
  emptyText: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600', textAlign: 'center', paddingVertical: 20 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700', marginBottom: 2 },
  txDate: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600' },
  txAmount: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
});
