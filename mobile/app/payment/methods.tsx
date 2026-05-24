import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Check, CreditCard, Wallet, Trash2, X } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const showToast = useUIStore((state) => state.showToast);
  const user = useAuthStore((state) => state.user);

  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal form states
  const [modalVisible, setModalVisible] = useState(false);
  const [newType, setNewType] = useState<'CARD' | 'UPI' | 'PAYPAL'>('CARD');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newLast4, setNewLast4] = useState('');

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const response = await api.get('/payments/methods');
      setMethods(response.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load payment methods.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleAddMethod = async () => {
    const trimmedName = newDisplayName.trim();
    if (!trimmedName) {
      showToast('Please enter a display name.', 'error');
      return;
    }

    if (newType === 'CARD' && newLast4.trim().length !== 4) {
      showToast('Please enter exactly 4 digits.', 'error');
      return;
    }

    try {
      const body = {
        type: newType,
        displayName: trimmedName,
        last4: newType === 'CARD' ? newLast4.trim() : undefined,
      };
      await api.post('/payments/methods', body);
      showToast('Payment method added successfully!', 'success');
      setModalVisible(false);
      setNewDisplayName('');
      setNewLast4('');
      fetchMethods();
    } catch (err: any) {
      showToast(err.message || 'Failed to add payment method.', 'error');
    }
  };

  const handleDeleteMethod = async (id: string) => {
    try {
      await api.delete(`/payments/methods/${id}`);
      showToast('Payment method removed successfully.', 'success');
      fetchMethods();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove payment method.', 'error');
    }
  };

  const getMethodColor = (type: string, index: number) => {
    const colorsList = ['#1C1C1E', '#1D4ED8', '#7C3AED', '#003087'];
    return colorsList[index % colorsList.length];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Payment Methods</Text>
        <Pressable onPress={() => setModalVisible(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Plus size={18} color={colors.primaryDeep} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Add new CTA */}
        <Pressable
          onPress={() => setModalVisible(true)}
          style={[styles.addNewCard, { borderColor: colors.primary }]}
        >
          <View style={[styles.addNewIcon, { backgroundColor: `${colors.primary}14` }]}>
            <Plus size={24} color={colors.primary} />
          </View>
          <Text style={[styles.addNewText, { color: colors.primary }]}>Add New Payment Method</Text>
        </Pressable>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>YOUR METHODS</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: 20 }} />
        ) : methods.length === 0 ? (
          <Card variant="glass" padding={20} style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito', fontSize: 13 }}>
              No payment methods saved. Add one to settle debts!
            </Text>
          </Card>
        ) : (
          methods.map((method, index) => (
            <View
              key={method.id}
              style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {/* Left — card visual */}
              <View style={[styles.cardVisual, { backgroundColor: getMethodColor(method.type, index) }]}>
                {method.type === 'CARD' ? (
                  <CreditCard size={20} color="#FFFFFF" />
                ) : (
                  <Wallet size={20} color="#FFFFFF" />
                )}
              </View>

              {/* Middle — info */}
              <View style={styles.methodInfo}>
                <Text style={[styles.methodName, { color: colors.textPrimary }]}>{method.displayName}</Text>
                <Text style={[styles.methodDetail, { color: colors.textSecondary }]}>
                  {method.type === 'CARD' ? `•••• ${method.last4 || '4679'}` : method.type}
                </Text>
              </View>

              {/* Right — delete button & default badge */}
              <View style={styles.rightActions}>
                {method.isDefault && (
                  <View style={[styles.defaultBadge, { backgroundColor: `${colors.primary}1A` }]}>
                    <Check size={10} color={colors.primary} />
                    <Text style={[styles.defaultText, { color: colors.primary }]}>Default</Text>
                  </View>
                )}
                <Pressable onPress={() => handleDeleteMethod(method.id)} style={styles.deleteBtn}>
                  <Trash2 size={16} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          ))
        )}

        {/* Info panel */}
        <View style={[styles.infoCard, { backgroundColor: colors.gray100 }]}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>🔒 Secure Payments</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your payment information is encrypted and never stored on our servers.
            We use bank-grade security protocols.
          </Text>
        </View>
      </ScrollView>

      {/* Add payment method modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <Pressable style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitleText, { color: colors.textPrimary }]}>Add Payment Method</Text>
                <Pressable onPress={() => setModalVisible(false)} style={styles.closeIcon}>
                  <X size={20} color={colors.textPrimary} />
                </Pressable>
              </View>

              {/* Method Type selection */}
              <View style={styles.typeSelectorRow}>
                {([
                  { id: 'CARD', label: 'Credit Card' },
                  { id: 'UPI', label: 'UPI ID' },
                  { id: 'PAYPAL', label: 'PayPal' },
                ] as const).map((type) => (
                  <Pressable
                    key={type.id}
                    onPress={() => setNewType(type.id)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: newType === type.id ? `${colors.primary}1A` : colors.gray100,
                        borderColor: newType === type.id ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.typeChipText, { color: newType === type.id ? colors.primary : colors.textSecondary }]}>
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Input
                label="Display Name"
                placeholder="e.g. My Visa Card, HDFC Account"
                value={newDisplayName}
                onChangeText={setNewDisplayName}
              />

              {newType === 'CARD' && (
                <Input
                  label="Last 4 Digits"
                  placeholder="e.g. 4321"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={newLast4}
                  onChangeText={setNewLast4}
                />
              )}

              <Button
                title="Add Payment Method"
                onPress={handleAddMethod}
                style={styles.modalSubmitBtn}
              />
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
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
  methodInfo: { flex: 1 },
  methodName: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginBottom: 2 },
  methodDetail: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '600' },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  defaultText: { fontSize: 10, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  deleteBtn: { padding: 4 },

  infoCard: { borderRadius: 16, padding: 16, marginTop: 8 },
  infoTitle: { fontSize: 14, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginBottom: 6 },
  infoText: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '600', lineHeight: 18 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleText: { fontSize: 18, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  closeIcon: { padding: 4 },
  typeSelectorRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
  },
  typeChipText: { fontSize: 12, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  modalSubmitBtn: { marginTop: 20 },
});
