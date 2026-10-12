import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ScoreRecordEntry } from '../game/scoreRecordsStorage';
import { useI18n } from '../i18n/I18nContext';

type HighScoreRecordsModalProps = {
  visible: boolean;
  records: ScoreRecordEntry[];
  onClose: () => void;
};

export default function HighScoreRecordsModal({
  visible,
  records,
  onClose,
}: HighScoreRecordsModalProps) {
  const insets = useSafeAreaInsets();
  const { strings, format } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.card}>
          <Text style={styles.title}>{strings.scoreRecords.title}</Text>
          {records.length === 0 ? (
            <Text style={styles.empty}>{strings.scoreRecords.empty}</Text>
          ) : (
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {records.map((entry, index) => (
                <View key={`${entry.score}-${entry.savedAt}-${index}`} style={styles.row}>
                  <Text style={styles.rank}>{format(strings.scoreRecords.rank, { rank: index + 1 })}</Text>
                  <Text style={styles.initials}>{entry.initials || '—'}</Text>
                  <Text style={styles.score}>{entry.score.toLocaleString()}</Text>
                </View>
              ))}
            </ScrollView>
          )}
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonLabel}>{strings.scoreRecords.close}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1b263b',
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: '#415a77',
    maxHeight: '80%',
  },
  title: {
    color: '#ffd166',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  empty: {
    color: '#8d99ae',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  list: {
    maxHeight: 320,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#415a77',
    gap: 8,
  },
  rank: {
    color: '#8d99ae',
    fontSize: 13,
    fontWeight: '600',
    width: 36,
  },
  initials: {
    flex: 1,
    color: '#ffd166',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },
  score: {
    color: '#edf2f4',
    fontSize: 16,
    fontWeight: '700',
    minWidth: 72,
    textAlign: 'right',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#415a77',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#edf2f4',
    fontSize: 16,
    fontWeight: '700',
  },
});
