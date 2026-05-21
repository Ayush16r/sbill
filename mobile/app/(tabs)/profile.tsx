import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Switch, Pressable, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  User, 
  Mail, 
  Phone, 
  DollarSign, 
  Moon, 
  Volume2, 
  BellRing, 
  CreditCard, 
  ShieldAlert, 
  LogOut, 
  ChevronRight, 
  Group 
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useGroupStore } from '../../store/groupStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { lightImpact, selectionClick, successNotification } = useHaptics();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const groups = useGroupStore((state) => state.groups);
  
  const isDarkModeStore = useUIStore((state) => state.isDark);
  const setTheme = useUIStore((state) => state.setTheme);
  const showToast = useUIStore((state) => state.showToast);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const handleDarkToggle = (val: boolean) => {
    setTheme(val);
    if (hapticsEnabled) {
      selectionClick();
    }
  };

  const handleNotificationsToggle = (val: boolean) => {
    setNotificationsEnabled(val);
    if (hapticsEnabled) {
      selectionClick();
    }
  };

  const handleHapticsToggle = (val: boolean) => {
    setHapticsEnabled(val);
    if (val) {
      successNotification();
    }
  };

  const handleLogout = () => {
    if (hapticsEnabled) {
      lightImpact();
    }
    logout();
    showToast('Signed out successfully. See you soon!', 'info');
    router.replace('/(auth)/login');
  };

  // Mock avatar seed
  const avatarUrl = user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user?.name || 'User')}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Account Profile</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Settings & Session</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card Profile details */}
        <Card variant="glow" padding={20} style={styles.userCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatarFrame, { borderColor: colors.primary }]}>
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.avatarImage} 
                resizeMode="cover"
              />
            </View>
            <View style={styles.profileMeta}>
              <Text style={[styles.userNameText, { color: colors.textPrimary }]}>
                {user?.name || 'Active Member'}
              </Text>
              <Text style={[styles.userEmailText, { color: colors.textSecondary }]}>
                {user?.email || 'member@billsplit.io'}
              </Text>
              <View style={[styles.badge, { backgroundColor: `${colors.primary}1A` }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  PREMIUM FINTECH
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Small Statistics Grid */}
        <View style={styles.statsRow}>
          <Card variant="glass" padding={12} style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Groups</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {groups?.length || 2}
            </Text>
          </Card>
          
          <Card variant="glass" padding={12} style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Net Standings</Text>
            <Text style={[
              styles.statValue, 
              { color: (user?.balance || 0) >= 0 ? colors.success : colors.danger }
            ]}>
              {(user?.balance || 0) >= 0 ? 'Clear' : 'Pending'}
            </Text>
          </Card>

          <Card variant="glass" padding={12} style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Currency</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {user?.currency || 'USD'}
            </Text>
          </Card>
        </View>

        {/* Settings Group 1: Preferences */}
        <Text style={[styles.settingsGroupTitle, { color: colors.textPrimary }]}>Preferences</Text>

        <Card variant="glass" padding={16} style={styles.settingsCard}>
          {/* Dark Mode Switch */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelCol}>
              <Moon size={18} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabelText, { color: colors.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkModeStore}
              onValueChange={handleDarkToggle}
              trackColor={{ false: colors.dark300, true: colors.primary }}
              thumbColor={isDark ? colors.black : colors.white}
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

          {/* Tactile Haptics Switch */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelCol}>
              <Volume2 size={18} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabelText, { color: colors.textPrimary }]}>Tactile Haptics</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={handleHapticsToggle}
              trackColor={{ false: colors.dark300, true: colors.primary }}
              thumbColor={isDark ? colors.black : colors.white}
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

          {/* Push Notifications Switch */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelCol}>
              <BellRing size={18} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabelText, { color: colors.textPrimary }]}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.dark300, true: colors.primary }}
              thumbColor={isDark ? colors.black : colors.white}
            />
          </View>
        </Card>

        {/* Settings Group 2: Payment & Wallet */}
        <Text style={[styles.settingsGroupTitle, { color: colors.textPrimary }]}>Payment & Billing</Text>

        <Card variant="glass" padding={12} style={styles.settingsCard}>
          {/* Card Management */}
          <Pressable 
            onPress={() => showToast('My Wallet: 2 active split methods linked.', 'success')}
            style={styles.clickableSettingRow}
            accessibilityRole="button"
          >
            <View style={styles.settingLabelCol}>
              <CreditCard size={18} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabelText, { color: colors.textPrimary }]}>Saved Cards & Accounts</Text>
            </View>
            <ChevronRight size={16} color={colors.gray400} />
          </Pressable>

          <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

          {/* Default Base Currency */}
          <Pressable 
            onPress={() => showToast('Base currency locked to USD.', 'info')}
            style={styles.clickableSettingRow}
            accessibilityRole="button"
          >
            <View style={styles.settingLabelCol}>
              <DollarSign size={18} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabelText, { color: colors.textPrimary }]}>
                Change Base Currency ({user?.currency || 'USD'})
              </Text>
            </View>
            <ChevronRight size={16} color={colors.gray400} />
          </Pressable>
        </Card>

        {/* Security Info Panel */}
        <Card variant="filled" padding={12} style={styles.infoCard}>
          <ShieldAlert size={16} color={colors.gray400} style={{ marginRight: 8 }} />
          <Text style={[styles.infoCardText, { color: colors.textSecondary }]}>
            All transactions are protected using Bank-Grade TLS/SSL encryption protocols.
          </Text>
        </Card>

        {/* Logout session Action */}
        <View style={styles.logoutWrapper}>
          <Button
            title="Sign Out Session"
            variant="outline"
            onPress={handleLogout}
            style={styles.logoutBtn}
          />
          <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>
            BillSplit Mobile v1.0.2 (Expo v51)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  userCard: {
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarFrame: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
  },
  profileMeta: {
    marginLeft: 16,
    flex: 1,
  },
  userNameText: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },
  userEmailText: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    width: '31%',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'Nunito',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '800',
  },
  settingsGroupTitle: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 12,
    marginLeft: 4,
  },
  settingsCard: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  clickableSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabelText: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '700',
  },
  rowDivider: {
    height: 1,
    width: '100%',
    opacity: 0.05,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  infoCardText: {
    fontSize: 10,
    fontFamily: 'Nunito',
    fontWeight: '600',
    flex: 1,
    lineHeight: 14,
  },
  logoutWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  logoutBtn: {
    borderColor: '#DC2626',
    borderWidth: 1.5,
  },
  versionLabel: {
    fontSize: 10,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginTop: 16,
    opacity: 0.5,
  },
});
