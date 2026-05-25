// components/dashboard/MonthSelector.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, FlatList } from 'react-native';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { getMonthLabel, getLastNMonths } from '../../utils/dateHelpers';

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export default function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  const { colors, isDark } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const months = getLastNMonths(12);

  const goToPrev = () => {
    if (month === 1) {
      onChange(12, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const goToNext = () => {
    const now = new Date();
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    // Don't go past current month
    if (nextYear > now.getFullYear() || (nextYear === now.getFullYear() && nextMonth > now.getMonth() + 1)) {
      return;
    }
    onChange(nextMonth, nextYear);
  };

  const label = getMonthLabel(month, year);

  return (
    <View style={styles.container}>
      <Pressable onPress={goToPrev} style={styles.arrowBtn} accessibilityLabel="Previous month">
        <ChevronLeft size={20} color={colors.textPrimary} />
      </Pressable>

      <Pressable
        onPress={() => setShowDropdown(true)}
        style={[styles.labelBtn, { backgroundColor: isDark ? '#1F1F1F' : '#F3F4F6' }]}
        accessibilityLabel="Select month"
      >
        <Text style={[styles.labelText, { color: colors.textPrimary }]}>{label}</Text>
        <ChevronDown size={14} color={colors.textSecondary} />
      </Pressable>

      <Pressable onPress={goToNext} style={styles.arrowBtn} accessibilityLabel="Next month">
        <ChevronRight size={20} color={colors.textPrimary} />
      </Pressable>

      <Modal visible={showDropdown} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowDropdown(false)}>
          <View style={[styles.dropdown, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderColor: colors.border }]}>
            <FlatList
              data={months}
              keyExtractor={(item) => `${item.month}-${item.year}`}
              renderItem={({ item }) => {
                const isSelected = item.month === month && item.year === year;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.month, item.year);
                      setShowDropdown(false);
                    }}
                    style={[
                      styles.dropdownItem,
                      isSelected && { backgroundColor: isDark ? '#14532D' : '#F0FDF4' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        { color: isSelected ? colors.primary : colors.textPrimary },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  labelText: {
    fontSize: 15,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    width: 260,
    maxHeight: 400,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'Nunito',
    fontWeight: '600',
  },
});
