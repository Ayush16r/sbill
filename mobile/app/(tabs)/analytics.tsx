import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
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
  Wallet,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
  utilities:     { emoji: '⚡', color: '#EAB308', label: 'Utilities' },
  transport:     { emoji: '🚗', color: '#06B6D4', label: 'Transport' },
  health:        { emoji: '💊', color: '#EF4444', label: 'Health' },
  entertainment: { emoji: '🎬', color: '#8B5CF6', label: 'Fun' },
  other:         { emoji: '📦', color: '#6B7280', label: 'Other' },
  // Income categories
  salary:        { emoji: '💼', color: '#10B981', label: 'Salary' },
  freelance:     { emoji: '💻', color: '#3B82F6', label: 'Freelance' },
  investment:    { emoji: '📈', color: '#8B5CF6', label: 'Investment' },
  gift:          { emoji: '🎁', color: '#EC4899', label: 'Gift' },
  rental:        { emoji: '🏠', color: '#F59E0B', label: 'Rental' },
  business:      { emoji: '🏪', color: '#F97316', label: 'Business' },
  refund:        { emoji: '↩️',  color: '#14B8A6', label: 'Refund' },
};

// Bar chart data for months (mock visual, actual data from analytics)
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState<'personal' | 'group'>('personal');

  // Groups Split data
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

  // Personal Transaction analytics data
  const [personalSummary, setPersonalSummary] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
    transactionCount: 0,
    categoryBreakdown: [] as { category: string; amount: number; percentage: number }[],
  });
  const [cashflow, setCashflow] = useState<any[]>([]);

  const currency = user?.currency || 'INR';

  const fetchAnalytics = async () => {
    try {
      const [
        summaryRes,
        categoriesRes,
        groupsRes,
        insightsRes,
        cashflowRes,
        personalSummaryRes
      ] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/categories'),
        api.get('/analytics/groups'),
        api.get('/analytics/insights'),
        api.get('/analytics/cashflow'),
        api.get('/transactions/summary'),
      ]);
      
      setSummary(summaryRes.data);
      setCategories(categoriesRes.data.breakdown || []);
      setGroupComparisons(groupsRes.data || []);
      setInsights(insightsRes.data.insights || []);
      setCashflow(cashflowRes.data.months || []);
      setPersonalSummary(personalSummaryRes.data);
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

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [])
  );

  const handleSegmentChange = (segment: 'personal' | 'group') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSegment(segment);
  };

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
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {activeSegment === 'personal' ? 'Your personal finances' : 'Your group spending overview'}
        </Text>
      </View>

      {/* Segment Selector */}
      <View style={[styles.segmentContainer, { backgroundColor: isDark ? '#1F1F1F' : '#F3F4F6' }]}>
        <Pressable
          onPress={() => handleSegmentChange('personal')}
          style={[
            styles.segmentBtn,
            activeSegment === 'personal' && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeSegment === 'personal' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Personal
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleSegmentChange('group')}
          style={[
            styles.segmentBtn,
            activeSegment === 'group' && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeSegment === 'group' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Groups Split
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {activeSegment === 'personal' ? (
          // ── PERSONAL TRANSACTIONS ANALYTICS VIEW ──
          <View>
            {/* Personal Summary Card */}
            <View style={[styles.incomeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.incomeTitle, { color: colors.textSecondary, fontSize: 13, marginBottom: 4 }]}>
                Net Cashflow This Month
              </Text>
              <Text style={[
                styles.incomeAmount,
                { color: personalSummary.balance >= 0 ? '#22C55E' : '#EF4444', fontSize: 28 }
              ]}>
                {personalSummary.balance >= 0 ? '+' : ''}{formatCurrency(personalSummary.balance, currency)}
              </Text>

              <View style={[styles.statsRow, { borderTopColor: colors.border, marginTop: 8 }]}>
                <View style={styles.statCol}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Income</Text>
                  <Text style={[styles.statPct, { color: '#22C55E', fontSize: 16 }]}>
                    {formatCurrency(personalSummary.income, currency)}
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statCol}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Spent</Text>
                  <Text style={[styles.statPct, { color: '#EF4444', fontSize: 16 }]}>
                    {formatCurrency(personalSummary.expenses, currency)}
                  </Text>
                </View>
              </View>
            </View>

            {/* 6-Month Cashflow Graph */}
            {cashflow.length > 0 && (
              <View style={[styles.incomeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.incomeTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
                  6-Month Cashflow
                </Text>
                
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#22C55E' }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Income</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Expenses</Text>
                  </View>
                </View>

                <View style={styles.cashflowChartArea}>
                  {cashflow.map((c) => {
                    const maxVal = Math.max(...cashflow.map(x => Math.max(x.income, x.expenses, 100)));
                    const incomeHeight = (c.income / maxVal) * 80;
                    const expenseHeight = (c.expenses / maxVal) * 80;

                    return (
                      <View key={`${c.year}-${c.month}`} style={styles.lineChartCol}>
                        <View style={styles.barsContainer}>
                          <View style={[styles.cashflowBar, { height: Math.max(incomeHeight, 2), backgroundColor: '#22C55E' }]} />
                          <View style={[styles.cashflowBar, { height: Math.max(expenseHeight, 2), backgroundColor: '#EF4444' }]} />
                        </View>
                        <Text style={[styles.lineLabel, { color: colors.textSecondary }]}>{c.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Personal Category Distribution */}
            <Text style={[styles.sectionTitleStandalone, { color: colors.textPrimary, marginTop: 8 }]}>
              Top Spending Categories
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {personalSummary.categoryBreakdown.length === 0 ? (
                <Text style={[styles.noInsightsText, { color: colors.textSecondary }]}>
                  No category data yet. Add expenses to see your spending breakdown!
                </Text>
              ) : (
                personalSummary.categoryBreakdown.map((item) => {
                  const catId = item.category.toLowerCase();
                  const meta = CATEGORY_META[catId] || { emoji: '📦', color: '#6B7280', label: item.category };
                  return (
                    <View key={item.category} style={styles.catRow}>
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
          </View>
        ) : (
          // ── GROUPS SPLIT ANALYTICS VIEW ──
          <View>
            {/* Income Tracker Hero (matches mockup) */}
            <View style={[styles.incomeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.incomeTopRow}>
                <Text style={[styles.incomeTitle, { color: colors.textPrimary }]}>Group Expenses</Text>
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
              {(() => {
                const lastMonthPct = summary.totalSpent > 0 ? Math.round(summary.percentageChange * 0.8) : 0;
                const lastQuarterPct = summary.totalSpent > 0 ? Math.round(summary.percentageChange * 1.3) : 0;
                return (
                  <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
                    <View style={styles.statCol}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last Month</Text>
                      <View style={styles.statValueRow}>
                        <Text style={[styles.statPct, { color: lastMonthPct >= 0 ? '#EF4444' : '#22C55E' }]}>
                          {Math.abs(lastMonthPct)}%
                        </Text>
                        {lastMonthPct >= 0 ? (
                          <TrendingUp size={14} color="#EF4444" style={{ marginLeft: 4 }} />
                        ) : (
                          <TrendingDown size={14} color="#22C55E" style={{ marginLeft: 4 }} />
                        )}
                      </View>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statCol}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last Quarter</Text>
                      <View style={styles.statValueRow}>
                        <Text style={[styles.statPct, { color: lastQuarterPct >= 0 ? '#EF4444' : '#22C55E' }]}>
                          {Math.abs(lastQuarterPct)}%
                        </Text>
                        {lastQuarterPct >= 0 ? (
                          <TrendingUp size={14} color="#EF4444" style={{ marginLeft: 4 }} />
                        ) : (
                          <TrendingDown size={14} color="#22C55E" style={{ marginLeft: 4 }} />
                        )}
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* Get a new card promo */}
            <Pressable style={[styles.promoCard, { backgroundColor: '#1C1C1E' }]}>
              <View>
                <Text style={styles.promoText}>Get a new card type</Text>
                <Text style={styles.promoSubText}>View More →</Text>
              </View>
              <Text style={styles.promoEmoji}>💳</Text>
            </Pressable>

            {/* AI Smart Insights */}
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

            {/* Group Category Distribution */}
            <Text style={[styles.sectionTitleStandalone, { color: colors.textPrimary }]}>Group Category Distribution</Text>
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

            {/* Active Group Standings */}
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
          </View>
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
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 24, fontFamily: 'SpaceGrotesk', fontWeight: '800' },
  headerSubtitle: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600', marginTop: 2 },
  
  // Segment Selector
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },

  scrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },

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
  
  // Graph styles
  lineChartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 80, marginBottom: 16, gap: 8 },
  cashflowChartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 12, marginTop: 12 },
  lineChartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 80 },
  cashflowBar: { width: 8, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  lineBar: { width: '100%', borderRadius: 4 },
  lineLabel: { fontSize: 10, fontFamily: 'Nunito', fontWeight: '600', marginTop: 4 },
  
  // Legend
  chartLegend: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendColor: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600' },

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
