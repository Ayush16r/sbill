// app/budget/index.tsx — Budget Planner
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, RefreshControl, TextInput, Modal } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useBudgetStore } from '../../store/budgetStore';
import { useUIStore } from '../../store/uiStore';
import { CATEGORIES } from '../../constants/categories';
import BudgetProgressCard from '../../components/budget/BudgetProgressCard';

export default function BudgetScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { budgets, loading, fetchBudgets, addBudget } = useBudgetStore();
  const showToast = useUIStore((s) => s.showToast);

  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState('');
  const [newName, setNewName] = useState('');

  useFocusEffect(useCallback(() => { fetchBudgets(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBudgets();
    setRefreshing(false);
  };

  const handleAddBudget = async () => {
    if (!newCategory || !newAmount || !newName) {
      showToast('Fill all fields', 'error');
      return;
    }
    const parsedAmount = parseFloat(newAmount);
    if (parsedAmount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }
    try {
      await addBudget({ category: newCategory, name: newName, amount: parsedAmount });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Budget created! 🎯', 'success');
      setShowAddModal(false);
      setNewCategory(null);
      setNewAmount('');
      setNewName('');
      fetchBudgets();
    } catch (error: any) {
      showToast(error.message || 'Failed to create budget', 'error');
    }
  };

  // Find categories not yet budgeted
  const budgetedCategories = budgets.map((b) => b.category);
  const availableCategories = CATEGORIES.filter((c) => !budgetedCategories.includes(c.id));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Budget Planner</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No budgets yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Create budgets to track your spending limits per category
            </Text>
          </View>
        ) : (
          budgets.map((budget) => <BudgetProgressCard key={budget.id} budget={budget} />)
        )}

        <Pressable
          onPress={() => setShowAddModal(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add New Budget</Text>
        </Pressable>
      </ScrollView>

      {/* Add Budget Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAddModal(false)}>
          <View style={[styles.sheet, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Create Budget</Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {availableCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => { setNewCategory(cat.id); setNewName(cat.label); }}
                  style={[styles.catItem, {
                    backgroundColor: newCategory === cat.id ? cat.color : (isDark ? '#2A2A2A' : '#F3F4F6'),
                    borderColor: newCategory === cat.id ? colors.primary : 'transparent',
                    borderWidth: newCategory === cat.id ? 2 : 0,
                  }]}
                >
                  <Text style={styles.catEmoji}>{cat.icon}</Text>
                  <Text style={[styles.catLabel, { color: colors.textPrimary }]}>{cat.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Budget Name</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g., Food & Dining"
              placeholderTextColor={colors.gray400}
              style={[styles.input, { backgroundColor: isDark ? '#1F1F1F' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.border }]}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Monthly Limit (₹)</Text>
            <TextInput
              value={newAmount}
              onChangeText={setNewAmount}
              placeholder="5000"
              placeholderTextColor={colors.gray400}
              keyboardType="numeric"
              style={[styles.input, { backgroundColor: isDark ? '#1F1F1F' : '#F9FAFB', color: colors.textPrimary, borderColor: colors.border }]}
            />

            <Pressable onPress={handleAddBudget} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveBtnText}>Create Budget</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginBottom: 4 },
  emptyText: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 12 },
  addBtnText: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700', color: '#FFFFFF' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '700', marginBottom: 8, marginTop: 12 },
  catScroll: { marginBottom: 8 },
  catItem: { width: 68, height: 68, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  catEmoji: { fontSize: 22 },
  catLabel: { fontSize: 9, fontFamily: 'Nunito', fontWeight: '700', marginTop: 2, textAlign: 'center' },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontFamily: 'Nunito', fontWeight: '600' },
  saveBtn: { marginTop: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700', color: '#FFFFFF' },
});
