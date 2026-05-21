import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, ShieldCheck, Send } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';

interface TransferItem {
  from: string;
  fromName: string;
  fromAvatar?: string | null;
  to: string;
  toName: string;
  toAvatar?: string | null;
  amount: number;
}

export default function SettleGroupScreen() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  
  const user = useAuthStore((state) => state.user);
  const groups = useGroupStore((state) => state.groups);
  const setGroups = useGroupStore((state) => state.setGroups);
  const showToast = useUIStore((state) => state.showToast);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>((groupId as string) || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settlementPlan, setSettlementPlan] = useState<TransferItem[]>([]);
  const [memberBalances, setMemberBalances] = useState<any[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);

  const currentGroup = groups.find(g => g.id === selectedGroupId) || null;

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (err: any) {
      console.error('Fetch groups error:', err);
    }
  };

  const fetchSettlementPlan = async (id: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/groups/${id}/balances`);
      setSettlementPlan(response.data.settlementPlan);
      setMemberBalances(response.data.memberBalances);
    } catch (err: any) {
      showToast(err.message || 'Failed to load settlement plan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchSettlementPlan(selectedGroupId);
    } else {
      setLoading(false);
    }
  }, [selectedGroupId]);

  const onRefresh = async () => {
    if (!selectedGroupId) return;
    setRefreshing(true);
    await fetchSettlementPlan(selectedGroupId);
    setRefreshing(false);
  };

  const handleSettleTransfer = async (transfer: TransferItem) => {
    if (!selectedGroupId) return;
    setPayingId(`${transfer.from}_${transfer.to}`);
    try {
      const body = {
        receiverId: transfer.to,
        amount: transfer.amount,
        currency: user?.currency || 'INR',
        note: `Settled tab in "${currentGroup?.name || 'group'}"`,
        groupId: selectedGroupId,
        method: 'CARD',
      };

      await api.post('/payments', body);
      showToast(`Settled ${formatCurrency(transfer.amount, user?.currency || 'INR')} with ${transfer.toName}!`, 'success');
      
      // Navigate to payment success screen
      router.replace({
        pathname: '/payment/success',
        params: {
          amount: transfer.amount.toString(),
          toName: transfer.toName,
          groupName: currentGroup?.name || '',
          groupId: selectedGroupId,
        },
      });
    } catch (err: any) {
      showToast(err.message || 'Payment execution failed.', 'error');
    } finally {
      setPayingId(null);
    }
  };

  if (!selectedGroupId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header bar */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerTitleCol}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settle Up</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Select a group to settle</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {groups.length === 0 ? (
            <Card variant="glass" padding={24} style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🤝</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                You aren't in any split groups yet.
              </Text>
            </Card>
          ) : (
            groups.map((group) => {
              const balanceColor = group.userBalance > 0 
                ? colors.success 
                : group.userBalance < 0 
                  ? colors.danger 
                  : colors.gray600;

              return (
                <Pressable
                  key={group.id}
                  onPress={() => setSelectedGroupId(group.id)}
                >
                  <Card variant="glass" padding={16} style={styles.groupCard}>
                    <View style={styles.groupMetaRow}>
                      <View style={[styles.groupAvatarCircle, { backgroundColor: colors.surfaceElevated }]}>
                        <Text style={styles.groupAvatarEmoji}>
                          {group.category === 'TRAVEL' ? '✈️' : group.category === 'HOME' ? '🏠' : group.category === 'FRIENDS' ? '🎉' : '📦'}
                        </Text>
                      </View>
                      
                      <View style={styles.groupDetails}>
                        <Text style={[styles.groupName, { color: colors.textPrimary }]}>
                          {group.name}
                        </Text>
                        <Text style={[styles.groupMembersText, { color: colors.textSecondary }]}>
                          {group.membersCount} active members
                        </Text>
                      </View>
                    </View>

                    <View style={styles.balanceStatusBlock}>
                      <Text style={[styles.balanceAmount, { color: balanceColor }]}>
                        {group.userBalance === 0 
                          ? 'settled' 
                          : formatCurrency(Math.abs(group.userBalance), user?.currency || 'INR')}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito', marginTop: 12 }}>Calculating optimized debts...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => {
          if (!groupId) {
            setSelectedGroupId(null);
          } else {
            router.back();
          }
        }} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleCol}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Optimize Settlements</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{currentGroup?.name}</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Card variant="filled" padding={16} style={styles.tipCard}>
          <ShieldCheck size={18} color={colors.primary} style={{ marginRight: 10 }} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            BillSplit minimized total transfers using debt graph simplification.
          </Text>
        </Card>

        {/* Change Group button (only if not opened directly from group detail screen) */}
        {!groupId && (
          <Button
            title="Change Group"
            variant="ghost"
            onPress={() => setSelectedGroupId(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Settle up checklist</Text>
        
        {settlementPlan.length === 0 ? (
          <Card variant="glass" padding={24} style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              All balances are perfectly settled! No debts are remaining in this group.
            </Text>
          </Card>
        ) : (
          settlementPlan.map((tx, idx) => {
            const isPayer = tx.from === user?.id;
            const key = `${tx.from}_${tx.to}`;
            const isPaying = payingId === key;

            return (
              <Card key={idx} variant={isPayer ? 'glow' : 'glass'} padding={16} style={styles.transferCard}>
                <View style={styles.transferRow}>
                  {/* Sender User */}
                  <View style={styles.userCol}>
                    <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}>
                      <Text style={styles.avatarLetter}>{tx.fromName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {isPayer ? 'You' : tx.fromName.split(' ')[0]}
                    </Text>
                  </View>

                  {/* Flow Arrow */}
                  <View style={styles.arrowCol}>
                    <Text style={[styles.transferAmountText, { color: isPayer ? colors.danger : colors.textPrimary }]}>
                      {formatCurrency(tx.amount, user?.currency || 'INR')}
                    </Text>
                    <ArrowRight size={16} color={colors.gray400} />
                  </View>

                  {/* Receiver User */}
                  <View style={styles.userCol}>
                    <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}>
                      <Text style={styles.avatarLetter}>{tx.toName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {tx.to === user?.id ? 'You' : tx.toName.split(' ')[0]}
                    </Text>
                  </View>
                </View>

                {/* Settle up action triggers */}
                {isPayer && (
                  <View style={styles.actionRow}>
                    <Button
                      title={isPaying ? 'Processing...' : 'Settle Now'}
                      loading={isPaying}
                      onPress={() => handleSettleTransfer(tx)}
                      style={styles.settleBtn}
                    />
                  </View>
                )}
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
  headerTitleCol: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tipText: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: 24,
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
  transferCard: {
    marginVertical: 6,
  },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userCol: {
    alignItems: 'center',
    width: '28%',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarLetter: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  userName: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '700',
    textAlign: 'center',
  },
  arrowCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferAmountText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  actionRow: {
    marginTop: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  settleBtn: {
    height: 40,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  groupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarEmoji: {
    fontSize: 20,
  },
  groupDetails: {
    marginLeft: 12,
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginBottom: 2,
  },
  groupMembersText: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
  },
  balanceStatusBlock: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
});
