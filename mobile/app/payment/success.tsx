import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withDelay, 
  withRepeat, 
  withTiming 
} from 'react-native-reanimated';
import { Check, ShieldCheck, Share2 } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/currency';

export default function PaymentSuccessScreen() {
  const { amount, toName, groupName, groupId } = useLocalSearchParams<{
    amount: string;
    toName: string;
    groupName: string;
    groupId: string;
  }>();

  const router = useRouter();
  const { colors } = useTheme();
  const { successNotification } = useHaptics();
  const user = useAuthStore((state) => state.user);

  // Animation values
  const checkScale = useSharedValue(0);
  const ringScale = useSharedValue(0.8);
  const ringOpacity = useSharedValue(0.6);
  const cardTranslateY = useSharedValue(50);
  const cardOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Trigger haptic feedback
    successNotification();

    // 2. Animate checkmark popping in
    checkScale.value = withDelay(
      200, 
      withSpring(1, { damping: 8, stiffness: 120 })
    );

    // 3. Animate outer pulsing ring
    ringScale.value = withDelay(
      500,
      withRepeat(
        withTiming(1.4, { duration: 1500 }),
        -1,
        false
      )
    );
    ringOpacity.value = withDelay(
      500,
      withRepeat(
        withTiming(0, { duration: 1500 }),
        -1,
        false
      )
    );

    // 4. Slide up card details
    cardTranslateY.value = withDelay(
      600,
      withSpring(0, { damping: 12, stiffness: 100 })
    );
    cardOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 500 })
    );

    // 5. Fade in button
    buttonScale.value = withDelay(
      1000,
      withSpring(1, { damping: 10, stiffness: 120 })
    );
    buttonOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 400 })
    );
  }, []);

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
    opacity: cardOpacity.value,
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
  }));

  // Create a mock transaction ID for receipts
  const mockTxId = `BS-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleReturn = () => {
    if (groupId) {
      router.replace(`/group/${groupId}`);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Upper pulsing visual illustration */}
      <View style={styles.animationHeader}>
        {/* Pulsing ring behind checkmark */}
        <Animated.View 
          style={[
            styles.pulseRing, 
            { borderColor: colors.primary },
            animatedRingStyle
          ]} 
        />
        
        {/* Glowing Checkmark background */}
        <Animated.View 
          style={[
            styles.checkCircle, 
            { backgroundColor: colors.primary, shadowColor: colors.primary },
            animatedCheckStyle
          ]}
        >
          <Check size={48} color={colors.primaryDeep} strokeWidth={3} />
        </Animated.View>
        
        <Text style={[styles.successText, { color: colors.primary }]}>Payment Complete</Text>
        <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
          Your debt is officially settled
        </Text>
      </View>

      {/* Glassmorphic Transaction Receipt Details */}
      <Animated.View style={[styles.cardWrapper, animatedCardStyle]}>
        <Card variant="glow" padding={24} style={styles.receiptCard}>
          <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
            Amount Settled
          </Text>
          <Text style={[styles.amountValue, { color: colors.textPrimary }]}>
            {formatCurrency(parseFloat(amount || '0'), user?.currency || 'USD')}
          </Text>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.receiptDetails}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Paid To</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{toName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Group</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{groupName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${colors.success}1A` }]}>
                <ShieldCheck size={12} color={colors.success} style={styles.badgeIcon} />
                <Text style={[styles.statusText, { color: colors.success }]}>VERIFIED</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reference ID</Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary, fontFamily: 'SpaceGrotesk' }]}>
                {mockTxId}
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View style={[styles.buttonWrapper, animatedButtonStyle]}>
        <Button
          title="Back to Group"
          variant="primary"
          onPress={handleReturn}
          style={styles.actionBtn}
        />
        
        <Pressable 
          style={styles.shareBtn}
          accessibilityRole="button"
          accessibilityLabel="Share receipt"
        >
          <Share2 size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.shareBtnText, { color: colors.textSecondary }]}>
            Share Receipt
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  animationHeader: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    top: 5,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successText: {
    fontSize: 22,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito',
    fontWeight: '600',
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 32,
  },
  receiptCard: {
    width: '100%',
  },
  receiptLabel: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 18,
    opacity: 0.1,
  },
  receiptDetails: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  actionBtn: {
    marginBottom: 16,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  shareBtnText: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '700',
  },
});
