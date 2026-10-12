import {
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { useSettings } from '../settings/SettingsProvider';
import { theme } from '../theme/colors';
import PlayerAvatar from './PlayerAvatar';

const ANDROID_TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;

type IntroScreenProps = {
  hasSavedGame: boolean;
  onPlay: () => void;
  onContinue: () => void;
  onOpenSettings: () => void;
};

export default function IntroScreen({
  hasSavedGame,
  onPlay,
  onContinue,
  onOpenSettings,
}: IntroScreenProps) {
  const { strings } = useI18n();
  const { settings } = useSettings();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>{strings.app.title}</Text>
        </View>

        <View style={styles.profileRow}>
          <PlayerAvatar avatarId={settings.playerAvatarId} size="md" />
          <Text style={styles.profileHint}>{strings.intro.avatarHint}</Text>
        </View>

        <View style={styles.actions}>
          {hasSavedGame ? (
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={onContinue}
            >
              <Text style={styles.primaryLabel}>{strings.intro.continueGame}</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={({ pressed }) => [
              hasSavedGame ? styles.secondaryButton : styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onPlay}
          >
            <Text style={hasSavedGame ? styles.secondaryLabel : styles.primaryLabel}>
              {hasSavedGame ? strings.intro.playNew : strings.intro.play}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={onOpenSettings}
          >
            <Text style={styles.secondaryLabel}>{strings.intro.settings}</Text>
          </Pressable>
        </View>

        <Text style={styles.footerHint}>{strings.intro.footerHint}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.background,
    paddingTop: ANDROID_TOP,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 28,
    justifyContent: 'center',
    gap: 28,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: theme.panelBorder,
  },
  title: {
    color: theme.text,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: theme.panel,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  profileHint: {
    flex: 1,
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: theme.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryLabel: {
    color: theme.background,
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: theme.panel,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryLabel: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  footerHint: {
    color: theme.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
