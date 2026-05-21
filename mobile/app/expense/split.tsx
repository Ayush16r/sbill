import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Users, Percent, DollarSign, Ratio } from 'lucide-react-native';
import { useGroupStore } from '../../store/groupStore';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';

type SplitType = 'EQUAL' | 'PERCENTAGE' | 'CUSTOM' | 'SHARES';

export default function SplitCalculatorScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  
  const user = useAuthStore((state) => state.user);
  const activeGroup = useGroupStore((state) => state.activeGroup);
  const showToast = useUIStore((state) => state.showToast);

  // Parsed params from add expense screen
  const title = params.title as string;
  const total = parseFloat(params.amount as string);
  const category = params.category as string;
  const groupId = params.groupId as string;
  const participantIds: string[] = JSON.parse(params.participants as string);

  // States
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Initialize input parameters with equal slices by default
  useEffect(() => {
    const defaultInputs: Record<string, string> = {};
    participantIds.forEach(id => {
      if (splitType === 'PERCENTAGE') {
        defaultInputs[id] = (100 / participantIds.length).toFixed(0);
      } else if (splitType === 'CUSTOM') {
        defaultInputs[id] = (total / participantIds.length).toFixed(2);
      } else if (splitType === 'SHARES') {
        defaultInputs[id] = '1';
      }
    });
    setInputs(defaultInputs);
  }, [splitType]);

  const handleInputChange = (userId: string, val: string) => {
    setInputs({
      ...inputs,
      [userId]: val,
    });
  };

  // Run validators depending on active split type selection
  const validate = () => {
    if (splitType === 'EQUAL') return true;

    const values = Object.entries(inputs).map(([id, val]) => ({
      id,
      num: parseFloat(val) || 0,
    }));

    if (splitType === 'PERCENTAGE') {
      const sum = values.reduce((s, item) => s + item.num, 0);
      if (Math.abs(sum - 100) > 0.1) {
        showToast(`Percentages must sum to 100% (currently ${sum.toFixed(0)}%)`, 'error');
        return false;
      }
    }

    if (splitType === 'CUSTOM') {
      const sum = values.reduce((s, item) => s + item.num, 0);
      if (Math.abs(sum - total) > 0.05) {
        const currency = user?.currency || 'INR';
        showToast(`Amounts must sum to total: ${formatCurrency(total, currency)} (currently ${formatCurrency(sum, currency)})`, 'error');
        return false;
      }
    }

    if (splitType === 'SHARES') {
      const sum = values.reduce((s, item) => s + item.num, 0);
      if (sum <= 0) {
        showToast('Total shares must be greater than zero.', 'error');
        return false;
      }
    }

    return true;
  };

  const handleConfirmSplit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const customValuesPayload: Record<string, number> = {};
      participantIds.forEach(id => {
        customValuesPayload[id] = parseFloat(inputs[id]) || 0;
      });

      const body = {
        title,
        amount: total,
        category,
        groupId: groupId || undefined,
        splitType,
        participants: participantIds,
        customValues: splitType !== 'EQUAL' ? customValuesPayload : undefined,
      };

      await api.post('/expenses', body);
      showToast('Expense added and split successfully!', 'success');
      
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Choose Split Method</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Split Type Selector Chips */}
        <View style={styles.tabRow}>
          {[
            { id: 'EQUAL', label: 'Equally', icon: Users },
            { id: 'PERCENTAGE', label: 'Percent', icon: Percent },
            { id: 'CUSTOM', label: 'Exact', icon: DollarSign },
            { id: 'SHARES', label: 'Shares', icon: Ratio },
          ].map((type) => {
            const Icon = type.icon;
            const isSelected = splitType === type.id;
            return (
              <Pressable
                key={type.id}
                onPress={() => setSplitType(type.id as SplitType)}
                style={[
                  styles.tabChip,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? `${colors.primary}1E` : 'transparent',
                  },
                ]}
              >
                <Icon size={14} color={isSelected ? colors.primary : colors.textSecondary} style={{ marginBottom: 4 }} />
                <Text style={[styles.tabLabel, { color: isSelected ? colors.primary : colors.textSecondary }]}>
                  {type.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Informative summary block */}
        <Card variant="filled" padding={14} style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>Expense Total</Text>
          <Text style={[styles.summaryAmount, { color: colors.textPrimary }]}>
            {formatCurrency(total, user?.currency || 'INR')}
          </Text>
          <Text style={[styles.summarySubtitle, { color: colors.textSecondary }]}>
            Splitting between {participantIds.length} members
          </Text>
        </Card>

        {/* Inputs list scroll */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Adjust Slices</Text>
        <View style={styles.inputsSection}>
          {participantIds.map(id => {
            const member = activeGroup?.members.find(m => m.userId === id);
            const name = member?.name || 'Group Member';
            const value = inputs[id] || '';

            // Compute equal text representation
            const currencyCode = user?.currency || 'INR';
            const currencySymbol = currencyCode === 'USD' ? '$' : currencyCode === 'EUR' ? '€' : currencyCode === 'INR' ? '₹' : currencyCode;
            let inputPrefix = '';
            let isReadOnly = false;
            let computedShare = '';

            if (splitType === 'EQUAL') {
              isReadOnly = true;
              computedShare = formatCurrency(total / participantIds.length, currencyCode);
            } else if (splitType === 'PERCENTAGE') {
              inputPrefix = '%';
              const numVal = parseFloat(value) || 0;
              computedShare = formatCurrency(total * (numVal / 100), currencyCode);
            } else if (splitType === 'CUSTOM') {
              inputPrefix = currencySymbol;
              computedShare = `${((parseFloat(value) || 0) / total * 100).toFixed(0)} %`;
            } else if (splitType === 'SHARES') {
              inputPrefix = 'shares';
              const totalShares = Object.values(inputs).reduce((s, v) => s + (parseFloat(v) || 0), 0);
              const myShare = parseFloat(value) || 0;
              computedShare = totalShares > 0 
                ? formatCurrency(total * (myShare / totalShares), currencyCode)
                : formatCurrency(0, currencyCode);
            }

            return (
              <Card key={id} variant="glass" padding={14} style={styles.memberInputRow}>
                <View style={styles.memberMeta}>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.memberNameCol}>
                    <Text style={[styles.memberNameText, { color: colors.textPrimary }]}>{name}</Text>
                    <Text style={[styles.memberShareText, { color: colors.textSecondary }]}>{computedShare}</Text>
                  </View>
                </View>

                {isReadOnly ? (
                  <Text style={[styles.readOnlyText, { color: colors.textPrimary }]}>{computedShare}</Text>
                ) : (
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputPrefixText, { color: colors.textSecondary }]}>{inputPrefix}</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={value}
                      onChangeText={(val) => handleInputChange(id, val)}
                      style={[styles.memberTextInput, { color: colors.textPrimary, borderColor: colors.border }]}
                    />
                  </View>
                )}
              </Card>
            );
          })}
        </View>

        {/* CTA Confirmation Button */}
        <Button
          title="Confirm Split"
          loading={loading}
          onPress={handleConfirmSplit}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Inline TextInput imports
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
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  tabChip: {
    width: '23%',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  summaryCard: {
    marginHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryAmount: {
    fontSize: 28,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    marginVertical: 4,
  },
  summarySubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginHorizontal: 24,
    marginBottom: 12,
  },
  inputsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  memberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  memberNameCol: {
    marginLeft: 12,
  },
  memberNameText: {
    fontSize: 13,
    fontFamily: 'Nunito',
    fontWeight: '700',
  },
  memberShareText: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '600',
    marginTop: 2,
  },
  readOnlyText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputPrefixText: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginRight: 6,
  },
  memberTextInput: {
    width: 64,
    height: 36,
    borderWidth: 1,
    borderRadius: 10,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk',
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    marginHorizontal: 24,
    marginTop: 10,
  },
});
