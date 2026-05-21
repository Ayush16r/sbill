import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Utensils, 
  Plane, 
  Home, 
  ShoppingBag, 
  Wine, 
  HelpCircle, 
  PieChart, 
  Lightbulb, 
  DollarSign 
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';

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

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
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

  const fetchAnalytics = async () => {
    try {
      const [summaryRes, categoriesRes, groupsRes, insightsRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/categories'),
        api.get('/analytics/groups'),
        api.get('/analytics/insights'),
      ]);

      setSummary(summaryRes.data);
      setCategories(categoriesRes.data.breakdown);
      setGroupComparisons(groupsRes.data);
      setInsights(insightsRes.data.insights);
    } catch (err: any) {
      console.error('Fetch analytics error:', err);
      showToast(err.message || 'Failed to load analytics data.', 'error');
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

  const getCategoryMeta = (catId: string) => {
    switch (catId.toLowerCase()) {
      case 'food':
        return { icon: Utensils, color: '#F59E0B', label: 'Food & Dining' };
      case 'travel':
        return { icon: Plane, color: '#3B82F6', label: 'Travel & Transport' };
      case 'rent':
        return { icon: Home, color: '#EC4899', label: 'Rent & Bills' };
      case 'shopping':
        return { icon: ShoppingBag, color: '#8B5CF6', label: 'Shopping' };
      case 'party':
        return { icon: Wine, color: '#10B981', label: 'Entertainment' };
      default:
        return { icon: HelpCircle, color: '#6B7280', label: 'Other' };
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito', marginTop: 12 }}>
          Compiling monthly split insights...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Spending Analytics</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Your split dynamics</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Total Spent Hero Box */}
        <Card variant="glass" padding={20} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Total Spent this Month</Text>
              <Text style={[styles.heroValue, { color: colors.textPrimary }]}>
                {formatCurrency(summary.totalSpent, user?.currency || 'USD')}
              </Text>
            </View>
            <View style={[
              styles.trendBadge, 
              { backgroundColor: summary.percentageChange <= 0 ? `${colors.success}1A` : `${colors.danger}1A` }
            ]}>
              {summary.percentageChange <= 0 ? (
                <TrendingDown size={14} color={colors.success} style={{ marginRight: 4 }} />
              ) : (
                <TrendingUp size={14} color={colors.danger} style={{ marginRight: 4 }} />
              )}
              <Text style={[
                styles.trendText, 
                { color: summary.percentageChange <= 0 ? colors.success : colors.danger }
              ]}>
                {Math.abs(summary.percentageChange)}%
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Quick Net Status Tracker */}
          <View style={styles.balanceStatusRow}>
            <PieChart size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              Net Dynamic Balance: {' '}
              <Text style={{ color: summary.totalBalance >= 0 ? colors.success : colors.danger, fontWeight: '700' }}>
                {formatCurrency(summary.totalBalance, user?.currency || 'USD')}
              </Text>
            </Text>
          </View>
        </Card>

        {/* AI Advisor Panel */}
        <View style={styles.sectionHeader}>
          <Sparkles size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>AI Smart Insights</Text>
        </View>

        <Card variant="glow" padding={18} style={styles.insightsCard}>
          {insights.length === 0 ? (
            <Text style={[styles.noInsightsText, { color: colors.textSecondary }]}>
              No insights available yet. Spend and settle bills to train your personal AI Advisor!
            </Text>
          ) : (
            insights.map((insight, idx) => (
              <View key={idx} style={styles.insightItem}>
                <View style={[styles.insightBulletCircle, { backgroundColor: colors.primary }]}>
                  <Lightbulb size={12} color={colors.primaryDeep} />
                </View>
                <Text style={[styles.insightText, { color: colors.textPrimary }]}>{insight}</Text>
              </View>
            ))
          )}
        </Card>

        {/* Category breakdown progress grids */}
        <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>Category Distribution</Text>
        
        {categories.length === 0 ? (
          <Card variant="glass" padding={24} style={styles.emptyCard}>
            <Text style={[styles.emptyEmoji]}>📊</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No categories mapped yet. Add some expenses with categories like "food", "rent", or "travel".
            </Text>
          </Card>
        ) : (
          <Card variant="glass" padding={16} style={styles.categoriesCard}>
            {categories.map((item) => {
              const meta = getCategoryMeta(item.id);
              const IconComp = meta.icon;
              return (
                <View key={item.id} style={styles.categoryRow}>
                  {/* Icon Column */}
                  <View style={[styles.catIconCircle, { backgroundColor: `${meta.color}1E` }]}>
                    <IconComp size={16} color={meta.color} />
                  </View>
                  
                  {/* Progress Column */}
                  <View style={styles.progressCol}>
                    <View style={styles.progressHeader}>
                      <Text style={[styles.catLabel, { color: colors.textPrimary }]}>{meta.label}</Text>
                      <Text style={[styles.catAmount, { color: colors.textPrimary }]}>
                        {formatCurrency(item.amount, user?.currency || 'USD')}
                      </Text>
                    </View>
                    
                    {/* Glowing Track */}
                    <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceElevated }]}>
                      <View style={[
                        styles.progressBarFill, 
                        { 
                          width: `${item.percentage}%`, 
                          backgroundColor: meta.color,
                          shadowColor: meta.color,
                        }
                      ]} />
                    </View>
                    <Text style={[styles.catPercent, { color: colors.textSecondary }]}>
                      {item.percentage}% of dynamic spending
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {/* Peer Debts Comparison Matrix */}
        <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>Active Group Standings</Text>

        {groupComparisons.length === 0 ? (
          <Card variant="glass" padding={20} style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              You are not a member of any active groups yet. Create a group to split peer balances!
            </Text>
          </Card>
        ) : (
          groupComparisons.map((g) => {
            const isOwed = g.balance >= 0;
            return (
              <Card key={g.groupId} variant="glass" padding={14} style={styles.groupCard}>
                <View style={styles.groupRow}>
                  <View style={styles.groupTextCol}>
                    <Text style={[styles.groupNameText, { color: colors.textPrimary }]}>{g.groupName}</Text>
                    <Text style={[styles.groupStandingsLabel, { color: colors.textSecondary }]}>
                      {isOwed ? 'Settlement Asset' : 'Pending Settlement'}
                    </Text>
                  </View>
                  <View style={styles.groupBalanceCol}>
                    <Text style={[
                      styles.groupBalanceText, 
                      { color: isOwed ? colors.success : colors.danger }
                    ]}>
                      {isOwed ? '+' : ''}{formatCurrency(g.balance, user?.currency || 'USD')}
                    </Text>
                  </View>
                </View>
              </Card>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroCard: {
    marginBottom: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 28,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
    opacity: 0.1,
  },
  balanceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  insightsCard: {
    marginBottom: 24,
  },
  noInsightsText: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  insightBulletCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  insightText: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  sectionTitleText: {
    fontSize: 15,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  emptyCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 28,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  categoriesCard: {
    marginBottom: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 10,
  },
  catIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  progressCol: {
    flex: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catLabel: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '700',
  },
  catAmount: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  catPercent: {
    fontSize: 9,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginTop: 4,
  },
  groupCard: {
    marginVertical: 4,
  },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupTextCol: {
    flex: 1,
  },
  groupNameText: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  groupStandingsLabel: {
    fontSize: 10,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginTop: 2,
  },
  groupBalanceCol: {
    alignItems: 'flex-end',
  },
  groupBalanceText: {
    fontSize: 15,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
  },
});
