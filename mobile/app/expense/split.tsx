import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Users, Percent, IndianRupee, Ratio } from 'lucide-react-native';
import { useGroupStore } from '../../store/groupStore';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';

type SplitType = 'EQUAL' | 'PERCENTAGE' | 'CUSTOM' | 'SHARES';

export default function SplitCalculatorScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  const user = useAuthStore((state) => state.user);
  const groups = useGroupStore((state) => state.groups);
  const showToast = useUIStore((state) => state.showToast);

  const title = params.title as string;
  const total = parseFloat(params.amount as string);
  const category = params.category as string;
  const groupId = params.groupId as string;
  const participantIds: string[] = JSON.parse(params.participants as string || '[]');
  const participantProfiles: Array<{ id: string; name: string }> = JSON.parse(
    params.participantProfiles as string || '[]'
  );

  const currencySymbol = '₹'; // Force ₹ rupee as standard

  const currentGroup = groups.find((g) => g.id === groupId) || null;

  const getMemberName = (userId: string): string => {
    if (userId === user?.id) return 'You';
    const profile = participantProfiles.find(p => p.id === userId);
    if (profile) return profile.name;
    if (!currentGroup) return 'Member';
    const member = currentGroup.members.find((m) => m.userId === userId);
    return member?.name || 'Member';
  };

  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Initialize and distribute default inputs evenly based on splitType
  useEffect(() => {
    const n = participantIds.length;
    if (n === 0) return;

    const defaultInputs: Record<string, string> = {};

    if (splitType === 'PERCENTAGE') {
      // Distribute evenly; give remainder to first person
      const basePercent = Math.floor(100 / n);
      const remainder = 100 - basePercent * n;
      participantIds.forEach((id, i) => {
        defaultInputs[id] = (basePercent + (i === 0 ? remainder : 0)).toString();
      });
    } else if (splitType === 'CUSTOM') {
      // Distribute evenly; give remainder cents to first person
      const baseAmount = Math.floor((total / n) * 100) / 100;
      const totalDistributed = baseAmount * n;
      const remainder = Math.round((total - totalDistributed) * 100) / 100;
      participantIds.forEach((id, i) => {
        defaultInputs[id] = (baseAmount + (i === 0 ? remainder : 0)).toFixed(2);
      });
    } else if (splitType === 'SHARES') {
      participantIds.forEach((id) => {
        defaultInputs[id] = '1';
      });
    }

    setInputs(defaultInputs);
  }, [splitType, participantIds.join(','), total]);

  const handleInputChange = (userId: string, val: string) => {
    setInputs({ ...inputs, [userId]: val });
  };

  // Real-time validation
  const validate = (): boolean => {
    if (splitType === 'EQUAL') return true;

    const values = participantIds.map((id) => ({
      id,
      num: parseFloat(inputs[id] || '0') || 0,
    }));

    if (values.some((v) => v.num < 0)) {
      showToast('Split values cannot be negative.', 'error');
      return false;
    }

    if (splitType === 'PERCENTAGE') {
      const sum = values.reduce((s, v) => s + v.num, 0);
      // Allow 1% tolerance for manual entry, which we will normalize before submission
      if (Math.abs(sum - 100) > 1) {
        showToast(`Percentages must sum to 100% (currently ${sum.toFixed(1)}%)`, 'error');
        return false;
      }
    }

    if (splitType === 'CUSTOM') {
      const sum = values.reduce((s, v) => s + v.num, 0);
      // Allow 2 rupee tolerance for manual entry, which we will normalize before submission
      if (Math.abs(sum - total) > 2) {
        showToast(
          `Amounts must sum to ${formatCurrency(total)} (currently ${formatCurrency(sum)})`,
          'error'
        );
        return false;
      }
    }

    if (splitType === 'SHARES') {
      const sum = values.reduce((s, v) => s + v.num, 0);
      if (sum <= 0) {
        showToast('Total shares must be greater than 0.', 'error');
        return false;
      }
    }

    return true;
  };

  const handleConfirmSplit = async () => {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      const customValues: Record<string, number> = {};
      participantIds.forEach((id) => {
        customValues[id] = parseFloat(inputs[id] || '0') || 0;
      });

      // Normalization to ensure no floating point mismatch errors or database rejections
      if (splitType === 'PERCENTAGE') {
        const sum = Object.values(customValues).reduce((s, v) => s + v, 0);
        if (sum > 0) {
          const diff = 100 - sum;
          // Add the remainder difference to the first participant to make it exactly 100.00
          const firstId = participantIds[0];
          customValues[firstId] = Math.round((customValues[firstId] + diff) * 100) / 100;
        }
      } else if (splitType === 'CUSTOM') {
        const sum = Object.values(customValues).reduce((s, v) => s + v, 0);
        const diff = total - sum;
        // Add the remainder difference to the first participant to make it exactly total
        const firstId = participantIds[0];
        customValues[firstId] = Math.round((customValues[firstId] + diff) * 100) / 100;
      }

      const body = {
        title,
        amount: total,
        category,
        groupId: groupId || null,
        splitType,
        participants: participantIds,
        customValues: splitType !== 'EQUAL' ? customValues : undefined,
      };

      await api.post('/expenses', body);
      showToast('Expense added and split successfully! 🎉', 'success');

      if (groupId) {
        router.replace({ pathname: '/group/[id]', params: { id: groupId } });
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit splits.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Compute live share correctly for each split type to show dynamic feedback
  const getComputedShare = (userId: string): string => {
    const value = parseFloat(inputs[userId] || '0') || 0;

    if (splitType === 'EQUAL') {
      return formatCurrency(total / participantIds.length);
    } else if (splitType === 'PERCENTAGE') {
      return formatCurrency(total * (value / 100));
    } else if (splitType === 'CUSTOM') {
      return `${total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'}%`;
    } else if (splitType === 'SHARES') {
      const totalShares = participantIds.reduce(
        (s, id) => s + (parseFloat(inputs[id] || '0') || 0),
        0
      );
      return totalShares > 0 ? formatCurrency(total * (value / totalShares)) : formatCurrency(0);
    }
    return '';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Split Method</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Split type tabs */}
        <View style={styles.tabRow}>
          {([
            { id: 'EQUAL', label: 'Equally', icon: Users },
            { id: 'PERCENTAGE', label: 'Percent', icon: Percent },
            { id: 'CUSTOM', label: 'Exact', icon: IndianRupee },
            { id: 'SHARES', label: 'Shares', icon: Ratio },
          ] as const).map(({ id, label, icon: Icon }) => {
            const active = splitType === id;
            return (
              <Pressable
                key={id}
                onPress={() => setSplitType(id)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? `${colors.primary}14` : colors.gray100,
                    borderColor: active ? colors.primary : 'transparent',
                  },
                ]}
              >
                <Icon size={14} color={active ? colors.primary : colors.textSecondary} />
                <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.textSecondary }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Summary card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.gray100 }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Amount</Text>
          <Text style={[styles.summaryAmount, { color: colors.textPrimary }]}>
            {formatCurrency(total)}
          </Text>
          <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>
            Split between {participantIds.length} {participantIds.length === 1 ? 'person' : 'people'}
            {splitType === 'EQUAL' && ` · ${currencySymbol}${(total / participantIds.length).toFixed(2)} each`}
          </Text>
        </View>

        {/* Live sum indicator for feedback */}
        {splitType !== 'EQUAL' && (
          <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
            {splitType === 'PERCENTAGE' && (() => {
              const sum = participantIds.reduce((s, id) => s + (parseFloat(inputs[id] || '0') || 0), 0);
              const diff = 100 - sum;
              return (
                <Text style={{ fontFamily: 'SpaceGrotesk', fontSize: 13, fontWeight: '700', color: Math.abs(diff) <= 1 ? colors.primary : colors.danger }}>
                  Sum: {sum.toFixed(1)}% ({diff === 0 ? 'Balanced' : `${diff > 0 ? `${diff.toFixed(1)}% remaining` : `${Math.abs(diff).toFixed(1)}% over`}`})
                </Text>
              );
            })()}
            {splitType === 'CUSTOM' && (() => {
              const sum = participantIds.reduce((s, id) => s + (parseFloat(inputs[id] || '0') || 0), 0);
              const diff = total - sum;
              return (
                <Text style={{ fontFamily: 'SpaceGrotesk', fontSize: 13, fontWeight: '700', color: Math.abs(diff) <= 2 ? colors.primary : colors.danger }}>
                  Sum: {formatCurrency(sum)} ({diff === 0 ? 'Balanced' : `${diff > 0 ? `${formatCurrency(diff)} remaining` : `${formatCurrency(Math.abs(diff))} over`}`})
                </Text>
              );
            })()}
          </View>
        )}

        {/* Member rows */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Adjust Amounts</Text>
        <View style={styles.membersSection}>
          {participantIds.map((userId) => {
            const name = getMemberName(userId);
            const isReadOnly = splitType === 'EQUAL';
            const computedShare = getComputedShare(userId);
            const value = inputs[userId] || '';

            let inputPrefix = '';
            if (splitType === 'PERCENTAGE') inputPrefix = '%';
            else if (splitType === 'CUSTOM') inputPrefix = currencySymbol;
            else if (splitType === 'SHARES') inputPrefix = '×';

            return (
              <View
                key={userId}
                style={[styles.memberRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                {/* Avatar */}
                <View style={[styles.memberAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.memberAvatarText}>{name.charAt(0).toUpperCase()}</Text>
                </View>

                {/* Name + computed share */}
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.textPrimary }]}>{name}</Text>
                  <Text style={[styles.memberShare, { color: colors.textSecondary }]}>{computedShare}</Text>
                </View>

                {/* Input or static display */}
                {isReadOnly ? (
                  <Text style={[styles.readOnlyAmount, { color: colors.textPrimary }]}>{computedShare}</Text>
                ) : (
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputPrefix, { color: colors.textSecondary }]}>{inputPrefix}</Text>
                    <TextInput
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={(v) => handleInputChange(userId, v)}
                      style={[styles.memberInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.gray100 }]}
                      placeholder="0"
                      placeholderTextColor={colors.gray400}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Confirm button */}
        <Button
          title="Confirm & Add Expense"
          loading={loading}
          onPress={handleConfirmSplit}
          style={styles.confirmBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  scrollContent: { paddingBottom: 40, paddingTop: 20 },

  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 20 },
  tabChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  tabLabel: { fontSize: 10, fontFamily: 'SpaceGrotesk', fontWeight: '700' },

  summaryCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLabel: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  summaryAmount: { fontSize: 32, fontFamily: 'SpaceGrotesk', fontWeight: '900', letterSpacing: -1, marginBottom: 4 },
  summaryMeta: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600' },

  sectionTitle: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginHorizontal: 20, marginBottom: 12 },
  membersSection: { paddingHorizontal: 20, gap: 8, marginBottom: 24 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '700', color: '#FFFFFF' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700', marginBottom: 2 },
  memberShare: { fontSize: 12, fontFamily: 'SpaceGrotesk', fontWeight: '600' },
  readOnlyAmount: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inputPrefix: { fontSize: 13, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  memberInput: {
    width: 72,
    height: 38,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  confirmBtn: { marginHorizontal: 20 },
});
