import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Revision } from '../api/topics';
import { formatDisplayDate } from '../utils/dateUtils';

interface Props {
  revisions: Revision[];
}

export function RevisionTimeline({ revisions }: Props) {
  if (revisions.length === 0) {
    return (
      <Text style={styles.empty}>No revisions yet. Mark your first one!</Text>
    );
  }

  return (
    <View style={styles.container}>
      {revisions.map((rev, i) => (
        <View key={rev.id} style={styles.item}>
          <View style={styles.dotCol}>
            <View style={[styles.dot, rev.was_missed && styles.dotMissed]} />
            {i < revisions.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.content}>
            <Text style={styles.step}>Revision {rev.step_completed + 1}</Text>
            <Text style={styles.date}>{formatDisplayDate(rev.revised_at)}</Text>
            {rev.was_missed && <Text style={styles.missed}>Was overdue</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 4 },
  empty: { color: Colors.gray400, fontSize: 14, fontStyle: 'italic' },
  item: { flexDirection: 'row', marginBottom: 0 },
  dotCol: { alignItems: 'center', width: 24 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  dotMissed: { backgroundColor: Colors.gradeOverdue },
  line: { width: 2, flex: 1, backgroundColor: Colors.gray200, marginVertical: 2 },
  content: { flex: 1, paddingLeft: 10, paddingBottom: 16 },
  step: { fontSize: 14, fontWeight: '600', color: Colors.gray800 },
  date: { fontSize: 13, color: Colors.gray500, marginTop: 2 },
  missed: { fontSize: 12, color: Colors.gradeOverdue, marginTop: 2 },
});
