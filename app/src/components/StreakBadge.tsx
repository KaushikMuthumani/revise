import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  streak: number;
}

export function StreakBadge({ streak }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.fire}>🔥</Text>
      <Text style={styles.count}>{streak}</Text>
      <Text style={styles.label}>day streak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  fire: { fontSize: 16 },
  count: { fontSize: 15, fontWeight: '700', color: Colors.warning },
  label: { fontSize: 13, color: Colors.warning },
});
