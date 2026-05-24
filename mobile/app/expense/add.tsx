import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useGroupStore } from '../../store/groupStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CATEGORIES } from '../../constants/categories';
import api from '../../services/api';

export default function AddExpenseScreen() {
  const { groupId, scannedTitle, scannedAmount } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  
  const user = useAuthStore((state) => state.user);
  const groups = useGroupStore((state) => state.groups);
  const setGroups = useGroupStore((state) => state.setGroups);
  const showToast = useUIStore((state) => state.showToast);

  // Group-optional flow states
  const [billMode, setBillMode] = useState<'group' | 'quick' | 'personal'>((groupId as string) ? 'group' : 'group');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>((groupId as string) || null);
  const currentGroup = groups.find(g => g.id === selectedGroupId) || null;

  // Search states for Quick Split
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [quickSplitUsers, setQuickSplitUsers] = useState<any[]>(user ? [user] : []);

  const currencySymbol = '₹'; // Force ₹ rupee as standard

  // Form parameters — pre-fill from camera scan if available
  const [title, setTitle] = useState((scannedTitle as string) || '');
  const [amount, setAmount] = useState((scannedAmount as string) || '');
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch groups on mount if they are not loaded
  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (err: any) {
      console.error('Fetch groups error:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Initialize participants based on mode
  useEffect(() => {
    if (billMode === 'group') {
      if (currentGroup) {
        setSelectedParticipants(currentGroup.members.map(m => m.userId));
      } else {
        setSelectedParticipants([]);
      }
    } else if (billMode === 'quick') {
      setSelectedParticipants(quickSplitUsers.map(u => u.id));
    } else {
      setSelectedParticipants(user ? [user.id] : []);
    }
  }, [currentGroup, billMode, quickSplitUsers, user]);

  // Debounced search for Quick Split users
  useEffect(() => {
    if (billMode !== 'quick' || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await api.get(`/auth/search?query=${encodeURIComponent(searchQuery.trim())}`);
        const currentIds = quickSplitUsers.map(u => u.id);
        const filtered = response.data.filter((u: any) => !currentIds.includes(u.id));
        setSearchResults(filtered);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, billMode, quickSplitUsers]);

  const addQuickSplitUser = (u: any) => {
    setQuickSplitUsers([...quickSplitUsers, u]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeQuickSplitUser = (userId: string) => {
    if (userId === user?.id) {
      showToast('You cannot remove yourself from the split.', 'error');
      return;
    }
    setQuickSplitUsers(quickSplitUsers.filter(u => u.id !== userId));
  };

  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      if (selectedParticipants.length > 1) {
        setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
      } else {
        showToast('Expense must split with at least one member.', 'error');
      }
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const handleSavePersonalBill = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showToast('Please enter an expense title.', 'error');
      return;
    }
    
    const parsedAmount = parseFloat(amount.trim());
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }

    if (parsedAmount > 10000000) {
      showToast('Amount is too high (max ₹1,00,00,000).', 'error');
      return;
    }

    setLoading(true);
    try {
      const body = {
        title: trimmedTitle,
        amount: parsedAmount,
        category: selectedCategory,
        groupId: null,
        splitType: 'EQUAL',
        participants: [user?.id],
      };
      await api.post('/expenses', body);
      showToast('Personal expense saved successfully! 👤', 'success');
      router.replace('/(tabs)');
    } catch (err: any) {
      showToast(err.message || 'Failed to save personal expense.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNextToSplit = () => {
    if (loading) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showToast('Please enter an expense title.', 'error');
      return;
    }
    
    const parsedAmount = parseFloat(amount.trim());
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }

    if (parsedAmount > 10000000) {
      showToast('Amount is too high (max ₹1,00,00,000).', 'error');
      return;
    }

    if (billMode === 'personal') {
      handleSavePersonalBill();
      return;
    }

    if (billMode === 'group' && !selectedGroupId) {
      showToast('Please select a group first.', 'error');
      return;
    }

    if (selectedParticipants.length === 0) {
      showToast('Please select at least one split participant.', 'error');
      return;
    }

    // Direct to split custom configuration screen
    router.push({
      pathname: '/expense/split',
      params: {
        title: trimmedTitle,
        amount: parsedAmount.toString(),
        category: selectedCategory,
        groupId: billMode === 'group' ? (selectedGroupId || '') : '',
        participants: JSON.stringify(selectedParticipants),
        participantProfiles: JSON.stringify(
          billMode === 'group'
            ? currentGroup?.members.map(m => ({ id: m.userId, name: m.name })) || []
            : quickSplitUsers.map(u => ({ id: u.id, name: u.name }))
        ),
      },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header Custom Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Add Expense</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Core Input Fields */}
        <View style={styles.inputsSection}>
          <Input
            label="What was this for?"
            placeholder="e.g. Pizza dinner, Taxi, Rent share"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.amountContainer}>
            <Text style={[styles.currencyPrefix, { color: colors.primary }]}>
              {currencySymbol}
            </Text>
            <TextInput
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.gray400}
              value={amount}
              onChangeText={setAmount}
              style={[styles.amountInput, { color: colors.textPrimary }]}
            />
          </View>
        </View>

        {/* Split Mode Selector (only if not pre-directed by groupId) */}
        {!groupId && (
          <View style={styles.modeContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Split Mode</Text>
            <View style={[styles.modeSelector, { backgroundColor: colors.surfaceElevated }]}>
              <Pressable
                onPress={() => setBillMode('group')}
                style={[
                  styles.modeButton,
                  billMode === 'group' && { 
                    backgroundColor: colors.surface, 
                    shadowColor: '#000', 
                    shadowOffset: { width: 0, height: 1 }, 
                    shadowOpacity: 0.1, 
                    shadowRadius: 2, 
                    elevation: 1 
                  }
                ]}
              >
                <Text style={[styles.modeButtonText, { color: billMode === 'group' ? colors.primary : colors.textSecondary }]}>Group Split</Text>
              </Pressable>
              <Pressable
                onPress={() => setBillMode('quick')}
                style={[
                  styles.modeButton,
                  billMode === 'quick' && { 
                    backgroundColor: colors.surface, 
                    shadowColor: '#000', 
                    shadowOffset: { width: 0, height: 1 }, 
                    shadowOpacity: 0.1, 
                    shadowRadius: 2, 
                    elevation: 1 
                  }
                ]}
              >
                <Text style={[styles.modeButtonText, { color: billMode === 'quick' ? colors.primary : colors.textSecondary }]}>Quick Split</Text>
              </Pressable>
              <Pressable
                onPress={() => setBillMode('personal')}
                style={[
                  styles.modeButton,
                  billMode === 'personal' && { 
                    backgroundColor: colors.surface, 
                    shadowColor: '#000', 
                    shadowOffset: { width: 0, height: 1 }, 
                    shadowOpacity: 0.1, 
                    shadowRadius: 2, 
                    elevation: 1 
                  }
                ]}
              >
                <Text style={[styles.modeButtonText, { color: billMode === 'personal' ? colors.primary : colors.textSecondary }]}>Personal</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Group Selector (only for Group mode if groupId not in search params) */}
        {billMode === 'group' && !groupId && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Group</Text>
            {groups.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito', fontSize: 12, marginHorizontal: 24 }}>
                You aren't in any groups yet. Create a group first or try Quick Split.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                {groups.map((group) => {
                  const isSelected = selectedGroupId === group.id;
                  return (
                    <Pressable
                      key={group.id}
                      onPress={() => setSelectedGroupId(selectedGroupId === group.id ? null : group.id)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isSelected ? `${colors.primary}1A` : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.catEmoji}>
                        {group.category === 'TRAVEL' ? '✈️' : group.category === 'HOME' ? '🏠' : group.category === 'FRIENDS' ? '🎉' : '📦'}
                      </Text>
                      <Text style={[styles.catLabel, { color: isSelected ? colors.primary : colors.textSecondary }]}>
                        {group.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        {/* Category Pick grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.catChip,
                {
                  backgroundColor: selectedCategory === cat.id ? `${colors.primary}1A` : colors.surface,
                  borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={styles.catEmoji}>{cat.icon}</Text>
              <Text style={[styles.catLabel, { color: selectedCategory === cat.id ? colors.primary : colors.textSecondary }]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Split participants selection based on Mode */}
        {billMode === 'group' && (
          currentGroup ? (
            <View style={styles.participantsSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 4, marginLeft: 0 }]}>
                Split With
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginLeft: 0 }]}>
                Choose who shares the cost of this bill
              </Text>

              {currentGroup.members.map((m) => {
                const isChecked = selectedParticipants.includes(m.userId);
                return (
                  <Pressable
                    key={m.userId}
                    onPress={() => toggleParticipant(m.userId)}
                    style={[
                      styles.participantRow,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isChecked ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.participantMeta}>
                      <View style={[styles.avatarCircle, { backgroundColor: colors.surfaceElevated }]}>
                        <Text style={styles.avatarLetter}>{m.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.participantName, { color: colors.textPrimary }]}>
                        {m.name}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: isChecked ? colors.primary : 'transparent',
                          borderColor: isChecked ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      {isChecked && <Check size={12} color={colors.primaryDeep} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.participantsSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 4, marginLeft: 0 }]}>
                Split With
              </Text>
              <Card variant="glass" padding={20} style={{ alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito', fontSize: 13, textAlign: 'center' }}>
                  Please select a group first to split this expense.
                </Text>
              </Card>
            </View>
          )
        )}

        {billMode === 'quick' && (
          <View style={styles.participantsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 4, marginLeft: 0 }]}>
              Split With
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginLeft: 0 }]}>
              Search for users to split this bill with
            </Text>

            {/* Search Input */}
            <View style={{ marginBottom: 16 }}>
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ height: 44 }}
              />
              {searching && (
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, fontFamily: 'Nunito' }}>Searching...</Text>
              )}
              {searchResults.length > 0 && (
                <View style={[styles.searchResultsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {searchResults.map((u) => (
                    <Pressable
                      key={u.id}
                      onPress={() => addQuickSplitUser(u)}
                      style={[styles.searchResultRow, { borderBottomColor: colors.border }]}
                    >
                      <View style={[styles.avatarCircle, { backgroundColor: colors.surfaceElevated }]}>
                        <Text style={styles.avatarLetter}>{u.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={[styles.participantName, { color: colors.textPrimary, marginLeft: 0 }]}>{u.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'Nunito' }}>{u.email}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Selected quick split participants */}
            {quickSplitUsers.map((u) => {
              const isSelf = u.id === user?.id;
              return (
                <View
                  key={u.id}
                  style={[
                    styles.participantRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <View style={styles.participantMeta}>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.surfaceElevated }]}>
                      <Text style={styles.avatarLetter}>{u.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.participantName, { color: colors.textPrimary }]}>
                      {u.name} {isSelf && '(You)'}
                    </Text>
                  </View>

                  {!isSelf && (
                    <Pressable
                      onPress={() => removeQuickSplitUser(u.id)}
                      style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                    >
                      <Text style={{ color: colors.danger, fontSize: 13, fontFamily: 'SpaceGrotesk', fontWeight: '700' }}>Remove</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {billMode === 'personal' && (
          <View style={styles.participantsSection}>
            <Card variant="glass" padding={20} style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito', fontSize: 13, textAlign: 'center' }}>
                Personal bill mode. This expense will be saved just for you.
              </Text>
            </Card>
          </View>
        )}

        {/* Navigation Action CTA Button */}
        <Button
          title={billMode === 'personal' ? 'Save Personal Bill' : 'Configure Split'}
          loading={loading}
          onPress={handleNextToSplit}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  inputsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  currencyPrefix: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginRight: 6,
  },
  amountInput: {
    fontSize: 48,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    width: '60%',
    textAlign: 'left',
  },
  modeContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modeSelector: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginTop: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeButtonText: {
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
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginHorizontal: 24,
    marginBottom: 12,
    lineHeight: 16,
  },
  catScroll: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    marginBottom: 20,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  catEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  catLabel: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '700',
  },
  participantsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 4,
  },
  participantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  participantName: {
    fontSize: 13,
    fontFamily: 'Nunito',
    fontWeight: '700',
    marginLeft: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultsContainer: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  submitBtn: {
    marginHorizontal: 24,
    marginTop: 10,
  },
});
