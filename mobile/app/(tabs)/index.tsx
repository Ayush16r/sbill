import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Camera, Send, CreditCard, Bell, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useExpenseStore } from '../../store/expenseStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { ExpenseCard } from '../../components/expense/ExpenseCard';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';

export default function HomeDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const updateUserBalance = useAuthStore((state) => state.updateUserBalance);
  
  const expenses = useExpenseStore((state) => state.expenses);
  const setExpenses = useExpenseStore((state) => state.setExpenses);
  const showToast = useUIStore((state) => state.showToast);

  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalSpent: 0.0,
    totalBalance: 0.0,
    owedToOthers: 0.0,
    owedToMe: 0.0,
  });

  const fetchData = async () => {
    try {
      // 1. Get user summary statistics
      const summaryRes = await api.get('/analytics/summary');
      setAnalytics(summaryRes.data);
      updateUserBalance(summaryRes.data.totalBalance);

      // 2. Fetch recent expenses
      const expensesRes = await api.get('/expenses');
      setExpenses(expensesRes.data);
    } catch (err: any) {
      console.error('Fetch dashboard error:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute total balance color (green for positive asset, red for debt)
  const balanceColor = analytics.totalBalance >= 0 ? colors.success : colors.danger;
  const balanceLabel = analytics.totalBalance >= 0 ? 'You are owed' : 'You owe';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Navigation Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.profileRow}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarLetter, { color: colors.primaryDeep }]}>
              {user?.name.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileText}>
            <Text style={[styles.welcomeLabel, { color: colors.textSecondary }]}>Yo,</Text>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{user?.name}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable 
            onPress={fetchData}
            style={[styles.headerBtn, { backgroundColor: colors.surfaceElevated }]}
          >
            <RefreshCw size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={[styles.headerBtn, { backgroundColor: colors.surfaceElevated }]}>
            <Bell size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Hero Balance Panel (Revolut/Neo-Banking visual theme) */}
        <Card variant="glow" padding={20} style={styles.heroCard}>
          <Text style={[styles.heroLabel, { color: colors.textOnPrimary }]}>
            Total Net Balance
          </Text>
          <Text style={[styles.heroBalance, { color: colors.textOnPrimary }]}>
            {formatCurrency(analytics.totalBalance, user?.currency || 'USD')}
          </Text>

          <View style={styles.balanceBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: colors.primaryDeep }]}>You owe</Text>
              <Text style={[styles.breakdownAmount, { color: colors.danger }]}>
                {formatCurrency(analytics.owedToOthers, user?.currency || 'USD')}
              </Text>
            </View>
            <View style={[styles.breakdownDivider, { backgroundColor: colors.primaryDeep }]} />
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: colors.primaryDeep }]}>Owed to you</Text>
              <Text style={[styles.breakdownAmount, { color: colors.success }]}>
                {formatCurrency(analytics.owedToMe, user?.currency || 'USD')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions grid (4 elements) */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <Pressable 
            onPress={() => router.push('/expense/add')}
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: `${colors.primary}1E` }]}>
              <Plus size={20} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Add Expense</Text>
          </Pressable>

          <Pressable 
            onPress={() => showToast('AI Scanner: Point at receipt to auto-extract!', 'info')}
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: `${colors.primary}1E` }]}>
              <Camera size={20} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Scan Receipt</Text>
          </Pressable>

          <Pressable 
            onPress={() => router.push('/group/settle')}
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: `${colors.primary}1E` }]}>
              <Send size={20} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Settle Up</Text>
          </Pressable>

          <Pressable 
            onPress={() => showToast('Saved Payment Cards', 'info')}
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: `${colors.primary}1E` }]}>
              <CreditCard size={20} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>My Wallet</Text>
          </Pressable>
        </View>

        {/* Recent Transactions List Feed */}
        <View style={styles.transactionsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
            Recent Transactions
          </Text>
          {expenses.length > 0 && (
            <Text style={[styles.seeAllText, { color: colors.primary }]}>Active</Text>
          )}
        </View>

        {expenses.length === 0 ? (
          <Card variant="glass" padding={24} style={styles.emptyCard}>
            <Text style={[styles.emptyEmoji]}>📦</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No active transactions yet. Click "Add Expense" to split your first bill!
            </Text>
          </Card>
        ) : (
          expenses.slice(0, 5).map((expense) => {
            // Find current user owes share
            const mySplit = expense.splits.find((s: any) => s.userId === user?.id);
            const userOwes = mySplit 
              ? expense.paidById === user?.id 
                ? -(expense.amount - mySplit.amount) // Payer is owed back
                : mySplit.amount                     // Participant owes payer
              : 0;

            return (
              <ExpenseCard
                key={expense.id}
                title={expense.title}
                amount={expense.amount}
                paidBy={expense.paidById === user?.id ? 'You' : expense.paidBy.name}
                splitCount={expense.splits.length}
                category={expense.category}
                date={expense.date}
                userOwes={userOwes}
                currencyCode={expense.currency}
                onPress={() => showToast(`Expense details: ${expense.title}`, 'info')}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  profileText: {
    marginLeft: 12,
  },
  welcomeLabel: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '600',
    lineHeight: 14,
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroCard: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 28,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  heroBalance: {
    fontSize: 36,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    letterSpacing: -1,
    marginVertical: 12,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '700',
    marginBottom: 2,
  },
  breakdownAmount: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  breakdownDivider: {
    width: 1.5,
    height: 32,
    marginHorizontal: 16,
    opacity: 0.2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionBtn: {
    width: '23%',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 9,
    fontFamily: 'Nunito',
    fontWeight: '800',
    textAlign: 'center',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 24,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '700',
  },
  emptyCard: {
    marginHorizontal: 24,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});
