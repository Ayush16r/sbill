// app/transfer/index.tsx — Transfer Between Accounts Screen
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowDown, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useTransactionStore } from '../../store/transactionStore';
import { useAccountStore } from '../../store/accountStore';
import { useUIStore } from '../../store/uiStore';
import AmountInput from '../../components/forms/AmountInput';
import AccountPicker from '../../components/forms/AccountPicker';
import DatePickerField from '../../components/forms/DatePicker';

export default function TransferScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const accounts = useAccountStore((s) => s.accounts);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const showToast = useUIStore((s) => s.showToast);

  const [amount, setAmount] = useState('0');
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAccounts(); }, []);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    if (!fromAccountId || !toAccountId) {
      showToast('Select both accounts', 'error');
      return;
    }
    if (fromAccountId === toAccountId) {
      showToast('From and To accounts must be different', 'error');
      return;
    }

    setSaving(true);
    try {
      await addTransaction({
        type: 'TRANSFER',
        amount: parsedAmount,
        title: `Transfer`,
        accountId: fromAccountId,
        toAccountId: toAccountId,
        note: note.trim() || undefined,
        date: date.toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Transfer completed! ⇄', 'success');
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to transfer', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Transfer</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <AmountInput value={amount} onChange={setAmount} type="transfer" />

          <AccountPicker accounts={accounts} selectedId={fromAccountId} onChange={setFromAccountId} label="From Account" />

          <View style={styles.arrowContainer}>
            <View style={[styles.arrowCircle, { backgroundColor: isDark ? '#1F1F1F' : '#F3F4F6' }]}>
              <ArrowDown size={20} color={colors.primary} />
            </View>
          </View>

          <AccountPicker accounts={accounts} selectedId={toAccountId} onChange={setToAccountId} label="To Account" />
          <DatePickerField value={date} onChange={setDate} />

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={colors.gray400}
              style={[styles.textInput, { backgroundColor: isDark ? '#1F1F1F' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.border }]}
            />
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable onPress={handleSave} disabled={saving} style={[styles.primaryBtn, { backgroundColor: '#334155' }]}>
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Complete Transfer</Text>
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
  arrowContainer: { alignItems: 'center', marginVertical: -8 },
  arrowCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  fieldContainer: { marginBottom: 16, paddingHorizontal: 20 },
  fieldLabel: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '700', marginBottom: 8 },
  textInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontFamily: 'Nunito', fontWeight: '600' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32, borderTopWidth: 1 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14 },
  primaryBtnText: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700', color: '#FFFFFF' },
});
