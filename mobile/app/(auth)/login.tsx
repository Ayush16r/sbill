import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const setSession = useAuthStore((state) => state.setSession);
  const showToast = useUIStore((state) => state.showToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: any = {};
    if (!email) next.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Enter a valid email.';
    if (!password) next.password = 'Password is required.';
    else if (password.length < 6) next.password = 'Minimum 6 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      setSession(token, user);
      showToast('Welcome back!', 'success');
      router.replace('/(tabs)');
    } catch (err: any) {
      showToast(err.message || 'Login failed. Check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoSymbol}>₹</Text>
          </View>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
            Bill <Text style={{ color: colors.primary }}>Split</Text>
          </Text>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Welcome Back 👋</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
            Sign in to your account to continue splitting bills
          </Text>
        </View>

        {/* Form */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Input
            label="Email Address"
            placeholder="james@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            error={errors.email}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
          />

          <Button
            title="Sign In"
            loading={loading}
            onPress={handleLogin}
            style={styles.signInBtn}
          />
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{'  '}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/signup')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
          </Pressable>
        </View>

        <Text style={[styles.tagline, { color: colors.gray400 }]}>
          Split • Track • Settle
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  logoSection: { alignItems: 'center', marginBottom: 24 },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoSymbol: { fontSize: 32, fontFamily: 'SpaceGrotesk', fontWeight: '900', color: '#FFFFFF' },
  brandTitle: { fontSize: 26, fontFamily: 'SpaceGrotesk', fontWeight: '900', letterSpacing: -0.5 },

  titleSection: { alignItems: 'center', marginBottom: 28 },
  pageTitle: { fontSize: 24, fontFamily: 'SpaceGrotesk', fontWeight: '800', marginBottom: 8 },
  pageSubtitle: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '600', textAlign: 'center', lineHeight: 22 },

  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  signInBtn: { marginTop: 8 },

  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  footerText: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '600' },
  footerLink: { fontSize: 14, fontFamily: 'Nunito', fontWeight: '800' },
  tagline: { textAlign: 'center', fontSize: 11, fontFamily: 'Nunito', fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
});
