import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Camera,
  Send,
  CreditCard,
  Bell,
  User,
  Eye,
  EyeOff,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Share2,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useExpenseStore } from '../../store/expenseStore';
import { useGroupStore } from '../../store/groupStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get unique members across all groups for friends avatars
  const allMembers = groups.flatMap((g) => g.members || []).filter(
    (m, i, arr) => arr.findIndex((x) => x.userId === m.userId) === i && m.userId !== user?.id
  );

  const getCategoryEmoji = (cat: string) => {
    const map: Record<string, string> = {
      food: '🍕', travel: '✈️', rent: '🏠', shopping: '🛍️',
      party: '🎉', utilities: '⚡', transport: '🚗', health: '💊',
      entertainment: '🎬', other: '📦',
    };
    return map[cat?.toLowerCase()] || '📦';
  };

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
        {/* ── Balance Card (dark, like mockup) ── */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCardInner}>
            {/* Card top row */}
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.cardUserName}>{user?.name || 'User'}</Text>
                <Text style={styles.cardIdText}>ID: #16377A</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(34,197,94,0.2)' }]}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>

            {/* Balance */}
            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <View style={styles.balanceAmtRow}>
                  <Text style={styles.balanceAmount}>
                    {balanceVisible
                      ? formatCurrency(analytics.totalBalance, currency)
                      : '••••••'}
                  </Text>
                  <Pressable
                    onPress={() => setBalanceVisible(!balanceVisible)}
                    style={styles.eyeBtn}
                  >
                    {balanceVisible
                      ? <Eye size={16} color="rgba(255,255,255,0.7)" />
                      : <EyeOff size={16} color="rgba(255,255,255,0.7)" />}
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Card navigation row */}
            <View style={styles.cardNavRow}>
              <Pressable style={styles.cardNavArrow}>
                <Text style={styles.cardNavArrowText}>‹</Text>
              </Pressable>
              <Text style={styles.cardNavLabel}>All Cards</Text>
              <Pressable style={styles.cardNavArrow}>
                <Text style={styles.cardNavArrowText}>›</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Earning Dynamics ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Earning Dynamics</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Normal</Text>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6', marginLeft: 8 }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Actual</Text>
            </View>
          </View>

          {/* Simple bar chart */}
          <View style={styles.chartArea}>
            {['Jan', 'Feb', 'Mar', 'Apr'].map((month, i) => {
              const normalHeights = [40, 60, 35, 55];
              const actualHeights = [50, 45, 65, 40];
              return (
                <View key={month} style={styles.chartGroup}>
                  <View style={styles.barPair}>
                    <View style={[styles.bar, { height: normalHeights[i], backgroundColor: '#22C55E' }]} />
                    <View style={[styles.bar, { height: actualHeights[i], backgroundColor: '#3B82F6' }]} />
                  </View>
                  <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>{month}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Split the Bill section (Quick Actions) ── */}
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
              { icon: '📋', label: 'Copy', action: () => showToast('Link copied!', 'success') },
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

        {/* ── Latest News / Recent Transactions ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
            <Pressable>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See More</Text>
            </Pressable>
          </View>

          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No transactions yet. Add your first expense!
              </Text>
            </View>
          ) : (
            expenses.slice(0, 5).map((expense) => {
              const mySplit = expense.splits?.find((s: any) => s.userId === user?.id);
              const isOwed = expense.paidById === user?.id;
              const netAmount = mySplit
                ? isOwed
                  ? expense.amount - mySplit.amount
                  : -mySplit.amount
                : 0;

              return (
                <View key={expense.id} style={[styles.txRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.txIconCircle, { backgroundColor: colors.gray100 }]}>
                    <Text style={styles.txEmoji}>{getCategoryEmoji(expense.category)}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {expense.title}
                    </Text>
                    <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                      {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: netAmount >= 0 ? colors.success : colors.danger }]}>
                    {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount, expense.currency || currency)}
                  </Text>
                </View>
              );
            })
          )}

          {/* Latest news banner */}
          <Pressable style={[styles.newsBanner, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
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

  // Balance card
  balanceCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceCardInner: { padding: 24 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardUserName: { fontSize: 16, fontFamily: 'SpaceGrotesk', fontWeight: '700', color: '#FFFFFF' },
  cardIdText: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 6 },
  statusText: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '700', color: '#22C55E' },
  balanceRow: { marginBottom: 20 },
  balanceLabel: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  balanceAmtRow: { flexDirection: 'row', alignItems: 'center' },
  balanceAmount: { fontSize: 32, fontFamily: 'SpaceGrotesk', fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  eyeBtn: { marginLeft: 12, padding: 4 },
  cardNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  cardNavArrow: { padding: 4 },
  cardNavArrowText: { fontSize: 20, color: 'rgba(255,255,255,0.6)', fontFamily: 'SpaceGrotesk' },
  cardNavLabel: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '700', color: 'rgba(255,255,255,0.8)' },

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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  seeAllText: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '700' },

  // Earning dynamics chart
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600', marginLeft: 4 },
  chartArea: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 80 },
  chartGroup: { alignItems: 'center', gap: 6 },
  barPair: { flexDirection: 'row', gap: 4, alignItems: 'flex-end' },
  bar: { width: 16, borderRadius: 4 },
  chartLabel: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600' },

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

  // Transactions
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600', textAlign: 'center' },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  txIconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txEmoji: { fontSize: 18 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700', marginBottom: 2 },
  txDate: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600' },
  txAmount: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700' },

  // News banner
  newsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
    gap: 10,
  },
  newsEmoji: { fontSize: 24 },
  newsTextCol: { flex: 1 },
  newsTitle: { fontSize: 12, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  newsSubtitle: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600' },
  newsBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  newsBadgeText: { fontSize: 11, fontFamily: 'SpaceGrotesk', fontWeight: '800', color: '#FFFFFF' },
});
