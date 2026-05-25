// components/transactions/TransactionFilter.tsx
import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { TransactionType } from '../../types/transaction.types';

interface TransactionFilterProps {
  selected: TransactionType | null;
  onChange: (type: TransactionType | null) => void;
}

const FILTERS: Array<{ type: TransactionType | null; label: string }> = [
  { type: null, label: 'All' },
  { type: 'INCOME', label: 'Income' },
  { type: 'EXPENSE', label: 'Expense' },
  { type: 'TRANSFER', label: 'Transfer' },
];

export default function TransactionFilter({ selected, onChange }: TransactionFilterProps) {
  const { colors, isDark } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {FILTERS.map((filter) => {
        const isActive = selected === filter.type;
        return (
          <Pressable
            key={filter.label}
            onPress={() => onChange(filter.type)}
            style={[
              styles.pill,
              {
                backgroundColor: isActive ? colors.primary : (isDark ? '#1F1F1F' : '#F3F4F6'),
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: isActive ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Nunito',
    fontWeight: '700',
  },
});
