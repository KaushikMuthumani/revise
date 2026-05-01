import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { useProfileStore } from '../../store/useProfileStore';
import { useAuthStore } from '../../store/useAuthStore';
import { StreakBadge } from '../../components/StreakBadge';
import { PaywallModal } from '../../components/PaywallModal';
import { getLeaderboard } from '../../api/profile';
import { updateGlobalIntervals } from '../../api/profile';
import { formatDisplayDate, formatTime } from '../../utils/dateUtils';
import { DEFAULT_INTERVALS } from '../../utils/constants';

type Props = { navigation: NativeStackNavigationProp<any> };

export function ProfileScreen({ navigation }: Props) {
  const { profile, stats, fetchProfile, updateProfile } = useProfileStore();
  const { signOut } = useAuthStore();
  const [userRank, setUserRank] = useState<number | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customIntervals, setCustomIntervals] = useState<number[]>(DEFAULT_INTERVALS);
  const [savingIntervals, setSavingIntervals] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setIsLoading(true);
    await fetchProfile();
    try {
      const { user_rank } = await getLeaderboard();
      setUserRank(user_rank);
    } catch {}
    setIsLoading(false);
  }

  async function handleDarkModeToggle(val: boolean) {
    await updateProfile({ dark_mode: val });
  }

  async function handleNotificationTime() {
    // Simple alert-based time picker (full TimePicker would be a native module)
    Alert.prompt(
      'Notification Time',
      'Enter time in HH:MM format (24h), e.g. 09:00',
      async (text) => {
        if (!text) return;
        const match = text.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) { Alert.alert('Invalid format', 'Please enter time as HH:MM'); return; }
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        if (h > 23 || m > 59) { Alert.alert('Invalid time'); return; }
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
        await updateProfile({ notification_time: timeStr });
        await fetchProfile();
      },
      'plain-text',
      profile?.notification_time?.slice(0, 5) ?? '09:00'
    );
  }

  async function handleSaveIntervals() {
    if (!profile?.is_premium) { setShowPaywall(true); return; }
    setSavingIntervals(true);
    try {
      await updateGlobalIntervals(customIntervals);
      Alert.alert('Saved', 'Custom intervals updated for all your topics.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setSavingIntervals(false);
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator style={{ marginTop: 80 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const initials = profile.display_name
    ? profile.display_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{profile.display_name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.total_revisions ?? 0}</Text>
            <Text style={styles.statLabel}>Revisions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.topic_count ?? 0}</Text>
            <Text style={styles.statLabel}>Topics</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <StreakBadge streak={profile.streak_days} />
          </View>
        </View>

        {/* Leaderboard rank */}
        {userRank !== null && (
          <View style={styles.rankCard}>
            <Text style={styles.rankEmoji}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rankTitle}>Leaderboard Rank</Text>
              <Text style={styles.rankSub}>Based on total revisions completed</Text>
            </View>
            <Text style={styles.rankNum}>#{userRank}</Text>
          </View>
        )}

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.subCard}>
            {profile.is_premium ? (
              <>
                <Text style={styles.premiumBadge}>✨ Premium</Text>
                {profile.premium_expires_at && (
                  <Text style={styles.expiresText}>
                    Expires {formatDisplayDate(profile.premium_expires_at)}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.freeBadge}>Free Plan (20 topics)</Text>
                <TouchableOpacity style={styles.upgradeBtn} onPress={() => setShowPaywall(true)}>
                  <Text style={styles.upgradeBtnText}>Upgrade to Premium — ₹100/year</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          {/* Notification Time */}
          <TouchableOpacity style={styles.settingRow} onPress={handleNotificationTime}>
            <Text style={styles.settingLabel}>🔔 Daily reminder</Text>
            <Text style={styles.settingValue}>
              {formatTime(profile.notification_time)}
            </Text>
          </TouchableOpacity>

          {/* Dark Mode */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>🌙 Dark mode</Text>
            <Switch
              value={profile.dark_mode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ true: Colors.primary }}
            />
          </View>
        </View>

        {/* Custom Intervals (Premium) */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Custom Intervals</Text>
            {!profile.is_premium && (
              <Text style={styles.premiumTag}>Premium</Text>
            )}
          </View>
          <Text style={styles.intervalHint}>
            Days before each revision (7 steps)
          </Text>
          <View style={styles.intervalRow}>
            {(profile.is_premium ? customIntervals : DEFAULT_INTERVALS).map((val, i) => (
              <View key={i} style={styles.intervalItem}>
                <Text style={styles.intervalStep}>R{i + 1}</Text>
                <Text style={styles.intervalVal}>{val}d</Text>
              </View>
            ))}
          </View>
          {profile.is_premium && (
            <TouchableOpacity
              style={styles.saveIntervalsBtn}
              onPress={handleSaveIntervals}
              disabled={savingIntervals}
            >
              {savingIntervals ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.saveIntervalsBtnText}>Save Intervals</Text>
              )}
            </TouchableOpacity>
          )}
          {!profile.is_premium && (
            <TouchableOpacity onPress={() => setShowPaywall(true)}>
              <Text style={styles.unlockText}>Unlock to customise →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Revise v1.0.0</Text>
      </ScrollView>

      <PaywallModal visible={showPaywall} onClose={() => { setShowPaywall(false); fetchProfile(); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.gray50 },
  container: { padding: 20, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.white },
  displayName: { fontSize: 20, fontWeight: '700', color: Colors.gray900 },
  email: { fontSize: 14, color: Colors.gray500, marginTop: 2 },
  statsCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.gray900 },
  statLabel: { fontSize: 12, color: Colors.gray500, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.gray100 },
  rankCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  rankEmoji: { fontSize: 28 },
  rankTitle: { fontSize: 15, fontWeight: '600', color: Colors.gray900 },
  rankSub: { fontSize: 12, color: Colors.gray400 },
  rankNum: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.gray400, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  premiumTag: {
    fontSize: 11, color: Colors.primary, backgroundColor: Colors.primaryLight,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, fontWeight: '700',
  },
  subCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4 },
  premiumBadge: { fontSize: 17, fontWeight: '700', color: Colors.gradeDone },
  expiresText: { fontSize: 13, color: Colors.gray500, marginTop: 4 },
  freeBadge: { fontSize: 15, fontWeight: '600', color: Colors.gray700, marginBottom: 12 },
  upgradeBtn: {
    backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  upgradeBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 8,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
  },
  settingLabel: { fontSize: 15, color: Colors.gray800 },
  settingValue: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  intervalHint: { fontSize: 13, color: Colors.gray400, marginBottom: 10 },
  intervalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  intervalItem: {
    backgroundColor: Colors.white, borderRadius: 10, padding: 10,
    alignItems: 'center', minWidth: 48,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3,
  },
  intervalStep: { fontSize: 11, color: Colors.gray400, fontWeight: '600' },
  intervalVal: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  saveIntervalsBtn: {
    backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  saveIntervalsBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  unlockText: { fontSize: 14, color: Colors.primary, marginTop: 4 },
  signOutBtn: {
    borderWidth: 1, borderColor: Colors.error, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  signOutText: { color: Colors.error, fontSize: 15, fontWeight: '600' },
  versionText: { textAlign: 'center', fontSize: 12, color: Colors.gray300, marginTop: 24 },
});
