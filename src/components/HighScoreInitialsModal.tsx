import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalizeInitials } from '../game/bestScoreStorage';
import { useI18n } from '../i18n/I18nContext';

type HighScoreInitialsModalProps = {
  visible: boolean;
  score: number;
  onSubmit: (initials: string) => void;
};

export default function HighScoreInitialsModal({
  visible,
  score,
  onSubmit,
}: HighScoreInitialsModalProps) {
  const insets = useSafeAreaInsets();
  const { strings, format } = useI18n();
  const [initials, setInitials] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setInitials('');
      const focusTimer = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(focusTimer);
    }
    setKeyboardHeight(0);
    return undefined;
  }, [visible, score]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const canSubmit = initials.length >= 1;
  const keyboardOpen = keyboardHeight > 0;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <Pressable style={styles.flex} onPress={Keyboard.dismiss}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: insets.top + 16,
                paddingBottom: Math.max(insets.bottom + 16, keyboardHeight + 16),
                justifyContent: keyboardOpen ? 'flex-start' : 'center',
              },
            ]}
          >
            <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.title}>{strings.highScore.title}</Text>
              <Text style={styles.score}>
                {format(strings.highScore.scoreLine, { score })}
              </Text>
              <Text style={styles.hint}>{strings.highScore.initialsHint}</Text>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={initials}
                onChangeText={(text) => setInitials(normalizeInitials(text))}
                maxLength={3}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder={strings.highScore.initialsPlaceholder}
                placeholderTextColor="#64748b"
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (canSubmit) {
                    onSubmit(initials);
                  }
                }}
              />
              <Pressable
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
                disabled={!canSubmit}
                onPress={() => onSubmit(initials)}
              >
                <Text style={styles.buttonLabel}>{strings.highScore.save}</Text>
              </Pressable>
            </Pressable>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    backgroundColor: '#1b263b',
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: '#415a77',
  },
  title: {
    color: '#ffd166',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  score: {
    color: '#edf2f4',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  hint: {
    color: '#8d99ae',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  input: {
    marginTop: 16,
    backgroundColor: '#0b132b',
    borderWidth: 1,
    borderColor: '#415a77',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#ffd166',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    marginTop: 18,
    backgroundColor: '#ffd166',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    color: '#0b132b',
    fontSize: 16,
    fontWeight: '800',
  },
});
