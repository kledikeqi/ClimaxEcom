import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../AuthContext';
import { ApiError } from '../api';
import { useToast } from '../ToastContext';
import { colors, radius } from '../theme';

type Mode = 'login' | 'register';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AuthModal({ visible, onClose }: AuthModalProps) {
  const { user, login, register, logout } = useAuth();
  const showToast = useToast();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setError(null);
      setSubmitting(false);
      if (!user) setMode('login');
    }
  }, [visible, user]);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const logged = await login(email.trim(), password);
        showToast(`Welcome back, ${logged.full_name || logged.email}.`);
      } else {
        const created = await register(email.trim(), password, fullName.trim());
        showToast(`Account created for ${created.email}.`);
      }
      setEmail('');
      setPassword('');
      setFullName('');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast('Logged out.');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.close} onPress={onClose} accessibilityLabel="Close">
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>

          {user ? (
            <>
              <Text style={styles.title}>YOUR ACCOUNT</Text>
              <View style={styles.userBox}>
                <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
                <View style={styles.userInfo}>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userMeta}>
                    {user.full_name || 'Climax customer'}
                    {user.is_admin ? ' · Admin' : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={handleLogout}>
                <Text style={styles.primaryButtonText}>LOG OUT</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>{mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}</Text>

              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, mode === 'login' && styles.tabActive]}
                  onPress={() => setMode('login')}
                >
                  <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                    Login
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, mode === 'register' && styles.tabActive]}
                  onPress={() => setMode('register')}
                >
                  <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                    Register
                  </Text>
                </TouchableOpacity>
              </View>

              {mode === 'register' && (
                <>
                  <Text style={styles.label}>FULL NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Kledi Keqi"
                    placeholderTextColor="#555"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </>
              )}

              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#555"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#555"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity
                style={[styles.primaryButton, submitting && styles.buttonDisabled]}
                onPress={submit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.hint}>
                Checkout requires an account — it only takes a few seconds.
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 24,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  close: { position: 'absolute', right: 14, top: 14, zIndex: 2, padding: 4 },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: radius.md,
    padding: 4,
    marginBottom: 8,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontWeight: 'bold' },
  tabTextActive: { color: colors.text },
  label: {
    color: colors.textMuted,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 6,
    fontSize: 11,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#222',
    color: colors.text,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    fontSize: 15,
  },
  error: { color: colors.warning, marginTop: 12, fontSize: 13 },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 18,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: colors.text, fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 14, textAlign: 'center' },
  userBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  userInfo: { marginLeft: 12, flex: 1 },
  userEmail: { color: colors.text, fontWeight: 'bold', fontSize: 15 },
  userMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
