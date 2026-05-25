// app/transaction/[id].tsx — Transaction Detail/Edit
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Trash2, Edit3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useTransactionStore } from '../../store/transactionStore';
import { useUIStore } from '../../store/uiStore';
import { Transaction } from '../../types/transaction.types';
import { CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';
import { TRANSACTION_COLORS } from '../../constants/colors';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';
import { fetchTransactionById } from '../../services/transaction.service';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const showToast = useUIStore((s) => s.showToast);

  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTransactionById(id)
        .then(setTx)
        .catch(() => showToast('Transaction not found', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(id as string);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              showToast('Transaction deleted', 'success');
              router.back();
            } catch (error: any) {
              showToast(error.message || 'Failed to delete', 'error');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!tx) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Transaction not found</Text>
      </View>
    );
  }

  const allCats = [...CATEGORIES, ...INCOME_CATEGORIES];
  const cat = allCats.find((c) => c.id === tx.category);
  const isIncome = tx.type === 'INCOME';
  const isTransfer = tx.type === 'TRANSFER';
  const amountColor = isIncome ? TRANSACTION_COLORS.income.text : isTransfer ? TRANSACTION_COLORS.transfer.text : TRANSACTION_COLORS.expense.text;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Transaction Detail</Text>
        <Pressable onPress={handleDelete} style={styles.headerBtn}>
          <Trash2 size={20} color="#DC2626" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Amount hero */}
        <View style={styles.amountSection}>
          <View style={[styles.iconLarge, { backgroundColor: cat?.color || '#F3F4F6' }]}>
            <Text style={styles.iconEmoji}>{cat?.icon || '📦'}</Text>
          </View>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {isIncome ? '+' : isTransfer ? '' : '-'}{formatINR(tx.amount)}
          </Text>
          <Text style={[styles.titleText, { color: colors.textPrimary }]}>{tx.title}</Text>
          <View style={[styles.typeBadge, { backgroundColor: amountColor + '20' }]}>
            <Text style={[styles.typeText, { color: amountColor }]}>{tx.type}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.detailCard, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderColor: colors.border }]}>
          {[
            { label: 'Date', value: formatDate(tx.date) },
            { label: 'Category', value: cat?.label || tx.category || '—' },
            { label: 'Account', value: tx.account?.name || '—' },
            ...(isTransfer ? [{ label: 'To Account', value: tx.toAccount?.name || '—' }] : []),
            { label: 'Note', value: tx.note || '—' },
          ].map((item, idx) => (
            <View key={idx} style={[styles.detailRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  scrollContent: { paddingBottom: 40 },
  amountSection: { alignItems: 'center', paddingVertical: 32 },
  iconLarge: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  iconEmoji: { fontSize: 32 },
  amountText: { fontSize: 36, fontFamily: 'SpaceGrotesk', fontWeight: '900', letterSpacing: -1, marginBottom: 8 },
  titleText: { fontSize: 18, fontFamily: 'Nunito', fontWeight: '700', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  typeText: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '700' },
  detailCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  detailLabel: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600' },
  detailValue: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
});
