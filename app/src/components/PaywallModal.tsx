import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Colors } from '../theme/colors';
import { useBilling } from '../hooks/useBilling';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const FEATURES = [
  { label: 'Topics', free: '20', premium: 'Unlimited' },
  { label: 'Spaced revision schedule', free: '✓', premium: '✓' },
  { label: 'Notes & images', free: '✓', premium: '✓' },
  { label: 'Calendar view', free: '✓', premium: '✓' },
  { label: 'Push notifications', free: '✓', premium: '✓' },
  { label: 'Vocabulary builder', free: '✓', premium: '✓' },
  { label: 'Custom intervals', free: '✗', premium: '✓' },
  { label: 'Advanced analytics', free: '✗', premium: '✓' },
];

export function PaywallModal({ visible, onClose }: Props) {
  const { subscribe, restore, isLoading, error } = useBilling();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Unlock Unlimited Revisions</Text>
        <Text style={styles.subtitle}>
          Prepare smarter for your competitive exams with premium access.
        </Text>

        <View style={styles.priceBox}>
          <Text style={styles.price}>₹100</Text>
          <Text style={styles.pricePer}>/year</Text>
        </View>

        {/* Feature Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.col1, styles.headerText]}>Feature</Text>
            <Text style={[styles.col2, styles.headerText]}>Free</Text>
            <Text style={[styles.col2, styles.headerText]}>Premium</Text>
          </View>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.tableRow}>
              <Text style={[styles.col1, styles.cellText]}>{f.label}</Text>
              <Text style={[styles.col2, styles.cellText, f.free === '✗' && styles.cross]}>
                {f.free}
              </Text>
              <Text style={[styles.col2, styles.cellText, styles.premiumCell]}>
                {f.premium}
              </Text>
            </View>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={styles.subscribeBtn}
          onPress={subscribe}
          disabled={isLoading}
        >
          <Text style={styles.subscribeBtnText}>
            {isLoading ? 'Processing…' : 'Subscribe Now — ₹100/year'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={restore} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Restore Purchase</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>Maybe later</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.gray900, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.gray500, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  priceBox: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 28 },
  price: { fontSize: 48, fontWeight: '800', color: Colors.primary },
  pricePer: { fontSize: 20, color: Colors.gray500, marginBottom: 8, marginLeft: 4 },
  table: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.gray200, marginBottom: 28 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: Colors.gray100 },
  tableHeader: { backgroundColor: Colors.primaryLight },
  headerText: { fontWeight: '700', color: Colors.primary, fontSize: 13 },
  col1: { flex: 2 },
  col2: { flex: 1, textAlign: 'center' },
  cellText: { fontSize: 13, color: Colors.gray700 },
  cross: { color: Colors.gray300 },
  premiumCell: { color: Colors.gradeDone, fontWeight: '600' },
  error: { color: Colors.error, textAlign: 'center', marginBottom: 12 },
  subscribeBtn: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginBottom: 12,
  },
  subscribeBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  restoreBtn: { alignItems: 'center', paddingVertical: 10 },
  restoreText: { color: Colors.primary, fontSize: 14 },
  closeBtn: { alignItems: 'center', paddingVertical: 10 },
  closeText: { color: Colors.gray400, fontSize: 14 },
});
