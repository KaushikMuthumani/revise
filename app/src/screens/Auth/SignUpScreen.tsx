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

export function SignUpScreen({ navigation }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const { signUp, resendConfirmation, isLoading, error, notice, clearError } = useAuthStore();

  async function handleSignUp() {
    if (!displayName.trim() || !email.trim() || !password.trim()) return;
    clearError();
    // Pass null if referralCode is empty (fixes Revu's JsonNull crash)
    const ref = referralCode.trim() || undefined;
    await signUp(email.trim().toLowerCase(), password, displayName.trim(), ref);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoArea}>
            <Text style={styles.logoText}>Revise</Text>
            <Text style={styles.tagline}>Create your account</Text>
          </View>

          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={Colors.gray400}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />

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
            placeholder="Min. 8 characters"
            placeholderTextColor={Colors.gray400}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View style={styles.referralRow}>
            <Text style={styles.fieldLabel}>Referral Code (optional)</Text>
            <TouchableOpacity onPress={() => setReferralCode('')}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter referral code"
            placeholderTextColor={Colors.gray400}
            value={referralCode}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}
          {notice && (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>Confirm your email</Text>
              <Text style={styles.noticeText}>{notice}</Text>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => resendConfirmation(email)}
                disabled={isLoading}
              >
                <Text style={styles.secondaryBtnText}>Resend email</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, (!displayName || !email || !password) && styles.btnDisabled]}
            onPress={handleSignUp}
            disabled={isLoading || !displayName || !email || !password}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginBold}>Log In</Text>
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
  container: { flexGrow: 1, padding: 24 },
  logoArea: { alignItems: 'center', marginTop: 20, marginBottom: 36 },
  logoText: { fontSize: 36, fontWeight: '800', color: Colors.primary, letterSpacing: -1 },
  tagline: { fontSize: 14, color: Colors.gray500, marginTop: 4 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  referralRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: Colors.gray200, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
    color: Colors.gray900, marginBottom: 16, backgroundColor: Colors.gray50,
  },
  errorText: { color: Colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  noticeBox: {
    backgroundColor: Colors.successBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  noticeTitle: { color: Colors.gray900, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  noticeText: { color: Colors.gray700, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: { color: Colors.success, fontSize: 13, fontWeight: '700' },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginBottom: 16,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginText: { fontSize: 14, color: Colors.gray500 },
  loginBold: { color: Colors.primary, fontWeight: '700' },
});
