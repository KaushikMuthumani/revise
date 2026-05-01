import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { TopicCard } from '../../components/TopicCard';
import { StreakBadge } from '../../components/StreakBadge';
import { useTopicsStore } from '../../store/useTopicsStore';
import { useProfileStore } from '../../store/useProfileStore';
import { getGreeting, formatDisplayDate } from '../../utils/dateUtils';
import { Topic } from '../../api/topics';

type Props = { navigation: NativeStackNavigationProp<any> };
type TabKey = 'due' | 'overdue' | 'upcoming';

export function TodayScreen({ navigation }: Props) {
  const { dueToday, overdue, upcoming, fetchDashboard, markRevised, isLoading } = useTopicsStore();
  const { profile, fetchProfile } = useProfileStore();
  const [activeTab, setActiveTab] = useState<TabKey>('due');
  const [revisingId, setRevisingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
    fetchProfile();
  }, []);

  const onRefresh = useCallback(() => {
    fetchDashboard();
    fetchProfile();
  }, []);

  async function handleMarkRevised(id: string) {
    setRevisingId(id);
    try { await markRevised(id); } catch {}
    setRevisingId(null);
  }

  const tabs: { key: TabKey; label: string; data: Topic[] }[] = [
    { key: 'due', label: `Due (${dueToday.length})`, data: dueToday },
    { key: 'overdue', label: `Overdue (${overdue.length})`, data: overdue },
    { key: 'upcoming', label: 'Upcoming', data: upcoming },
  ];

  const activeData = tabs.find((t) => t.key === activeTab)?.data ?? [];

  const greeting = getGreeting();
  const todayStr = formatDisplayDate(new Date().toISOString().split('T')[0]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
          {greeting}, {profile?.display_name || 'there'} 👋
        </Text>
        <Text style={styles.date} numberOfLines={1}>{todayStr}</Text>
      </View>

      {/* Streak + count */}
      <View style={styles.statsRow}>
        <StreakBadge streak={profile?.streak_days ?? 0} />
        <Text style={styles.dueCount}>
          {dueToday.length + overdue.length} revision{dueToday.length + overdue.length !== 1 ? 's' : ''} due
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Topic List */}
      {isLoading && activeData.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={activeData}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {activeTab === 'due' ? '🎉 All caught up for today!' : 'Nothing here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TopicCard
              topic={item}
              onPress={() => navigation.navigate('TopicDetail', { topicId: item.id })}
              onMarkRevised={() => handleMarkRevised(item.id)}
              isRevising={revisingId === item.id}
              showReviseButton={activeTab !== 'upcoming'}
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTopic')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.gray50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  greeting: { fontSize: 17, fontWeight: '700', color: Colors.gray900, flex: 1 },
  date: { fontSize: 13, color: Colors.gray500, marginLeft: 8, flexShrink: 0 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dueCount: { fontSize: 14, color: Colors.gray500, fontWeight: '500' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.gray600, fontWeight: '500' },
  tabTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: Colors.gray400, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { fontSize: 28, color: Colors.white, lineHeight: 32 },
});
