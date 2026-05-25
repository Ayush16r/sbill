// app/expense/personal.tsx — Add Personal Expense Screen
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, RotateCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useTransactionStore } from '../../store/transactionStore';
import { useAccountStore } from '../../store/accountStore';
import { useUIStore } from '../../store/uiStore';
import AmountInput from '../../components/forms/AmountInput';
import CategoryPicker from '../../components/forms/CategoryPicker';
import AccountPicker from '../../components/forms/AccountPicker';
import DatePickerField from '../../components/forms/DatePicker';

export default function AddExpenseScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const accounts = useAccountStore((s) => s.accounts);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const showToast = useUIStore((s) => s.showToast);

  const [amount, setAmount] = useState('0');
  const [category, setCategory] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Set default account
  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      const def = accounts.find((a) => a.isDefault) || accounts[0];
      setAccountId(def.id);
    }
  }, [accounts]);

  const handleSave = async (addAnother = false) => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Enter a title', 'error');
      return;
    }
    if (date > new Date()) {
      showToast('Date cannot be in the future', 'error');
      return;
    }

    setSaving(true);
    try {
      await addTransaction({
        type: 'EXPENSE',
        amount: parsedAmount,
        category: category || undefined,
        title: title.trim(),
        note: note.trim() || undefined,
        accountId: accountId || undefined,
        date: date.toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Expense added! 💸', 'success');

      if (addAnother) {
        setAmount('0');
        setCategory(null);
        setTitle('');
        setNote('');
      } else {
        router.back();
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to add expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Add Expense</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Amount */}
          <AmountInput value={amount} onChange={setAmount} type="expense" />

          {/* Category */}
          <CategoryPicker selected={category} onChange={setCategory} type="expense" />

          {/* Title */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What was this expense for?"
              placeholderTextColor={colors.gray400}
              style={[styles.textInput, { backgroundColor: isDark ? '#1F1F1F' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.border }]}
            />
          </View>

          {/* Account */}
          <AccountPicker accounts={accounts} selectedId={accountId} onChange={setAccountId} />

          {/* Date */}
          <DatePickerField value={date} onChange={setDate} maxDate={new Date()} />

          {/* Note */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={colors.gray400}
              multiline
              style={[styles.textInput, styles.noteInput, { backgroundColor: isDark ? '#1F1F1F' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.border }]}
            />
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable
            onPress={() => handleSave(true)}
            disabled={saving}
            style={[styles.secondaryBtn, { borderColor: colors.primary }]}
          >
            <RotateCw size={16} color={colors.primary} />
            <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Save & Add Another</Text>
          </Pressable>
          <Pressable
            onPress={() => handleSave(false)}
            disabled={saving}
            style={[styles.primaryBtn, { backgroundColor: '#DC2626' }]}
          >
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Save Expense</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  scrollContent: { paddingTop: 16, paddingBottom: 120 },
  fieldContainer: { marginBottom: 16, paddingHorizontal: 20 },
  fieldLabel: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '700', marginBottom: 8 },
  textInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontFamily: 'Nunito', fontWeight: '600' },
  noteInput: { height: 80, textAlignVertical: 'top' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32, borderTopWidth: 1 },
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  secondaryBtnText: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '700' },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14 },
  primaryBtnText: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '700', color: '#FFFFFF' },
});
