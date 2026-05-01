import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { getApiClient } from '../../api/client';

type Props = { navigation: NativeStackNavigationProp<any> };

interface VocabWord {
  id: number;
  word: string;
  definition: string;
  example_sentence: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: Colors.gradeDone,
  medium: Colors.gradeDue,
  hard: Colors.gradeOverdue,
};

const DIFFICULTY_FILTERS = ['all', 'easy', 'medium', 'hard'];

export function VocabScreen({ navigation }: Props) {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    loadWords();
    loadAdded();
  }, []);

  async function loadWords() {
    setIsLoading(true);
    try {
      const res = await getApiClient().get('/vocab');
      setWords(res.data.words);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setIsLoading(false);
  }

  async function loadAdded() {
    try {
      const res = await getApiClient().get('/vocab/my');
      const ids = new Set<number>(
        res.data.topics.map((t: any) => {
          // Match by title since we store word as title
          const match = words.find((w) => w.word === t.title);
          return match?.id;
        }).filter(Boolean)
      );
      setAddedIds(ids);
    } catch {}
  }

  async function handleAdd(word: VocabWord) {
    if (addedIds.has(word.id)) return;
    setAddingId(word.id);
    try {
      await getApiClient().post(`/vocab/${word.id}/add`);
      setAddedIds((prev) => new Set([...prev, word.id]));
    } catch (e: any) {
      const code = e.response?.data?.error;
      if (code === 'TOPIC_LIMIT_REACHED') {
        Alert.alert('Limit Reached', 'Upgrade to Premium for unlimited topics.');
      } else if (code === 'ALREADY_ADDED') {
        setAddedIds((prev) => new Set([...prev, word.id]));
      } else {
        Alert.alert('Error', e.message);
      }
    }
    setAddingId(null);
  }

  const filtered = words.filter((w) => {
    const matchSearch =
      !search.trim() ||
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.definition.toLowerCase().includes(search.toLowerCase());
    const matchDiff = difficulty === 'all' || w.difficulty === difficulty;
    return matchSearch && matchDiff;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>GRE Vocabulary Builder</Text>
          <Text style={styles.subtitle}>1,000 high-frequency words</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search words or definitions…"
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

      {/* Difficulty filter */}
      <View style={styles.filterRow}>
        {DIFFICULTY_FILTERS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.filterChip, difficulty === d && styles.filterChipActive]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={[styles.filterChipText, difficulty === d && styles.filterChipTextActive]}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(w) => String(w.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No words found.</Text>
          }
          renderItem={({ item }) => {
            const added = addedIds.has(item.id);
            return (
              <View style={styles.wordCard}>
                <View style={styles.wordRow}>
                  <Text style={styles.word}>{item.word}</Text>
                  <View style={[styles.diffChip, { backgroundColor: DIFFICULTY_COLORS[item.difficulty] + '22' }]}>
                    <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[item.difficulty] }]}>
                      {item.difficulty}
                    </Text>
                  </View>
                </View>
                <Text style={styles.definition}>{item.definition}</Text>
                {item.example_sentence && (
                  <Text style={styles.example}>"{item.example_sentence}"</Text>
                )}
                <TouchableOpacity
                  style={[styles.addBtn, added && styles.addBtnAdded]}
                  onPress={() => handleAdd(item)}
                  disabled={added || addingId === item.id}
                >
                  {addingId === item.id ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Text style={[styles.addBtnText, added && styles.addBtnTextAdded]}>
                      {added ? 'Added ✓' : '+ Add to Revisions'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.gray50 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.gray100,
  },
  back: { fontSize: 22, color: Colors.primary },
  title: { fontSize: 17, fontWeight: '700', color: Colors.gray900 },
  subtitle: { fontSize: 12, color: Colors.gray400 },
  searchRow: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.gray200,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.gray900 },
  clearBtn: { fontSize: 14, color: Colors.gray400 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 10 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: Colors.gray100,
  },
  filterChipActive: { backgroundColor: Colors.primary },
  filterChipText: { fontSize: 13, color: Colors.gray600, fontWeight: '500' },
  filterChipTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyText: { color: Colors.gray300, textAlign: 'center', marginTop: 40 },
  wordCard: {
    backgroundColor: Colors.white, borderRadius: 12,
    padding: 14, marginBottom: 10,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  wordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  word: { fontSize: 17, fontWeight: '700', color: Colors.gray900 },
  diffChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  diffText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  definition: { fontSize: 14, color: Colors.gray700, lineHeight: 20, marginBottom: 6 },
  example: { fontSize: 13, color: Colors.gray400, fontStyle: 'italic', marginBottom: 10 },
  addBtn: {
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 8, paddingVertical: 8, alignItems: 'center',
  },
  addBtnAdded: { borderColor: Colors.gradeDone, backgroundColor: Colors.successBg },
  addBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  addBtnTextAdded: { color: Colors.gradeDone },
});
