import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, RefreshControl, Share, Clipboard as RNClipboard } from 'react-native';
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
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

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
                  RNClipboard.setString(activeGroup.inviteCode);
                  showToast('Invite code copied to clipboard! 📋', 'success');
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
                onPress={() => setSelectedExpense(expense)}
              />
            );
          })
        )}
      </ScrollView>

      {/* Expense Detail Overlay */}
      {selectedExpense && (
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setSelectedExpense(null)}
        >
          <Pressable 
            style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Expense Details</Text>
              <Pressable onPress={() => setSelectedExpense(null)} style={styles.closeBtn}>
                <Text style={{ color: colors.primary, fontFamily: 'SpaceGrotesk', fontWeight: '700' }}>Close</Text>
              </Pressable>
            </View>

            <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>{selectedExpense.title}</Text>
            <Text style={[styles.detailAmount, { color: colors.primary }]}>{formatCurrency(selectedExpense.amount)}</Text>
            <Text style={[styles.detailMeta, { color: colors.textSecondary }]}>
              Paid by {selectedExpense.paidById === user?.id ? 'You' : selectedExpense.paidBy?.name || 'Member'} on{' '}
              {new Date(selectedExpense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <Text style={[styles.splitBreakdownTitle, { color: colors.textPrimary }]}>Split Breakdown</Text>
            <ScrollView style={{ maxHeight: 180 }}>
              {selectedExpense.splits.map((split: any) => (
                <View key={split.id} style={styles.splitRow}>
                  <Text style={[styles.splitMemberName, { color: colors.textPrimary }]}>
                    {split.userId === user?.id ? 'You' : split.user?.name || 'Member'}
                  </Text>
                  <Text style={[styles.splitMemberShare, { color: colors.textSecondary }]}>
                    {formatCurrency(split.amount)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      )}
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  detailTitle: {
    fontSize: 22,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginBottom: 4,
  },
  detailAmount: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    marginBottom: 8,
  },
  detailMeta: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
    opacity: 0.1,
  },
  splitBreakdownTitle: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginBottom: 12,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  splitMemberName: {
    fontSize: 13,
    fontFamily: 'Nunito',
    fontWeight: '700',
  },
  splitMemberShare: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
});
