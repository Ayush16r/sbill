import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';

export default function SignupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const setSession = useAuthStore((state) => state.setSession);
  const showToast = useUIStore((state) => state.showToast);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = () => {
    const nextErrors: any = {};
    if (!name) {
      nextErrors.name = 'Full name is required.';
    }
    
    if (!email) {
      nextErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    
    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/signup', {
        name,
        email,
        password,
        phone: phone || undefined,
        currency: 'INR',
      });
      const { token, user } = response.data;
      
      setSession(token, user);
      showToast('Account created successfully!', 'success');
      router.replace('/(tabs)');
    } catch (err: any) {
      showToast(err.message || 'Failed to sign up.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Join BillSplit
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Start sharing expenses and settling balances instantly
          </Text>
        </View>

        <Card variant="glass" padding={20} style={styles.formCard}>
          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            value={name}
            onChangeText={(txt) => {
              setName(txt);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            error={errors.name}
          />

          <Input
            label="Email Address"
            placeholder="e.g. john@domain.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            error={errors.email}
          />

          <Input
            label="Phone Number (Optional)"
            placeholder="e.g. +1 555 123 4567"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={(txt) => {
              setPassword(txt);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
          />

          <Button
            title="Create Account"
            loading={loading}
            onPress={handleSignup}
            style={styles.submitBtn}
          />
        </Card>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>
              Sign In
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  formCard: {
    width: '100%',
    marginBottom: 24,
  },
  submitBtn: {
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Nunito',
    fontWeight: '600',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'Nunito',
    fontWeight: '800',
  },
});
