// components/forms/AccountPicker.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, FlatList } from 'react-native';
import { ChevronDown, Building2, Wallet, Banknote, CreditCard, Smartphone } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Account, AccountType } from '../../types/account.types';

interface AccountPickerProps {
  accounts: Account[];
  selectedId: string | null;
  onChange: (accountId: string) => void;
  label?: string;
}

const ACCOUNT_ICONS: Record<AccountType, typeof Building2> = {
  BANK: Building2,
  WALLET: Wallet,
  CASH: Banknote,
  CREDIT_CARD: CreditCard,
  UPI: Smartphone,
};

export default function AccountPicker({ accounts, selectedId, onChange, label = 'Account' }: AccountPickerProps) {
  const { colors, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const selected = accounts.find((a) => a.id === selectedId);

  const getIcon = (type: AccountType) => {
    const Icon = ACCOUNT_ICONS[type] || Wallet;
    return <Icon size={18} color={colors.primary} />;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Pressable
        onPress={() => setVisible(true)}
        style={[styles.selector, { backgroundColor: isDark ? '#1F1F1F' : '#F9FAFB', borderColor: colors.border }]}
      >
        {selected ? (
          <View style={styles.selectedRow}>
            {getIcon(selected.type)}
            <Text style={[styles.selectedText, { color: colors.textPrimary }]}>
              {selected.name}
            </Text>
          </View>
        ) : (
          <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Select account</Text>
        )}
        <ChevronDown size={16} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={[styles.sheet, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Select {label}</Text>
            <FlatList
              data={accounts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId;
                return (
                  <Pressable
                    onPress={() => { onChange(item.id); setVisible(false); }}
                    style={[styles.accountRow, isSelected && { backgroundColor: isDark ? '#14532D' : '#F0FDF4' }]}
                  >
                    {getIcon(item.type)}
                    <View style={styles.accountInfo}>
                      <Text style={[styles.accountName, { color: colors.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.accountBalance, { color: colors.textSecondary }]}>
                        ₹{item.balance.toFixed(2)}{item.accountLast4 ? ` · ****${item.accountLast4}` : ''}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No accounts yet. Add one from your profile.
                </Text>
              }
            />
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedText: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700' },
  placeholder: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '60%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF', alignSelf: 'center', marginVertical: 12 },
  sheetTitle: { fontSize: 16, fontFamily: 'SpaceGrotesk', fontWeight: '700', paddingHorizontal: 20, marginBottom: 16 },
  accountRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700' },
  accountBalance: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '600', marginTop: 2 },
  checkmark: { fontSize: 16, color: '#22C55E', fontWeight: '700' },
  emptyText: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600', textAlign: 'center', padding: 20 },
});
