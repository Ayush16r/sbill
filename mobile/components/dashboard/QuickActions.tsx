// components/dashboard/QuickActions.tsx
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Minus, Plus, ArrowLeftRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { TRANSACTION_COLORS } from '../../constants/colors';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      type: 'expense' as const,
      label: 'Expense',
      icon: Minus,
      bg: TRANSACTION_COLORS.expense.bg,
      color: TRANSACTION_COLORS.expense.text,
      route: '/expense/personal',
    },
    {
      type: 'income' as const,
      label: 'Income',
      icon: Plus,
      bg: TRANSACTION_COLORS.income.bg,
      color: TRANSACTION_COLORS.income.text,
      route: '/income/add',
    },
    {
      type: 'transfer' as const,
      label: 'Transfer',
      icon: ArrowLeftRight,
      bg: TRANSACTION_COLORS.transfer.bg,
      color: TRANSACTION_COLORS.transfer.text,
      route: '/transfer',
    },
  ];

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      {actions.map((action) => {
        const IconComponent = action.icon;
        return (
          <Pressable
            key={action.type}
            onPress={() => handlePress(action.route)}
            style={[styles.pill, { backgroundColor: action.bg }]}
            accessibilityLabel={`Add ${action.label}`}
          >
            <IconComponent size={16} color={action.color} />
            <Text style={[styles.pillText, { color: action.color }]}>{action.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 28,
    gap: 6,
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Nunito',
    fontWeight: '700',
  },
});
