import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, RefreshControl, Share } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, Send, Share2, Clipboard, ShieldCheck } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore, GroupInfo } from '../../store/groupStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { ExpenseCard } from '../../components/expense/ExpenseCard';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const user = useAuthStore((state) => state.user);
  const activeGroup = useGroupStore((state) => state.activeGroup);
  const setActiveGroup = useGroupStore((state) => state.setActiveGroup);
  const showToast = useUIStore((state) => state.showToast);

  const [refreshing, setRefreshing] = useState(false);

  const fetchGroupDetails = async () => {
    try {
      const response = await api.get(`/groups/${id}`);
      setActiveGroup(response.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load group details.', 'error');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroupDetails();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchGroupDetails();
      }
      return () => setActiveGroup(null);
    }, [id])
  );

  const handleShareInvite = async () => {
    if (!activeGroup) return;
    try {
      await Share.share({
        message: `Join our split group "${activeGroup.name}" on BillSplit! Enter invite code: ${activeGroup.inviteCode}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (!activeGroup) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito' }}>Loading splits...</Text>
      </View>
    );
  }

  // Calculate overall balance representation
  const balanceColor = activeGroup.userBalance > 0 
    ? colors.success 
    : activeGroup.userBalance < 0 
      ? colors.danger 
      : colors.gray600;

  const balanceLabelText = activeGroup.userBalance > 0
    ? 'you are owed in this group'
    : activeGroup.userBalance < 0
      ? 'you owe in this group'
      : 'you are fully settled';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Custom Bar Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {activeGroup.name}
          </Text>
        </View>

        <Pressable onPress={handleShareInvite} style={styles.shareBtn}>
          <Share2 size={20} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Dynamic balances card block */}
        <Card variant="glass" padding={20} style={styles.statusCard}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
            {balanceLabelText}
          </Text>
          <Text style={[styles.statusAmount, { color: balanceColor }]}>
            {activeGroup.userBalance === 0 
              ? 'settled' 
              : formatCurrency(Math.abs(activeGroup.userBalance), user?.currency || 'INR')}
          </Text>

          <View style={styles.metaSummary}>
            <View style={styles.metaCol}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Total Spent</Text>
              <Text style={[styles.metaVal, { color: colors.textPrimary }]}>
                {formatCurrency(activeGroup.totalExpense, user?.currency || 'INR')}
              </Text>
            </View>
            <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metaCol}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Invite Code</Text>
              <Pressable 
                onPress={() => {
                  showToast('Code copied to clipboard!', 'success');
                }}
                style={styles.codeRow}
              >
                <Text style={[styles.metaVal, { color: colors.primary, fontFamily: 'SpaceGrotesk' }]}>
                  {activeGroup.inviteCode}
                </Text>
                <Clipboard size={12} color={colors.primary} style={{ marginLeft: 4 }} />
              </Pressable>
            </View>
          </View>
        </Card>

        <View style={styles.btnRow}>
          <Pressable 
            onPress={() => router.push(`/expense/add?groupId=${activeGroup.id}`)}
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
          >
            <Plus size={18} color='#FFFFFF' style={{ marginRight: 6 }} />
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Add Expense</Text>
          </Pressable>

          <Pressable 
            onPress={() => router.push(`/group/settle?groupId=${activeGroup.id}`)}
            style={[styles.actionButton, { backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.border }]}
          >
            <Send size={16} color={colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Settle Up</Text>
          </Pressable>
        </View>

        {/* Members breakdown bar */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Group Members</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersScroll}>
          {activeGroup.members.map((m) => (
            <View key={m.userId} style={styles.memberAvatarWrapper}>
              <View style={[styles.memberAvatarCircle, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.memberEmoji]}>
                  {m.name.charAt(0).toUpperCase()}
                </Text>
                {m.role === 'ADMIN' && (
                  <View style={[styles.adminBadge, { backgroundColor: colors.primary }]}>
                    <ShieldCheck size={8} color={colors.primaryDeep} />
                  </View>
                )}
              </View>
              <Text style={[styles.memberName, { color: colors.textPrimary }]} numberOfLines={1}>
                {m.userId === user?.id ? 'You' : m.name.split(' ')[0]}
              </Text>
              <Text style={[styles.memberDebtText, { color: m.balance > 0 ? colors.success : m.balance < 0 ? colors.danger : colors.gray600 }]}>
                {m.balance === 0 ? 'settled' : m.balance > 0 ? `+${m.balance.toFixed(0)}` : `${m.balance.toFixed(0)}`}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Expenses timeline */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 10 }]}>Expenses timeline</Text>
        {!activeGroup.expenses || activeGroup.expenses.length === 0 ? (
          <Card variant="glass" padding={24} style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No group expenses yet. Record one using the button above!
            </Text>
          </Card>
        ) : (
          activeGroup.expenses.map((expense) => {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  shareBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  statusCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusAmount: {
    fontSize: 30,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    marginVertical: 8,
  },
  metaSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    paddingTop: 14,
    marginTop: 10,
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginBottom: 2,
  },
  metaVal: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    height: 24,
    opacity: 0.2,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  actionButton: {
    width: '48%',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginHorizontal: 24,
    marginBottom: 12,
  },
  membersScroll: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  memberAvatarWrapper: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 60,
  },
  memberAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberEmoji: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  adminBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '700',
    textAlign: 'center',
  },
  memberDebtText: {
    fontSize: 9,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginTop: 2,
  },
  emptyCard: {
    marginHorizontal: 24,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 28,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    textAlign: 'center',
  },
});
