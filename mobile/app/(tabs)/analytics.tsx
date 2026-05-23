import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Lightbulb,
  BarChart2,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CategoryItem {
  id: string;
  amount: number;
  percentage: number;
}

interface GroupComparisonItem {
  groupId: string;
  groupName: string;
  balance: number;
}

const CATEGORY_META: Record<string, { emoji: string; color: string; label: string }> = {
  food:          { emoji: '🍕', color: '#F59E0B', label: 'Food & Dining' },
  travel:        { emoji: '✈️', color: '#3B82F6', label: 'Travel' },
  rent:          { emoji: '🏠', color: '#EC4899', label: 'Rent & Bills' },
  shopping:      { emoji: '🛍️', color: '#8B5CF6', label: 'Shopping' },
  party:         { emoji: '🎉', color: '#10B981', label: 'Entertainment' },
  utilities:     { emoji: '⚡', color: '#F59E0B', label: 'Utilities' },
  transport:     { emoji: '🚗', color: '#06B6D4', label: 'Transport' },
  health:        { emoji: '💊', color: '#EF4444', label: 'Health' },
  entertainment: { emoji: '🎬', color: '#8B5CF6', label: 'Fun' },
  other:         { emoji: '📦', color: '#6B7280', label: 'Other' },
};

// Bar chart data for months (mock visual, actual data from analytics)
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    totalSpent: 0.0,
    totalBalance: 0.0,
    owedToOthers: 0.0,
    owedToMe: 0.0,
    percentageChange: 0.0,
  });
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [groupComparisons, setGroupComparisons] = useState<GroupComparisonItem[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  const currency = user?.currency || 'INR';

  const fetchAnalytics = async () => {
    try {
      const [summaryRes, categoriesRes, groupsRes, insightsRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/categories'),
        api.get('/analytics/groups'),
        api.get('/analytics/insights'),
      ]);
      setSummary(summaryRes.data);
      setCategories(categoriesRes.data.breakdown || []);
      setGroupComparisons(groupsRes.data || []);
      setInsights(insightsRes.data.insights || []);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Compiling insights...
        </Text>
      </View>
    );
  }

  const isPositive = summary.percentageChange <= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Analytics</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Your spending overview</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >

        {/* ── Income Tracker Hero (matches mockup) ── */}
        <View style={[styles.incomeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.incomeTopRow}>
            <Text style={[styles.incomeTitle, { color: colors.textPrimary }]}>Income Tracker</Text>
            <View style={[
              styles.trendBadge,
              { backgroundColor: isPositive ? '#DCFCE7' : '#FEE2E2' },
            ]}>
              {isPositive
                ? <TrendingDown size={12} color="#16A34A" />
                : <TrendingUp size={12} color="#DC2626" />}
              <Text style={[styles.trendBadgeText, { color: isPositive ? '#16A34A' : '#DC2626' }]}>
                {isPositive ? '+' : ''}{Math.abs(summary.percentageChange).toFixed(0)}%
              </Text>
            </View>
          </View>

          {/* Big amount */}
          <Text style={[styles.incomeAmount, { color: colors.textPrimary }]}>
            {formatCurrency(summary.totalSpent, currency)}
          </Text>

          {/* Simple line chart area */}
          <View style={styles.lineChartArea}>
            {MONTH_LABELS.map((m, i) => {
              const heights = [30, 55, 40, 70, 50, 65];
              return (
                <View key={m} style={styles.lineChartCol}>
                  <View style={[styles.lineBar, { height: heights[i], backgroundColor: colors.primary }]} />
                  <Text style={[styles.lineLabel, { color: colors.textSecondary }]}>{m.charAt(0)}</Text>
                </View>
              );
            })}
          </View>

          {/* Two stat cols */}
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <View style={styles.statCol}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last Month</Text>
              <View style={styles.statValueRow}>
                <Text style={[styles.statPct, { color: '#EF4444' }]}>43%</Text>
                <BarChart2 size={14} color="#EF4444" style={{ marginLeft: 4 }} />
              </View>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last Quarter</Text>
              <View style={styles.statValueRow}>
                <Text style={[styles.statPct, { color: '#22C55E' }]}>15%</Text>
                <TrendingUp size={14} color="#22C55E" style={{ marginLeft: 4 }} />
              </View>
            </View>
          </View>
        </View>

        {/* ── Get a new card promo ── */}
        <Pressable style={[styles.promoCard, { backgroundColor: '#1C1C1E' }]}>
          <View>
            <Text style={styles.promoText}>Get a new card type</Text>
            <Text style={styles.promoSubText}>View More →</Text>
          </View>
          <Text style={styles.promoEmoji}>💳</Text>
        </Pressable>

        {/* ── AI Insights ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>AI Smart Insights</Text>
          </View>
          {insights.length === 0 ? (
            <Text style={[styles.noInsightsText, { color: colors.textSecondary }]}>
              Add expenses and settle bills to unlock personal AI insights!
            </Text>
          ) : (
            insights.map((insight, idx) => (
              <View key={idx} style={styles.insightRow}>
                <View style={[styles.insightDot, { backgroundColor: colors.primary }]}>
                  <Lightbulb size={10} color="#FFFFFF" />
                </View>
                <Text style={[styles.insightText, { color: colors.textPrimary }]}>{insight}</Text>
              </View>
            ))
          )}
        </View>

        {/* ── Category Distribution ── */}
        <Text style={[styles.sectionTitleStandalone, { color: colors.textPrimary }]}>Category Distribution</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {categories.length === 0 ? (
            <Text style={[styles.noInsightsText, { color: colors.textSecondary }]}>
              No category data yet. Add expenses to see your spending breakdown!
            </Text>
          ) : (
            categories.map((item) => {
              const meta = CATEGORY_META[item.id.toLowerCase()] || { emoji: '📦', color: '#6B7280', label: item.id };
              return (
                <View key={item.id} style={styles.catRow}>
                  <Text style={styles.catEmoji}>{meta.emoji}</Text>
                  <View style={styles.catInfoCol}>
                    <View style={styles.catTopRow}>
                      <Text style={[styles.catLabel, { color: colors.textPrimary }]}>{meta.label}</Text>
                      <Text style={[styles.catAmount, { color: colors.textPrimary }]}>
                        {formatCurrency(item.amount, currency)}
                      </Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.gray100 }]}>
                      <View style={[styles.progressFill, { width: `${Math.min(item.percentage, 100)}%`, backgroundColor: meta.color }]} />
                    </View>
                    <Text style={[styles.catPct, { color: colors.textSecondary }]}>{item.percentage.toFixed(0)}%</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Group Standings ── */}
        <Text style={[styles.sectionTitleStandalone, { color: colors.textPrimary }]}>Active Group Standings</Text>
        {groupComparisons.length === 0 ? (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.noInsightsText, { color: colors.textSecondary }]}>
              Join groups to see your per-group balances!
            </Text>
          </View>
        ) : (
          groupComparisons.map((g) => {
            const isOwed = g.balance >= 0;
            return (
              <View key={g.groupId} style={[styles.groupStandingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.groupStandingName, { color: colors.textPrimary }]}>{g.groupName}</Text>
                  <Text style={[styles.groupStandingStatus, { color: colors.textSecondary }]}>
                    {isOwed ? 'Settlement Asset' : 'Pending Settlement'}
                  </Text>
                </View>
                <Text style={[styles.groupStandingBalance, { color: isOwed ? colors.success : colors.danger }]}>
                  {isOwed ? '+' : ''}{formatCurrency(g.balance, currency)}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600', marginTop: 12 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontFamily: 'SpaceGrotesk', fontWeight: '800' },
  headerSubtitle: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600', marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  incomeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  incomeTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  incomeTitle: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  trendBadgeText: { fontSize: 12, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  incomeAmount: { fontSize: 30, fontFamily: 'SpaceGrotesk', fontWeight: '900', marginBottom: 16, letterSpacing: -0.5 },
  lineChartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 80, marginBottom: 16, gap: 8 },
  lineChartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  lineBar: { width: '100%', borderRadius: 4 },
  lineLabel: { fontSize: 10, fontFamily: 'Nunito', fontWeight: '600', marginTop: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: 14 },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32 },
  statLabel: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600', marginBottom: 4 },
  statValueRow: { flexDirection: 'row', alignItems: 'center' },
  statPct: { fontSize: 20, fontFamily: 'SpaceGrotesk', fontWeight: '800' },

  promoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoText: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  promoSubText: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '700', color: '#22C55E' },
  promoEmoji: { fontSize: 40 },

  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  sectionTitleStandalone: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginBottom: 10,
  },
  noInsightsText: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600', textAlign: 'center', lineHeight: 20 },

  insightRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  insightDot: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  insightText: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600', flex: 1, lineHeight: 20 },

  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  catEmoji: { fontSize: 24 },
  catInfoCol: { flex: 1 },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catLabel: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '700' },
  catAmount: { fontSize: 13, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 3 },
  catPct: { fontSize: 10, fontFamily: 'Nunito', fontWeight: '600' },

  groupStandingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  groupStandingName: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginBottom: 2 },
  groupStandingStatus: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600' },
  groupStandingBalance: { fontSize: 16, fontFamily: 'SpaceGrotesk', fontWeight: '800' },
});
