import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Colors, gradeColor, gradeBgColor } from '../theme/colors';
import { TagChip } from './TagChip';
import { getDueLabelForTopic } from '../utils/dateUtils';
import { TOTAL_STEPS } from '../utils/constants';
import { Topic } from '../api/topics';

interface Props {
  topic: Topic;
  onPress: () => void;
  onMarkRevised?: () => void;
  isRevising?: boolean;
  showReviseButton?: boolean;
}

export function TopicCard({ topic, onPress, onMarkRevised, isRevising, showReviseButton = true }: Props) {
  const borderColor = gradeColor(topic.color_grade);
  const dueLabel = getDueLabelForTopic(topic.next_revision_due, topic.is_completed);
  const isDue = topic.color_grade === 'due' || topic.color_grade === 'overdue';
  const isNew = topic.color_grade === 'new';
  const showBtn = showReviseButton && !topic.is_completed && (isDue || isNew);

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: borderColor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={2}>{topic.title}</Text>
        {topic.is_completed && <Text style={styles.doneEmoji}>✓</Text>}
      </View>

      <View style={styles.metaRow}>
        <TagChip label={topic.subject_tag} small />
        <Text style={[styles.stepLabel, { color: borderColor }]}>
          {topic.is_completed
            ? 'All revisions done'
            : topic.revision_step === 0
            ? 'Not revised yet'
            : `Revision ${topic.revision_step} of ${TOTAL_STEPS}`}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <Text style={[styles.dueLabel, { color: gradeColor(topic.color_grade) }]}>
          {dueLabel}
        </Text>

        {showBtn && (
          <TouchableOpacity
            style={[styles.reviseBtn, { backgroundColor: borderColor }]}
            onPress={onMarkRevised}
            disabled={isRevising}
          >
            {isRevising ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.reviseBtnText}>Mark Revised</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray900,
    flex: 1,
    marginRight: 8,
  },
  doneEmoji: { fontSize: 16, color: Colors.gradeDone },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  stepLabel: { fontSize: 12, fontWeight: '500' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dueLabel: { fontSize: 13, fontWeight: '500' },
  reviseBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 110,
    alignItems: 'center',
  },
  reviseBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
});
