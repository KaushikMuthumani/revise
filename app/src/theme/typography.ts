import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const Typography = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '700', color: Colors.gray900, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', color: Colors.gray900 },
  h3: { fontSize: 18, fontWeight: '600', color: Colors.gray900 },
  h4: { fontSize: 16, fontWeight: '600', color: Colors.gray900 },
  body: { fontSize: 15, fontWeight: '400', color: Colors.gray700 },
  bodySmall: { fontSize: 13, fontWeight: '400', color: Colors.gray500 },
  caption: { fontSize: 12, fontWeight: '400', color: Colors.gray400 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.gray600 },
  button: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
