import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  label: string;
  color?: string;
  bgColor?: string;
  small?: boolean;
}

export function TagChip({ label, color = Colors.gray600, bgColor = Colors.gray100, small }: Props) {
  return (
    <View style={[styles.chip, { backgroundColor: bgColor }, small && styles.small]}>
      <Text style={[styles.text, { color }, small && styles.smallText]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontSize: 13, fontWeight: '500' },
  smallText: { fontSize: 11 },
});
