// components/expense/ExpenseCard.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { CATEGORIES } from '../../constants/categories';
import { useHaptics } from '../../hooks/useHaptics';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateHelpers';

export interface ExpenseCardProps {
  /**
   * Title / merchant name of the expense.
   */
  title: string;
  /**
   * Total transaction amount.
   */
  amount: number;
  /**
   * Name of the member who paid. E.g., "You" or "Jane Doe".
   */
  paidBy: string;
  /**
   * Total number of people splitting this expense.
   */
  splitCount: number;
  /**
   * Category key matching the CATEGORIES constant (e.g., 'food', 'travel').
   */
  category: string;
  /**
   * Date or ISO string of the transaction.
   */
  date: Date | string;
  /**
   * Amount the current user owes for this expense:
   * - Positive (> 0): Current user owes others (e.g. $10.00).
   * - Negative (< 0): Current user is owed back / get back (e.g. -$25.00).
   * - Zero (= 0): Current user is not involved or fully settled.
   */
  userOwes: number;
  /**
   * Currency ISO code. Defaults to 'USD'.
   */
  currencyCode?: string;
  /**
   * Callback fired on card press / click.
   */
  onPress?: () => void;
  /**
   * Callback fired on long press (e.g., to open options bottom sheet).
   */
  onLongPress?: () => void;
  /**
   * Unique test identifier for automated tests.
   */
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  title,
  amount,
  paidBy,
  splitCount,
  category,
  date,
  userOwes,
  currencyCode = 'INR',
  onPress,
  onLongPress,
  testID,
}) => {
  const { isDark, colors } = useTheme();
  const { lightImpact, heavyImpact } = useHaptics();

  // Find category details or fallback to 'other'
  const categoryInfo = useMemo(() => {
    const matched = CATEGORIES.find((c) => c.id.toLowerCase() === category.toLowerCase());
    return matched || CATEGORIES.find((c) => c.id === 'other') || {
      id: 'other',
      label: 'Other',
      icon: '📦',
      color: '#F3F4F6',
    };
  }, [category]);

  // Format currency displays
  const formattedTotal = useMemo(() => formatCurrency(amount, currencyCode), [amount, currencyCode]);
  const formattedOwes = useMemo(() => formatCurrency(Math.abs(userOwes), currencyCode), [userOwes, currencyCode]);
  const formattedDate = useMemo(() => formatDate(date), [date]);

  // Elastic Scale Animation for tactile touch feedback
  const scale = useSharedValue(1);

  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
    lightImpact();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handleLongPress = () => {
    heavyImpact();
    if (onLongPress) {
      onLongPress();
    }
  };

  // Determine split accessibility text
  const splitText = splitCount > 1 ? `split with ${splitCount - 1} others` : 'not split';

  // Build accessibility label for screen readers (WCAG 2.1 AA Compliance)
  const accessibilityLabelText = useMemo(() => {
    let owesDescription = 'settled balance';
    if (userOwes > 0) {
      owesDescription = `you owe ${formattedOwes}`;
    } else if (userOwes < 0) {
      owesDescription = `you get back ${formattedOwes}`;
    }
    return `Expense: ${title}, total amount ${formattedTotal}, paid by ${paidBy}, ${splitText}, date ${formattedDate}. Status: ${owesDescription}. Double tap to view details. Long press for options.`;
  }, [title, formattedTotal, paidBy, splitText, formattedDate, userOwes, formattedOwes]);

  // Subtitle string for paidBy status
  const subtitleText = useMemo(() => {
    const payPrefix = paidBy.toLowerCase() === 'you' ? 'You paid' : `${paidBy} paid`;
    return `${payPrefix} • ${splitCount} splitting`;
  }, [paidBy, splitCount]);

  return (
    <AnimatedPressable
      testID={testID}
      entering={FadeInUp.duration(300).delay(50)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabelText}
      accessibilityHint="Opens full details and split calculator for this expense."
      accessibilityState={{
        expanded: false,
      }}
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
          shadowColor: colors.cardGlow,
        },
        animatedPressStyle,
      ]}
    >
      <View style={styles.leftSection}>
        {/* Category Icon with Custom Background Chip */}
        <View 
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDark 
                ? `${categoryInfo.color}1E` // 12% opacity in dark mode for soft glowing glass effect
                : categoryInfo.color,
            }
          ]}
        >
          <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
        </View>

        {/* Expense Info Details */}
        <View style={styles.textContainer}>
          <Text 
            numberOfLines={1} 
            ellipsizeMode="tail"
            style={[styles.titleText, { color: colors.textPrimary }]}
          >
            {title}
          </Text>
          
          <Text 
            numberOfLines={1} 
            ellipsizeMode="tail"
            style={[styles.subtitleText, { color: colors.textSecondary }]}
          >
            {subtitleText}
          </Text>
          
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {formattedDate}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* Main Amount */}
        <Text style={[styles.amountText, { color: colors.textPrimary }]}>
          {formattedTotal}
        </Text>

        {/* Dynamic Debt/Balance Badge */}
        {userOwes > 0 && (
          <View style={[styles.badge, styles.owesBadge, { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : colors.dangerBg }]}>
            <Text style={[styles.badgeText, styles.owesBadgeText, { color: colors.danger }]}>
              you owe {formattedOwes}
            </Text>
          </View>
        )}

        {userOwes < 0 && (
          <View style={[styles.badge, styles.owedBadge, { backgroundColor: isDark ? 'rgba(74, 222, 128, 0.15)' : colors.successBg }]}>
            <Text style={[styles.badgeText, styles.owedBadgeText, { color: isDark ? colors.primary : colors.success }]}>
              get back {formattedOwes}
            </Text>
          </View>
        )}

        {userOwes === 0 && (
          <View style={[styles.badge, styles.settledBadge, { backgroundColor: isDark ? colors.dark300 : colors.gray100 }]}>
            <Text style={[styles.badgeText, styles.settledBadgeText, { color: colors.gray600 }]}>
              settled
            </Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 6,
    marginHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  categoryIcon: {
    fontSize: 22,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  titleText: {
    fontFamily: 'SpaceGrotesk', // space grotesk font for main titles/numbers
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subtitleText: {
    fontFamily: 'Nunito', // nunito for labels and helper texts
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateText: {
    fontFamily: 'Nunito',
    fontSize: 10,
    fontWeight: '400',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontFamily: 'SpaceGrotesk',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  owesBadge: {
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  owedBadge: {
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderColor: 'rgba(74, 222, 128, 0.25)',
  },
  settledBadge: {},
  badgeText: {
    fontFamily: 'SpaceGrotesk',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  owesBadgeText: {},
  owedBadgeText: {},
  settledBadgeText: {},
});

export default ExpenseCard;
