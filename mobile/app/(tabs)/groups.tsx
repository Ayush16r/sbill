import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, MoreVertical, ChevronRight } from 'lucide-react-native';
import { useGroupStore } from '../../store/groupStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';

const AVATAR_COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444'];

const getCategoryEmoji = (cat: string) => {
  const map: Record<string, string> = { TRAVEL: '✈️', HOME: '🏠', FRIENDS: '🎉', GENERAL: '📦' };
  return map[cat] || '📦';
};

export default function GroupsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);

  const groups = useGroupStore((state) => state.groups);
  const setGroups = useGroupStore((state) => state.setGroups);
  const addGroup = useGroupStore((state) => state.addGroup);
  const showToast = useUIStore((state) => state.showToast);

  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCat, setNewGroupCat] = useState('GENERAL');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const currency = user?.currency || 'INR';

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (err: any) {
      console.error('Fetch groups error:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      showToast('Group name is required.', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/groups', {
        name: newGroupName.trim(),
        description: newGroupDesc,
        category: newGroupCat,
      });
      addGroup(response.data);
      showToast('Group created successfully!', 'success');
      setCreateModalVisible(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupCat('GENERAL');
      fetchGroups();
    } catch (err: any) {
      showToast(err.message || 'Failed to create group.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      showToast('Invite code is required.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/groups/join', { code: joinCode.trim().toUpperCase() });
      showToast('Joined group successfully!', 'success');
      setJoinModalVisible(false);
      setJoinCode('');
      fetchGroups();
    } catch (err: any) {
      showToast(err.message || 'Failed to join group.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Groups</Text>
        <Pressable
          onPress={() => setCreateModalVisible(true)}
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
        >
          <Plus size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(['my', 'discover'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={styles.tabItem}
          >
            <Text style={[
              styles.tabLabel,
              { color: activeTab === tab ? colors.textPrimary : colors.textSecondary },
              activeTab === tab && styles.tabLabelActive,
            ]}>
              {tab === 'my' ? 'My Groups' : 'Discover'}
            </Text>
            {activeTab === tab && (
              <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />
            )}
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {activeTab === 'my' && (
          <>
            {groups.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🤝</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No groups yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Create a group or join with an invite code to start splitting bills!
                </Text>
                <View style={styles.emptyActions}>
                  <Pressable
                    onPress={() => setCreateModalVisible(true)}
                    style={[styles.emptyCreateBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.emptyCreateBtnText}>Create Group</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setJoinModalVisible(true)}
                    style={[styles.emptyJoinBtn, { borderColor: colors.primary }]}
                  >
                    <Text style={[styles.emptyJoinBtnText, { color: colors.primary }]}>Join with Code</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              groups.map((group) => {
                const balanceColor =
                  group.userBalance > 0 ? colors.success :
                  group.userBalance < 0 ? colors.danger :
                  colors.textSecondary;
                const balancePrefix = group.userBalance > 0 ? 'You are owed' : group.userBalance < 0 ? 'You owe' : 'Settled';

                return (
                  <Pressable
                    key={group.id}
                    onPress={() => router.push(`/group/${group.id}`)}
                    style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    {/* Group avatar + info */}
                    <View style={styles.groupCardLeft}>
                      <View style={[styles.groupIconCircle, { backgroundColor: colors.gray100 }]}>
                        <Text style={styles.groupIconEmoji}>{getCategoryEmoji(group.category)}</Text>
                      </View>
                      <View style={styles.groupCardInfo}>
                        <Text style={[styles.groupCardName, { color: colors.textPrimary }]}>{group.name}</Text>
                        {/* Member avatars */}
                        <View style={styles.memberAvatarsRow}>
                          {(group.members || []).slice(0, 4).map((m, i) => (
                            <View
                              key={m.userId}
                              style={[
                                styles.memberAvatarMini,
                                { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length], marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i },
                              ]}
                            >
                              <Text style={styles.memberAvatarMiniText}>{m.name.charAt(0).toUpperCase()}</Text>
                            </View>
                          ))}
                          <View style={[styles.memberAvatarMini, { backgroundColor: colors.gray200, marginLeft: (group.members?.length || 0) > 0 ? -8 : 0, zIndex: 0 }]}>
                            <Plus size={10} color={colors.textSecondary} />
                          </View>
                          <Text style={[styles.memberCountText, { color: colors.textSecondary }]}>
                            {group.membersCount} Members
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.groupCardRight}>
                      {group.userBalance !== 0 && (
                        <>
                          <Text style={[styles.groupBalancePre, { color: colors.textSecondary }]}>{balancePrefix}</Text>
                          <Text style={[styles.groupBalanceAmt, { color: balanceColor }]}>
                            {formatCurrency(Math.abs(group.userBalance), currency)}
                          </Text>
                        </>
                      )}
                      {group.userBalance === 0 && (
                        <Text style={[styles.settledText, { color: colors.success }]}>✓ Settled</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}

            {/* Join with code button at bottom */}
            {groups.length > 0 && (
              <Pressable
                onPress={() => setJoinModalVisible(true)}
                style={[styles.joinCodeRow, { borderColor: colors.border }]}
              >
                <Text style={[styles.joinCodeText, { color: colors.primary }]}>＋ Join with invite code</Text>
              </Pressable>
            )}
          </>
        )}

        {activeTab === 'discover' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Discover Groups</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Join groups shared by others using an invite code!
            </Text>
            <Pressable
              onPress={() => setJoinModalVisible(true)}
              style={[styles.emptyCreateBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
            >
              <Text style={styles.emptyCreateBtnText}>Enter Invite Code</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* ── CREATE GROUP MODAL ── */}
      <Modal visible={createModalVisible} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Create New Group</Text>

            <Input
              label="Group Name"
              placeholder="e.g. Bali Trip 2026"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <Input
              label="Description (optional)"
              placeholder="e.g. Shared travel and dinner splits"
              value={newGroupDesc}
              onChangeText={setNewGroupDesc}
            />

            <Text style={[styles.catPickLabel, { color: colors.textSecondary }]}>Category</Text>
            <View style={styles.catRow}>
              {[
                { id: 'GENERAL', label: '📦 General' },
                { id: 'TRAVEL', label: '✈️ Travel' },
                { id: 'HOME', label: '🏠 Home' },
                { id: 'FRIENDS', label: '🎉 Friends' },
              ].map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setNewGroupCat(c.id)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: newGroupCat === c.id ? `${colors.primary}18` : colors.gray100,
                      borderColor: newGroupCat === c.id ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.catChipText, { color: newGroupCat === c.id ? colors.primary : colors.textSecondary }]}>
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setCreateModalVisible(false)}
                style={styles.halfBtn}
              />
              <Button
                title="Create Group"
                loading={loading}
                onPress={handleCreateGroup}
                style={styles.halfBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── JOIN GROUP MODAL ── */}
      <Modal visible={joinModalVisible} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Join Group</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Enter the 6-character invite code shared by your friend
            </Text>
            <Input
              placeholder="e.g. ABC123"
              autoCapitalize="characters"
              maxLength={6}
              value={joinCode}
              onChangeText={setJoinCode}
            />
            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setJoinModalVisible(false)}
                style={styles.halfBtn}
              />
              <Button
                title="Join"
                loading={loading}
                onPress={handleJoinGroup}
                style={styles.halfBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontFamily: 'SpaceGrotesk', fontWeight: '800' },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tabItem: { paddingVertical: 10, marginRight: 24, alignItems: 'center' },
  tabLabel: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '600' },
  tabLabelActive: { fontWeight: '700' },
  tabUnderline: { height: 3, width: '100%', borderRadius: 2, marginTop: 6 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  emptyActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  emptyCreateBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyCreateBtnText: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700', color: '#FFFFFF' },
  emptyJoinBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5 },
  emptyJoinBtnText: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700' },

  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  groupCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  groupIconCircle: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  groupIconEmoji: { fontSize: 24 },
  groupCardInfo: { flex: 1 },
  groupCardName: { fontSize: 16, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginBottom: 6 },
  memberAvatarsRow: { flexDirection: 'row', alignItems: 'center' },
  memberAvatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  memberAvatarMiniText: { fontSize: 9, fontFamily: 'SpaceGrotesk', fontWeight: '700', color: '#FFFFFF' },
  memberCountText: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600', marginLeft: 8 },
  groupCardRight: { alignItems: 'flex-end', minWidth: 80 },
  groupBalancePre: { fontSize: 10, fontFamily: 'Nunito', fontWeight: '600', marginBottom: 2 },
  groupBalanceAmt: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '800' },
  settledText: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '700' },

  joinCodeRow: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  joinCodeText: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700' },

  // Modals
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'SpaceGrotesk', fontWeight: '800', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600', marginBottom: 16, lineHeight: 20 },
  catPickLabel: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '700', marginBottom: 8, marginTop: 4 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5 },
  catChipText: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '700' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  halfBtn: { flex: 1 },
});
