import React, { useState, useEffect } from 'react';
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
  const { groupId, scannedTitle } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  
  const user = useAuthStore((state) => state.user);
  const groups = useGroupStore((state) => state.groups);
  const setGroups = useGroupStore((state) => state.setGroups);
  const showToast = useUIStore((state) => state.showToast);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>((groupId as string) || null);
  const currentGroup = groups.find(g => g.id === selectedGroupId) || null;

  const currency = user?.currency || 'INR';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';

  // Form parameters — pre-fill from camera scan if available
  const [title, setTitle] = useState((scannedTitle as string) || '');
  const [amount, setAmount] = useState('');
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

  // Initialize participants from selected group members
  useEffect(() => {
    if (currentGroup) {
      setSelectedParticipants(currentGroup.members.map(m => m.userId));
    } else {
      setSelectedParticipants([]);
    }
  }, [currentGroup]);

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

  const handleNextToSplit = () => {
    if (!title) {
      showToast('Please enter an expense title.', 'error');
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }

    if (!selectedGroupId) {
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
        title,
        amount: parsedAmount.toString(),
        category: selectedCategory,
        groupId: selectedGroupId,
        participants: JSON.stringify(selectedParticipants),
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

        {/* Group Selector (only if groupId was not passed in url search params) */}
        {!groupId && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Group</Text>
            {groups.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito', fontSize: 12, marginHorizontal: 24 }}>
                You aren't in any groups yet. Create a group first.
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

        {/* Split participants selection check grid */}
        {currentGroup ? (
          <View style={styles.participantsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 4 }]}>
              Split With
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
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
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 4 }]}>
              Split With
            </Text>
            <Card variant="glass" padding={20} style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito', fontSize: 13, textAlign: 'center' }}>
                Please select a group first to split this expense.
              </Text>
            </Card>
          </View>
        )}

        {/* Navigation Action CTA Button */}
        <Button
          title="Configure Split"
          onPress={handleNextToSplit}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// (TextInput imported at top)

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
  submitBtn: {
    marginHorizontal: 24,
    marginTop: 10,
  },
});
