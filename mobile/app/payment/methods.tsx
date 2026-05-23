import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Check, CreditCard, Wallet } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet';
  name: string;
  detail: string;
  brand?: string;
  isDefault: boolean;
  color: string;
}

const DEMO_METHODS: PaymentMethod[] = [
  { id: '1', type: 'card', name: 'Personal Card', detail: '•••• 4679', brand: 'mastercard', isDefault: true, color: '#1C1C1E' },
  { id: '2', type: 'card', name: 'Visa Card', detail: '•••• 2345', brand: 'visa', isDefault: false, color: '#1D4ED8' },
  { id: '3', type: 'card', name: 'Mastercard', detail: '•••• 9076', brand: 'mastercard', isDefault: false, color: '#7C3AED' },
  { id: '4', type: 'wallet', name: 'PayPal', detail: 'james@example.com', isDefault: false, color: '#003087' },
];

const BRAND_LABELS: Record<string, string> = {
  visa: 'VISA',
  mastercard: '◉◎',
};

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const showToast = useUIStore((state) => state.showToast);
  const user = useAuthStore((state) => state.user);

  const [methods, setMethods] = useState(DEMO_METHODS);

  const handleSetDefault = (id: string) => {
    setMethods(methods.map((m) => ({ ...m, isDefault: m.id === id })));
    showToast('Default payment method updated!', 'success');
  };

  const handleAddNew = () => {
    showToast('Add payment method — coming soon!', 'info');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Payment Methods</Text>
        <Pressable onPress={handleAddNew} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Plus size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Add new CTA */}
        <Pressable
          onPress={handleAddNew}
          style={[styles.addNewCard, { borderColor: colors.primary }]}
        >
          <View style={[styles.addNewIcon, { backgroundColor: `${colors.primary}14` }]}>
            <Plus size={24} color={colors.primary} />
          </View>
          <Text style={[styles.addNewText, { color: colors.primary }]}>Add New Payment Method</Text>
        </Pressable>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>YOUR METHODS</Text>

        {/* Payment methods list */}
        {methods.map((method) => (
          <View
            key={method.id}
            style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {/* Left — card visual */}
            <View style={[styles.cardVisual, { backgroundColor: method.color }]}>
              {method.type === 'card' ? (
                <Text style={styles.brandLabel}>{BRAND_LABELS[method.brand || ''] || '▣'}</Text>
              ) : (
                <Wallet size={20} color="#FFFFFF" />
              )}
            </View>

            {/* Middle — info */}
            <View style={styles.methodInfo}>
              <Text style={[styles.methodName, { color: colors.textPrimary }]}>{method.name}</Text>
              <Text style={[styles.methodDetail, { color: colors.textSecondary }]}>{method.detail}</Text>
            </View>

            {/* Right — default toggle */}
            <Pressable
              onPress={() => handleSetDefault(method.id)}
              style={[
                styles.defaultBadge,
                {
                  backgroundColor: method.isDefault ? `${colors.primary}14` : colors.gray100,
                  borderColor: method.isDefault ? colors.primary : 'transparent',
                },
              ]}
            >
              {method.isDefault && <Check size={12} color={colors.primary} />}
              <Text style={[styles.defaultBadgeText, { color: method.isDefault ? colors.primary : colors.textSecondary }]}>
                {method.isDefault ? 'Default' : 'Set default'}
              </Text>
            </Pressable>
          </View>
        ))}

        {/* Info panel */}
        <View style={[styles.infoCard, { backgroundColor: colors.gray100 }]}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>🔒 Secure Payments</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your payment information is encrypted and never stored on our servers.
            We use bank-grade security protocols.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  addBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  addNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    gap: 14,
  },
  addNewIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  addNewText: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '700' },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardVisual: {
    width: 52,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLabel: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '900', color: '#FFFFFF' },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginBottom: 2 },
  methodDetail: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '600' },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  defaultBadgeText: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '700' },

  infoCard: { borderRadius: 16, padding: 16, marginTop: 8 },
  infoTitle: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginBottom: 6 },
  infoText: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '600', lineHeight: 18 },
});
