import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, RefreshControl, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Users, Compass, CompassIcon, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react-native';
import { useGroupStore } from '../../store/groupStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';

export default function GroupsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const groups = useGroupStore((state) => state.groups);
  const setGroups = useGroupStore((state) => state.setGroups);
  const addGroup = useGroupStore((state) => state.addGroup);
  const showToast = useUIStore((state) => state.showToast);

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  
  // Group creation state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCat, setNewGroupCat] = useState('GENERAL');
  
  // Join code state
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName) {
      showToast('Group name is required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/groups', {
        name: newGroupName,
        description: newGroupDesc,
        category: newGroupCat,
      });
      addGroup(response.data);
      showToast('Group created successfully!', 'success');
      setModalVisible(false);
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
    if (!joinCode) {
      showToast('Invite code is required.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/groups/join', { code: joinCode });
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
      {/* Header Panel */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Groups</Text>
        <View style={styles.headerBtns}>
          <Pressable 
            onPress={() => setJoinModalVisible(true)}
            style={[styles.joinBtn, { borderColor: colors.primary }]}
          >
            <Text style={[styles.joinBtnText, { color: colors.primary }]}>Join Code</Text>
          </Pressable>
          
          <Pressable 
            onPress={() => setModalVisible(true)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Plus size={20} color={colors.primaryDeep} />
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
        {groups.length === 0 ? (
          <Card variant="glass" padding={24} style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🤝</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              You aren't in any split groups yet. Create one or join using an invite code!
            </Text>
          </Card>
        ) : (
          groups.map((group) => {
            const balanceColor = group.userBalance > 0 
              ? colors.success 
              : group.userBalance < 0 
                ? colors.danger 
                : colors.gray600;

            const balanceLabel = group.userBalance > 0
              ? 'you are owed'
              : group.userBalance < 0
                ? 'you owe'
                : 'settled';

            return (
              <Pressable
                key={group.id}
                onPress={() => router.push(`/group/${group.id}`)}
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
                    <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                      {balanceLabel}
                    </Text>
                    <Text style={[styles.balanceAmount, { color: balanceColor }]}>
                      {group.userBalance === 0 
                        ? 'settled' 
                        : formatCurrency(Math.abs(group.userBalance), 'USD')}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* CREATE GROUP MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Create New Group</Text>
            
            <Input
              label="Group Name"
              placeholder="e.g. Bali Trip 2026"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <Input
              label="Description (Optional)"
              placeholder="e.g. Shared travel and dinner splits"
              value={newGroupDesc}
              onChangeText={setNewGroupDesc}
            />

            <Text style={[styles.categoryPickerLabel, { color: colors.textSecondary }]}>Category</Text>
            <View style={styles.catRow}>
              {['GENERAL', 'TRAVEL', 'HOME', 'FRIENDS'].map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setNewGroupCat(cat)}
                  style={[
                    styles.catChip,
                    {
                      borderColor: newGroupCat === cat ? colors.primary : colors.border,
                      backgroundColor: newGroupCat === cat ? `${colors.primary}1A` : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.catChipText, { color: newGroupCat === cat ? colors.primary : colors.textSecondary }]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" style={styles.halfBtn} onPress={() => setModalVisible(false)} />
              <Button title="Create" loading={loading} style={styles.halfBtn} onPress={handleCreateGroup} />
            </View>
          </View>
        </View>
      </Modal>

      {/* JOIN GROUP MODAL */}
      <Modal visible={joinModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Join Group by Code</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Enter the invite code shared by the group administrator
            </Text>

            <Input
              placeholder="e.g. ABCD12"
              autoCapitalize="characters"
              maxLength={6}
              value={joinCode}
              onChangeText={setJoinCode}
            />

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" style={styles.halfBtn} onPress={() => setJoinModalVisible(false)} />
              <Button title="Join Group" loading={loading} style={styles.halfBtn} onPress={handleJoinGroup} />
            </View>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  headerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  joinBtnText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Nunito',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
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
  balanceLabel: {
    fontSize: 9,
    fontFamily: 'Nunito',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 18,
  },
  categoryPickerLabel: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  catChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  catChipText: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  halfBtn: {
    width: '48%',
  },
});
