import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  Pressable,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Moon,
  Volume2,
  BellRing,
  CreditCard,
  ChevronRight,
  LogOut,
  Check,
  Globe,
  Shield,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useGroupStore } from '../../store/groupStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { lightImpact, selectionClick, successNotification } = useHaptics();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateCurrency = useAuthStore((state) => state.updateCurrency);

  const groups = useGroupStore((state) => state.groups);

  const isDarkModeStore = useUIStore((state) => state.isDark);
  const setTheme = useUIStore((state) => state.setTheme);
  const showToast = useUIStore((state) => state.showToast);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencyLoading, setCurrencyLoading] = useState(false);

  const handleDarkToggle = (val: boolean) => {
    setTheme(val);
    if (hapticsEnabled) selectionClick();
  };

  const handleLogout = () => {
    if (hapticsEnabled) lightImpact();
    logout();
    showToast('Signed out successfully. See you soon!', 'info');
    router.replace('/(auth)/login');
  };

  const handleCurrencyChange = async (code: string) => {
    setCurrencyLoading(true);
    try {
      await api.patch('/auth/profile', { currency: code });
      updateCurrency(code);
      showToast(`Currency updated to ${code}!`, 'success');
      if (hapticsEnabled) successNotification();
    } catch (err: any) {
      // Update locally even if API fails
      updateCurrency(code);
      showToast(`Currency set to ${code}`, 'success');
    } finally {
      setCurrencyLoading(false);
      setCurrencyModalVisible(false);
    }
  };

  const avatarUrl = user?.avatar
    || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user?.name || 'User')}`;

  const currentCurrencyMeta = CURRENCIES.find((c) => c.code === (user?.currency || 'INR'));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Account & Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── User Profile Card ── */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileCardInner}>
            <View style={[styles.avatarFrame, { borderColor: colors.primary }]}>
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.profileMeta}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                {user?.name || 'User'}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user?.email || 'user@billsplit.io'}
              </Text>
              <View style={[styles.badge, { backgroundColor: `${colors.primary}18` }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>PREMIUM</Text>
              </View>
            </View>
          </View>

          {/* Quick stats */}
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{groups?.length || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Groups</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: (user?.balance || 0) >= 0 ? colors.success : colors.danger }]}>
                {(user?.balance || 0) >= 0 ? 'Clear' : 'Pending'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Balance</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{user?.currency || 'INR'}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Currency</Text>
            </View>
          </View>
        </View>

        {/* ── Preferences ── */}
        <Text style={[styles.groupTitle, { color: colors.textPrimary }]}>Preferences</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: '#1C1C1E' }]}>
                <Moon size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkModeStore}
              onValueChange={handleDarkToggle}
              trackColor={{ false: colors.gray200, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: '#7C3AED' }]}>
                <Volume2 size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Haptic Feedback</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={(v) => {
                setHapticsEnabled(v);
                if (v) successNotification();
              }}
              trackColor={{ false: colors.gray200, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: '#F59E0B' }]}>
                <BellRing size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.gray200, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ── Payment & Billing ── */}
        <Text style={[styles.groupTitle, { color: colors.textPrimary }]}>Payment & Billing</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          <Pressable
            style={styles.settingRow}
            onPress={() => router.push('/payment/methods' as any)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: '#3B82F6' }]}>
                <CreditCard size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Payment Methods</Text>
            </View>
            <ChevronRight size={16} color={colors.gray400} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            style={styles.settingRow}
            onPress={() => setCurrencyModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: '#22C55E' }]}>
                <Globe size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Base Currency</Text>
                <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>
                  {currentCurrencyMeta?.symbol} {currentCurrencyMeta?.name || 'Indian Rupee'}
                </Text>
              </View>
            </View>
            <View style={styles.currencyBadge}>
              <Text style={[styles.currencyBadgeText, { color: colors.primary }]}>{user?.currency || 'INR'}</Text>
            </View>
          </Pressable>
        </View>

        {/* ── Security info ── */}
        <View style={[styles.infoRow, { backgroundColor: colors.gray100 }]}>
          <Shield size={14} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            All transactions are protected with Bank-Grade TLS/SSL encryption.
          </Text>
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={[styles.logoutBtn, { borderColor: '#EF4444' }]}
        >
          <LogOut size={16} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </Pressable>

        <Text style={[styles.versionText, { color: colors.gray400 }]}>
          BillSplit v1.0.2 · Built with ❤️
        </Text>
      </ScrollView>

      {/* ── Currency Picker Modal ── */}
      <Modal visible={currencyModalVisible} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Choose Currency</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              All amounts will be displayed in the selected currency
            </Text>
            <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
              {CURRENCIES.map((c) => {
                const isSelected = (user?.currency || 'INR') === c.code;
                return (
                  <Pressable
                    key={c.code}
                    onPress={() => handleCurrencyChange(c.code)}
                    style={[
                      styles.currencyOption,
                      {
                        backgroundColor: isSelected ? `${colors.primary}14` : 'transparent',
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View>
                      <Text style={[styles.currencyCode, { color: colors.textPrimary }]}>
                        {c.symbol}  {c.code}
                      </Text>
                      <Text style={[styles.currencyName, { color: colors.textSecondary }]}>{c.name}</Text>
                    </View>
                    {isSelected && <Check size={18} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              onPress={() => setCurrencyModalVisible(false)}
              style={[styles.modalCloseBtn, { backgroundColor: colors.gray100 }]}
            >
              <Text style={[styles.modalCloseBtnText, { color: colors.textPrimary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontFamily: 'SpaceGrotesk', fontWeight: '800' },
  headerSubtitle: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600', marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  profileCardInner: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  avatarFrame: { width: 70, height: 70, borderRadius: 35, borderWidth: 2.5, padding: 2 },
  avatarImage: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#F3F4F6' },
  profileMeta: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 18, fontFamily: 'SpaceGrotesk', fontWeight: '800', marginBottom: 2 },
  profileEmail: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '600', marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontFamily: 'SpaceGrotesk', fontWeight: '800' },

  statsRow: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600' },
  statDivider: { width: 1, marginVertical: 4 },

  groupTitle: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  settingsCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '700' },
  settingSubLabel: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600', marginTop: 1 },
  divider: { height: 1, marginHorizontal: 16, opacity: 0.5 },

  currencyBadge: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#F0FDF4', borderRadius: 8 },
  currencyBadgeText: { fontSize: 13, fontFamily: 'SpaceGrotesk', fontWeight: '700' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 20,
  },
  infoText: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600', flex: 1, lineHeight: 16 },

  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  logoutBtnText: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '700', color: '#EF4444' },
  versionText: { fontSize: 11, fontFamily: 'Nunito', fontWeight: '600', textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'SpaceGrotesk', fontWeight: '800', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, fontFamily: 'Nunito', fontWeight: '600', marginBottom: 16, lineHeight: 20 },
  currencyList: { maxHeight: 360 },
  currencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  currencyCode: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '700', marginBottom: 2 },
  currencyName: { fontSize: 12, fontFamily: 'Nunito', fontWeight: '600' },
  modalCloseBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  modalCloseBtnText: { fontSize: 15, fontFamily: 'SpaceGrotesk', fontWeight: '700' },
});
