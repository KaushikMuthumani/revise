import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors, gradeColor } from '../../theme/colors';
import { RevisionTimeline } from '../../components/RevisionTimeline';
import { TagChip } from '../../components/TagChip';
import { getTopic, Revision } from '../../api/topics';
import { useTopicsStore } from '../../store/useTopicsStore';
import { getDueLabelForTopic, formatDisplayDate } from '../../utils/dateUtils';
import { TOTAL_STEPS } from '../../utils/constants';
import { Topic } from '../../api/topics';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, any>;
};

export function TopicDetailScreen({ navigation, route }: Props) {
  const { topicId } = route.params as { topicId: string };
  const [topic, setTopic] = useState<Topic | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevising, setIsRevising] = useState(false);
  const { markRevised, deleteTopic } = useTopicsStore();

  useEffect(() => {
    load();
  }, [topicId]);

  async function load() {
    setIsLoading(true);
    try {
      const data = await getTopic(topicId);
      setTopic(data.topic);
      setRevisions(data.revisions);
    } catch (e) {}
    setIsLoading(false);
  }

  async function handleMarkRevised() {
    if (!topic) return;
    setIsRevising(true);
    try {
      await markRevised(topic.id);
      await load(); // reload updated state
    } catch (e) {}
    setIsRevising(false);
  }

  function handleDelete() {
    Alert.alert(
      'Delete Topic',
      'Are you sure you want to delete this topic? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTopic(topicId);
            navigation.goBack();
          },
        },
      ]
    );
  }

  if (isLoading || !topic) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator style={{ marginTop: 80 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const progressPct = Math.min((topic.revision_step / TOTAL_STEPS) * 100, 100);
  const borderColor = gradeColor(topic.color_grade);
  const isDueOrOverdue = topic.color_grade === 'due' || topic.color_grade === 'overdue' || topic.color_grade === 'new';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Nav */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Left border accent */}
        <View style={[styles.accentBar, { backgroundColor: borderColor }]} />

        {/* Title & Tag */}
        <Text style={styles.title}>{topic.title}</Text>
        <TagChip label={topic.subject_tag} />

        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionLabel}>Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: borderColor }]} />
          </View>
          <Text style={styles.progressText}>
            {topic.is_completed ? 'All 7 revisions completed! 🎉' : `${topic.revision_step} of ${TOTAL_STEPS} revisions done`}
          </Text>
        </View>

        {/* Next due */}
        {!topic.is_completed && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Next revision:</Text>
            <Text style={[styles.infoValue, { color: borderColor }]}>
              {getDueLabelForTopic(topic.next_revision_due, topic.is_completed)}
            </Text>
          </View>
        )}

        {/* Image */}
        {topic.image_url && (
          <Image source={{ uri: topic.image_url }} style={styles.image} resizeMode="cover" />
        )}

        {/* Notes */}
        {topic.note && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.notesText}>{topic.note}</Text>
          </View>
        )}

        {/* Mark as Revised */}
        {!topic.is_completed && isDueOrOverdue && (
          <TouchableOpacity
            style={[styles.reviseBtn, { backgroundColor: borderColor }]}
            onPress={handleMarkRevised}
            disabled={isRevising}
          >
            {isRevising ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.reviseBtnText}>✓ Mark as Revised</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Revision History */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Revision History</Text>
        <RevisionTimeline revisions={revisions} />

        {/* Meta */}
        <Text style={styles.metaText}>Added {formatDisplayDate(topic.created_at)}</Text>
        {topic.missed_count > 0 && (
          <Text style={styles.missedText}>Missed {topic.missed_count} revision{topic.missed_count > 1 ? 's' : ''}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  navHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: Colors.gray100,
  },
  backText: { fontSize: 16, color: Colors.primary },
  deleteText: { fontSize: 16, color: Colors.error },
  container: { padding: 20, paddingBottom: 48 },
  accentBar: { height: 4, borderRadius: 2, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.gray900, marginBottom: 10 },
  progressSection: { marginTop: 20, marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: Colors.gray100, borderRadius: 3, marginBottom: 6 },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 14, color: Colors.gray600 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  infoLabel: { fontSize: 14, color: Colors.gray600 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  image: { width: '100%', height: 200, borderRadius: 12, marginTop: 16, marginBottom: 8 },
  notesSection: { marginTop: 16, marginBottom: 8 },
  notesText: { fontSize: 15, color: Colors.gray700, lineHeight: 22 },
  reviseBtn: {
    borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 24, marginBottom: 8,
  },
  reviseBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  metaText: { fontSize: 12, color: Colors.gray300, marginTop: 24 },
  missedText: { fontSize: 12, color: Colors.error, marginTop: 4 },
});
