import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/useAuthStore';

type Props = { navigation: NativeStackNavigationProp<any> };

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {
    signIn,
    resendConfirmation,
    sendPasswordReset,
    isLoading,
    error,
    notice,
    clearError,
  } = useAuthStore();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) return;
    clearError();
    await signIn(email.trim().toLowerCase(), password);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoArea}>
            <Text style={styles.logoText}>Revise</Text>
            <Text style={styles.tagline}>Spaced Repetition Study Planner</Text>
          </View>

          {/* Form */}
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors.gray400}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Your password"
            placeholderTextColor={Colors.gray400}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity onPress={() => sendPasswordReset(email)} disabled={isLoading}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {notice && <Text style={styles.noticeText}>{notice}</Text>}
          {error?.toLowerCase().includes('email not confirmed') && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => resendConfirmation(email)}
              disabled={isLoading}
            >
              <Text style={styles.secondaryBtnText}>Resend confirmation email</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.btn, (!email || !password) && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  kav: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 48 },
  logoText: { fontSize: 40, fontWeight: '800', color: Colors.primary, letterSpacing: -1 },
  tagline: { fontSize: 14, color: Colors.gray500, marginTop: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.gray200, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
    color: Colors.gray900, marginBottom: 16, backgroundColor: Colors.gray50,
  },
  forgotText: { fontSize: 13, color: Colors.primary, textAlign: 'right', marginBottom: 24 },
  errorText: { color: Colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  noticeText: {
    color: Colors.success,
    backgroundColor: Colors.successBg,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginBottom: 16,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  signupLink: { alignItems: 'center', paddingVertical: 8 },
  signupText: { fontSize: 14, color: Colors.gray500 },
  signupBold: { color: Colors.primary, fontWeight: '700' },
});
