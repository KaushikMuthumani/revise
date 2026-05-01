import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { TopicCard } from '../../components/TopicCard';
import { useTopicsStore } from '../../store/useTopicsStore';

type Props = { navigation: NativeStackNavigationProp<any> };

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'due', label: 'Due' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Done' },
];

export function TopicsListScreen({ navigation }: Props) {
  const { topics, fetchTopics, isLoading } = useTopicsStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTopics({ status: statusFilter === 'all' ? undefined : (statusFilter as any) });
  }, [statusFilter]);

  const onRefresh = useCallback(() => {
    fetchTopics({ status: statusFilter === 'all' ? undefined : (statusFilter as any) });
  }, [statusFilter]);

  const filtered = search.trim()
    ? topics.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.subject_tag?.toLowerCase().includes(search.toLowerCase())
      )
    : topics;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics or tags…"
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, statusFilter === f.key && styles.chipActive]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text style={[styles.chipText, statusFilter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Vocab shortcut */}
        <TouchableOpacity
          style={styles.chip}
          onPress={() => navigation.navigate('Vocab')}
        >
          <Text style={styles.chipText}>📖 Vocab</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No topics yet.</Text>
            <Text style={styles.emptyHint}>Tap + to add your first topic.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TopicCard
            topic={item}
            onPress={() => navigation.navigate('TopicDetail', { topicId: item.id })}
            showReviseButton={false}
          />
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTopic')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.gray50 },
  searchRow: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.gray200,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.gray900 },
  clearBtn: { fontSize: 14, color: Colors.gray400, paddingHorizontal: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: Colors.gray100,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.gray600, fontWeight: '500' },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.gray400 },
  emptyHint: { fontSize: 14, color: Colors.gray300, marginTop: 8 },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  fabText: { fontSize: 28, color: Colors.white, lineHeight: 32 },
});
