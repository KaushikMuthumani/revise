import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Image,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { useTopicsStore } from '../../store/useTopicsStore';
import { PaywallModal } from '../../components/PaywallModal';

type Props = { navigation: NativeStackNavigationProp<any> };

export function AddTopicScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [subjectTag, setSubjectTag] = useState('');
  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [tagError, setTagError] = useState('');

  const { addTopic } = useTopicsStore();

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setImageMime(asset.mimeType ?? 'image/jpeg');
    }
  }

  async function handleSubmit() {
    let valid = true;
    if (!title.trim()) { setTitleError('Topic title is required'); valid = false; }
    else setTitleError('');
    if (!subjectTag.trim()) { setTagError('Subject tag is required'); valid = false; }
    else setTagError('');
    if (!valid) return;

    setIsSubmitting(true);
    const result = await addTopic({
      title: title.trim(),
      subject_tag: subjectTag.trim(),
      note: note.trim() || undefined,
      image_base64: imageBase64 ?? undefined,
      image_mime_type: imageMime,
    });
    setIsSubmitting(false);

    if (result.code === 'TOPIC_LIMIT_REACHED') {
      setShowPaywall(true);
      return;
    }
    if (result.error) {
      Alert.alert('Error', result.error);
      return;
    }
    if (result.warning) {
      Alert.alert('Saved', result.warning, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      return;
    }
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Nav Header */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Add Topic</Text>
          <View style={{ width: 56 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <Text style={styles.label}>Topic Title *</Text>
          <TextInput
            style={[styles.input, titleError ? styles.inputError : null]}
            placeholder="e.g. Chapter 5 — Cell Biology"
            placeholderTextColor={Colors.gray400}
            value={title}
            onChangeText={(t) => { setTitle(t); setTitleError(''); }}
          />
          {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}

          {/* Subject Tag */}
          <Text style={styles.label}>Subject / Tag *</Text>
          <TextInput
            style={[styles.input, tagError ? styles.inputError : null]}
            placeholder="e.g. Biology, Polity, Math"
            placeholderTextColor={Colors.gray400}
            value={subjectTag}
            onChangeText={(t) => { setSubjectTag(t); setTagError(''); }}
          />
          {tagError ? <Text style={styles.errorText}>{tagError}</Text> : null}

          {/* Notes */}
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add notes, key points, formulas…"
            placeholderTextColor={Colors.gray400}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Image */}
          <Text style={styles.label}>Attach Image (optional)</Text>
          <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderIcon}>📷</Text>
                <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
              </View>
            )}
          </TouchableOpacity>

          {imageUri && (
            <TouchableOpacity onPress={() => { setImageUri(null); setImageBase64(null); }}>
              <Text style={styles.removeImage}>Remove image</Text>
            </TouchableOpacity>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, (!title || !subjectTag) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Add Topic</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  navHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: Colors.gray100,
  },
  cancelText: { fontSize: 16, color: Colors.primary },
  navTitle: { fontSize: 17, fontWeight: '700', color: Colors.gray900 },
  container: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.gray700, marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: Colors.gray200, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.gray900, backgroundColor: Colors.gray50,
  },
  inputError: { borderColor: Colors.error },
  textArea: { height: 120, paddingTop: 12 },
  errorText: { color: Colors.error, fontSize: 12, marginTop: 4 },
  imageBtn: { borderRadius: 10, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 180, borderRadius: 10 },
  imagePlaceholder: {
    height: 100, borderWidth: 1, borderColor: Colors.gray200,
    borderStyle: 'dashed', borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray50,
  },
  imagePlaceholderIcon: { fontSize: 28, marginBottom: 6 },
  imagePlaceholderText: { fontSize: 14, color: Colors.gray400 },
  removeImage: { fontSize: 13, color: Colors.error, marginTop: 6 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 28,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
