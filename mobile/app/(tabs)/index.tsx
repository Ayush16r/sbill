import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  Clipboard,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  Camera,
  Bell,
  User,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useExpenseStore } from '../../store/expenseStore';
import { useGroupStore } from '../../store/groupStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useBudgetStore } from '../../store/budgetStore';
import { useAccountStore } from '../../store/accountStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';

// New dashboard components
import MonthSelector from '../../components/dashboard/MonthSelector';
import SummaryCards from '../../components/dashboard/SummaryCards';
import BalanceCard from '../../components/dashboard/BalanceCard';
import QuickActions from '../../components/dashboard/QuickActions';
import BudgetOverview from '../../components/dashboard/BudgetOverview';
import RecentTransactions from '../../components/dashboard/RecentTransactions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Avatar colors for friend circles
const AVATAR_COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];

export default function HomeDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const updateUserBalance = useAuthStore((state) => state.updateUserBalance);

  const expenses = useExpenseStore((state) => state.expenses);
  const setExpenses = useExpenseStore((state) => state.setExpenses);
  const groups = useGroupStore((state) => state.groups);
  const setGroups = useGroupStore((state) => state.setGroups);
  const showToast = useUIStore((state) => state.showToast);

  // Personal expense tracking stores
  const {
    transactions,
    summary,
    selectedMonth,
    fetchTransactions,
    fetchSummary,
    setSelectedMonth,
  } = useTransactionStore();
  const { budgets, fetchBudgets } = useBudgetStore();
  const { accounts, fetchAccounts, getDefaultAccount, getTotalBalance } = useAccountStore();

  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalSpent: 0.0,
    totalBalance: 0.0,
    owedToOthers: 0.0,
    owedToMe: 0.0,
  });

  const currency = user?.currency || 'INR';

  const fetchData = async () => {
    try {
      const [summaryRes, expensesRes, groupsRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/expenses'),
        api.get('/groups'),
      ]);
      setAnalytics(summaryRes.data);
      updateUserBalance(summaryRes.data.totalBalance);
      setExpenses(expensesRes.data);
      setGroups(groupsRes.data);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchData(),
      fetchTransactions(),
      fetchSummary(),
      fetchBudgets(),
      fetchAccounts(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [])
  );

  // Get unique members across all groups for friends avatars
  const allMembers = groups.flatMap((g) => g.members || []).filter(
    (m, i, arr) => arr.findIndex((x) => x.userId === m.userId) === i && m.userId !== user?.id
  );

  const defaultAccount = getDefaultAccount();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.profileRow}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarLetter}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileText}>
            <Text style={[styles.greetLabel, { color: colors.textSecondary }]}>Hi,</Text>
            <Text style={[styles.greetName, { color: colors.textPrimary }]}>{user?.name?.split(' ')[0] || 'Friend'}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={() => router.push('/group/invite' as any)}
            style={[styles.iconBtn, { backgroundColor: colors.gray100 }]}
          >
            <User size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => showToast('Notifications coming soon!', 'info')}
            style={[styles.iconBtn, { backgroundColor: colors.gray100 }]}
          >
            <Bell size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ── 1. Month Selector ── */}
        <MonthSelector
          month={selectedMonth.month}
          year={selectedMonth.year}
          onChange={setSelectedMonth}
        />

        {/* ── 2. Income + Expense Cards ── */}
        <SummaryCards
          income={summary?.income || 0}
          expenses={summary?.expenses || 0}
        />

        {/* ── 3. Balance Card ── */}
        <BalanceCard
          balance={summary?.balance || 0}
          bankName={defaultAccount?.name}
          bankBalance={defaultAccount?.balance}
        />

        {/* ── 4. Quick Actions ── */}
        <QuickActions />

        {/* ── 5. Separator ── */}
        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        {/* ── 6. Split the Bill section (existing BillSplit) ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Split the Bill</Text>
          {groups.length > 0 && (
            <View style={styles.billInfoRow}>
              <Text style={[styles.billBalanceLabel, { color: colors.textSecondary }]}>Bill Balance</Text>
              <Text style={[styles.billBalanceAmt, { color: colors.textPrimary }]}>
                {formatCurrency(Math.abs(analytics.owedToOthers), currency)}
              </Text>
            </View>
          )}

          {/* Quick Action Icons */}
          <View style={styles.quickActionsRow}>
            {[
              { icon: '🧾', label: 'Receipt', action: () => router.push('/expense/scan' as any) },
              { icon: '📋', label: 'Copy', action: () => {
                  Clipboard.setString('https://billsplit.example.com/download');
                  showToast('Share link copied to clipboard! 📋', 'success');
                } 
              },
              { icon: '🔗', label: 'Share', action: () => router.push('/group/invite' as any) },
              { icon: '➕', label: 'Add', action: () => router.push('/expense/add') },
            ].map((item, i) => (
              <Pressable key={i} onPress={item.action} style={styles.quickActionBtn}>
                <View style={[styles.quickActionCircle, { backgroundColor: colors.gray100 }]}>
                  <Text style={styles.quickActionEmoji}>{item.icon}</Text>
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Friends avatars row */}
          <View style={styles.friendsSection}>
            <Text style={[styles.friendsSectionLabel, { color: colors.textSecondary }]}>
              Your Friends
            </Text>
            <Text style={[styles.friendsSubLabel, { color: colors.textSecondary }]}>
              Choose friends to share the bill
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsScroll}>
              {allMembers.slice(0, 6).map((m, i) => (
                <View key={m.userId} style={styles.friendAvatar}>
                  <View style={[styles.friendAvatarCircle, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                    <Text style={styles.friendAvatarLetter}>{m.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.friendName, { color: colors.textSecondary }]} numberOfLines={1}>
                    {m.name.split(' ')[0]}
                  </Text>
                </View>
              ))}
              {allMembers.length === 0 && (
                <Text style={[styles.noFriendsText, { color: colors.textSecondary }]}>
                  Add people to a group first
                </Text>
              )}
            </ScrollView>
          </View>

          {/* Split In CTA */}
          <Pressable
            onPress={() => router.push('/expense/add')}
            style={[styles.splitInBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.splitInBtnText}>Split In</Text>
          </Pressable>
        </View>

        {/* ── 7. Monthly Budget Overview ── */}
        <BudgetOverview budgets={budgets} />

        {/* ── 8. Recent Transactions ── */}
        <RecentTransactions transactions={transactions} />

        {/* ── Streak News Banner ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable 
            onPress={() => showToast('Streak Rewards program is active! Keep adding bills to earn points.', 'success')}
            style={[styles.newsBanner, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}
          >
            <Text style={styles.newsEmoji}>🏆</Text>
            <View style={styles.newsTextCol}>
              <Text style={[styles.newsTitle, { color: '#92400E' }]}>Start your streak strong –</Text>
              <Text style={[styles.newsSubtitle, { color: '#B45309' }]}>your first reward is here!</Text>
            </View>
            <View style={[styles.newsBadge, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.newsBadgeText}>+100</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
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
    color: '#FFFFFF',
  },
  profileText: { marginLeft: 10 },
  greetLabel: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '600' },
  greetName: { fontSize: 17, fontFamily: 'SpaceGrotesk', fontWeight: '800' },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: { paddingBottom: 40 },

  // Separator
  separator: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 16,
  },

  // Section cards
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginBottom: 12,
  },

  // Split the Bill
  billInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  billBalanceLabel: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '600' },
  billBalanceAmt: { fontSize: 16, fontFamily: 'SpaceGrotesk', fontWeight: '800' },

  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  quickActionBtn: { alignItems: 'center', gap: 6 },
  quickActionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionEmoji: { fontSize: 22 },
  quickActionLabel: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '700' },

  friendsSection: { marginBottom: 16 },
  friendsSectionLabel: { fontSize: 13, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginBottom: 2 },
  friendsSubLabel: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600', marginBottom: 12 },
  friendsScroll: { flexDirection: 'row' },
  friendAvatar: { alignItems: 'center', marginRight: 14, width: 52 },
  friendAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  friendAvatarLetter: { fontSize: 16, fontFamily: 'SpaceGrotesk', fontWeight: '700', color: '#FFFFFF' },
  friendName: { fontSize: 10, fontFamily: 'Nunito', fontWeight: '700', textAlign: 'center' },
  noFriendsText: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '600', marginVertical: 8 },

  splitInBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitInBtnText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // News banner
  newsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  newsEmoji: { fontSize: 24 },
  newsTextCol: { flex: 1 },
  newsTitle: { fontSize: 12, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  newsSubtitle: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600' },
  newsBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  newsBadgeText: { fontSize: 11, fontFamily: 'SpaceGrotesk', fontWeight: '800', color: '#FFFFFF' },
});
