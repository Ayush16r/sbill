// components/forms/DatePicker.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, Platform } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  maxDate?: Date;
  label?: string;
}

export default function DatePickerField({ value, onChange, maxDate, label = 'Date' }: DatePickerProps) {
  const { colors, isDark } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const formatDisplayDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (compareDate.getTime() === today.getTime()) return 'Today';

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Simple date selector with quick options
  const quickDates = [
    { label: 'Today', date: new Date() },
    { label: 'Yesterday', date: new Date(Date.now() - 86400000) },
    { label: '2 days ago', date: new Date(Date.now() - 2 * 86400000) },
    { label: '3 days ago', date: new Date(Date.now() - 3 * 86400000) },
    { label: 'Last week', date: new Date(Date.now() - 7 * 86400000) },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={[styles.selector, { backgroundColor: isDark ? '#1F1F1F' : '#F9FAFB', borderColor: colors.border }]}
      >
        <Calendar size={16} color={colors.primary} />
        <Text style={[styles.dateText, { color: colors.textPrimary }]}>
          {formatDisplayDate(value)}
        </Text>
      </Pressable>

      <Modal visible={showPicker} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowPicker(false)}>
          <View style={[styles.sheet, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Select Date</Text>
            {quickDates.map((item) => {
              const isSelected = value.toDateString() === item.date.toDateString();
              const isDisabled = maxDate && item.date > maxDate;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    if (!isDisabled) {
                      onChange(item.date);
                      setShowPicker(false);
                    }
                  }}
                  style={[
                    styles.quickItem,
                    isSelected && { backgroundColor: isDark ? '#14532D' : '#F0FDF4' },
                    isDisabled && { opacity: 0.4 },
                  ]}
                >
                  <Text style={[styles.quickLabel, { color: isSelected ? colors.primary : colors.textPrimary }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.quickDate, { color: colors.textSecondary }]}>
                    {item.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16, paddingHorizontal: 20 },
  label: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '700', marginBottom: 8 },
  selector: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  dateText: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF', alignSelf: 'center', marginVertical: 12 },
  sheetTitle: { fontSize: 16, fontFamily: 'SpaceGrotesk', fontWeight: '700', paddingHorizontal: 20, marginBottom: 12 },
  quickItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  quickLabel: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700' },
  quickDate: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '600' },
});
