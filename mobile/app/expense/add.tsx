import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useGroupStore } from '../../store/groupStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CATEGORIES } from '../../constants/categories';
import api from '../../services/api';

export default function AddExpenseScreen() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  
  const activeGroup = useGroupStore((state) => state.activeGroup);
  const showToast = useUIStore((state) => state.showToast);

  // Form parameters
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize participants from active group members
  useEffect(() => {
    if (activeGroup) {
      setSelectedParticipants(activeGroup.members.map(m => m.userId));
    }
  }, [activeGroup]);

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
        groupId: (groupId as string) || '',
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
            <Text style={[styles.currencyPrefix, { color: colors.primary }]}>$</Text>
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
        {activeGroup && (
          <View style={styles.participantsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 4 }]}>
              Split With
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Choose who shares the cost of this bill
            </Text>

            {activeGroup.members.map((m) => {
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

// Inline TextInput declaration for ease
import { TextInput } from 'react-native';

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
