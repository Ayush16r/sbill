// components/forms/CategoryPicker.tsx
import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Category, CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';

interface CategoryPickerProps {
  selected: string | null;
  onChange: (categoryId: string) => void;
  type?: 'expense' | 'income';
}

export default function CategoryPicker({ selected, onChange, type = 'expense' }: CategoryPickerProps) {
  const { colors, isDark } = useTheme();
  const categories = type === 'income' ? INCOME_CATEGORIES : CATEGORIES;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {categories.map((cat) => {
            const isSelected = selected === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => onChange(cat.id)}
                style={[
                  styles.categoryItem,
                  {
                    backgroundColor: isSelected ? cat.color : (isDark ? '#1F1F1F' : '#F9FAFB'),
                    borderColor: isSelected ? colors.primary : 'transparent',
                    borderWidth: isSelected ? 2 : 0,
                    transform: [{ scale: isSelected ? 1.05 : 1 }],
                  },
                ]}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    { color: isSelected ? colors.textPrimary : colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Nunito',
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: 10,
    fontFamily: 'Nunito',
    fontWeight: '700',
    textAlign: 'center',
  },
});
