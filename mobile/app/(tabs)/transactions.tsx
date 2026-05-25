// app/(tabs)/transactions.tsx — Full Transactions List
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTransactionStore } from '../../store/transactionStore';
import { TransactionType } from '../../types/transaction.types';
import { groupByDate } from '../../utils/dateHelpers';
import TransactionCard from '../../components/transactions/TransactionCard';
import TransactionFilter from '../../components/transactions/TransactionFilter';
import MonthSelector from '../../components/dashboard/MonthSelector';

export default function TransactionsScreen() {
  const { colors, isDark } = useTheme();
  const {
    transactions,
    loading,
    selectedMonth,
    fetchTransactions,
    setSelectedMonth,
    setFilters,
    clearFilters,
  } = useTransactionStore();

  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TransactionType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const handleTypeFilter = (type: TransactionType | null) => {
    setTypeFilter(type);
    if (type) {
      setFilters({ type });
    } else {
      clearFilters();
    }
    fetchTransactions(type ? { type } : undefined);
  };

  // Filter by search query
  const filtered = searchQuery
    ? transactions.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : transactions;

  const grouped = groupByDate(filtered);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Transactions</Text>
      </View>

      <MonthSelector
        month={selectedMonth.month}
        year={selectedMonth.year}
        onChange={setSelectedMonth}
      />

      <TransactionFilter selected={typeFilter} onChange={handleTypeFilter} />

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1F1F1F' : '#F3F4F6' }]}>
        <Search size={16} color={colors.textSecondary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search transactions..."
          placeholderTextColor={colors.gray400}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
      </View>

      <FlatList
        data={grouped}
        keyExtractor={(item) => item.title}
        renderItem={({ item: group }) => (
          <View>
            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>{group.title}</Text>
            {group.data.map((tx) => (
              <View key={tx.id} style={styles.cardWrapper}>
                <TransactionCard transaction={tx} />
              </View>
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💸</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No transactions found for this period.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 4 },
  headerTitle: { fontSize: 24, fontFamily: 'SpaceGrotesk', fontWeight: '800' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Nunito', fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  groupTitle: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 4,
  },
  cardWrapper: { paddingLeft: 0 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '600', textAlign: 'center' },
});
