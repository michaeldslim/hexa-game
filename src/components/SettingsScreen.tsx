import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BGM_TRACKS } from '../settings/types';
import { useI18n } from '../i18n/I18nContext';
import { useSettings } from '../settings/SettingsProvider';
import { theme } from '../theme/colors';
import AvatarPicker from './AvatarPicker';
import CareerPanel from './CareerPanel';
import { ChipSelector, VolumeChipRow } from './ChipSelector';

const ANDROID_TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;

type SettingsScreenProps = {
  onBack: () => void;
};

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { strings, language, setLanguage } = useI18n();
  const {
    settings,
    setBgmTrack,
    setBgmVolume,
    setSfxVolume,
    setPlayerAvatarId,
    setCareerModeEnabled,
    setPlayMode,
  } = useSettings();
  const [avatarGridExpanded, setAvatarGridExpanded] = useState(false);
  const [careerOpen, setCareerOpen] = useState(false);

  const bgmOptions = BGM_TRACKS.map((track) => ({
    value: track,
    label: track,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backLabel}>←</Text>
          </Pressable>
          <Text style={styles.title}>{strings.settings.title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(24, insets.bottom + 20) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{strings.settings.language}</Text>
            <ChipSelector
              options={[
                { value: 'ko' as const, label: '한국어' },
                { value: 'en' as const, label: 'English' },
              ]}
              value={language}
              onChange={setLanguage}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{strings.settings.avatars}</Text>
            <ChipSelector
              options={[
                { value: 'show' as const, label: strings.settings.playerAvatarShow },
                { value: 'hide' as const, label: strings.settings.playerAvatarHide },
              ]}
              value={avatarGridExpanded ? 'show' : 'hide'}
              onChange={(mode) => setAvatarGridExpanded(mode === 'show')}
            />
            <AvatarPicker
              label={strings.settings.playerAvatar}
              description={strings.settings.playerAvatarDesc}
              value={settings.playerAvatarId}
              onChange={setPlayerAvatarId}
              gridExpanded={avatarGridExpanded}
              collapsedHint={strings.settings.playerAvatarCollapsedHint}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{strings.settings.sound}</Text>
            <Text style={styles.fieldLabel}>{strings.settings.bgmTrack}</Text>
            <ChipSelector
              options={bgmOptions}
              value={settings.bgmTrack}
              onChange={setBgmTrack}
            />
            <Text style={styles.fieldLabel}>{strings.settings.bgmVolume}</Text>
            <VolumeChipRow value={settings.bgmVolume} onChange={setBgmVolume} />
            <Text style={styles.fieldLabel}>{strings.settings.sfxVolume}</Text>
            <VolumeChipRow value={settings.sfxVolume} onChange={setSfxVolume} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{strings.settings.playMode}</Text>
            <ChipSelector
              options={[
                { value: 'level' as const, label: strings.settings.modeLevel },
                { value: 'endless' as const, label: strings.settings.modeEndless },
              ]}
              value={settings.playMode}
              onChange={setPlayMode}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{strings.settings.careerSection}</Text>
            <Pressable
              style={[styles.toggleRow, settings.careerModeEnabled && styles.toggleRowOn]}
              onPress={() => setCareerModeEnabled(!settings.careerModeEnabled)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>{strings.settings.careerMode}</Text>
                <Text style={styles.toggleDesc}>{strings.settings.careerDesc}</Text>
              </View>
              <Text style={styles.toggleState}>{settings.careerModeEnabled ? 'ON' : 'OFF'}</Text>
            </Pressable>
            {settings.careerModeEnabled ? (
              <Pressable onPress={() => setCareerOpen(true)}>
                <Text style={styles.link}>{strings.settings.careerScreen}</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </View>

      <CareerPanel visible={careerOpen} onClose={() => setCareerOpen(false)} />
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
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.panel,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    borderRadius: 8,
  },
  backLabel: {
    color: theme.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    flex: 1,
    color: theme.accent,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 20,
  },
  section: {
    backgroundColor: theme.panel,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  fieldLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.boardBackground,
    borderRadius: 10,
    padding: 12,
  },
  toggleRowOn: {
    borderWidth: 1,
    borderColor: '#6bcb77',
  },
  toggleTitle: {
    color: theme.text,
    fontWeight: '600',
    fontSize: 14,
  },
  toggleDesc: {
    color: theme.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  toggleState: {
    color: theme.accent,
    fontWeight: '800',
    marginLeft: 12,
  },
  link: {
    color: '#4cc9f0',
    fontSize: 14,
    fontWeight: '600',
  },
});
