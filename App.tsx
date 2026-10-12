import { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameAudioProvider } from './src/audio/GameAudioProvider';
import IntroScreen from './src/components/IntroScreen';
import SettingsScreen from './src/components/SettingsScreen';
import { CareerProvider } from './src/career/CareerProvider';
import {
  hasResumableGameSave,
  loadGameSave,
  saveGameSave,
} from './src/game/gameSaveStorage';
import { I18nProvider } from './src/i18n/I18nContext';
import GameScreen from './src/screens/GameScreen';
import { SettingsProvider } from './src/settings/SettingsProvider';
import type { SavedGameSnapshot } from './src/types/game';

type AppScreen = 'intro' | 'game';
type SettingsOrigin = 'intro' | 'game';

function AppShell() {
  const [screen, setScreen] = useState<AppScreen>('intro');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsOrigin, setSettingsOrigin] = useState<SettingsOrigin>('intro');
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [bgmSuppressed, setBgmSuppressed] = useState(false);
  const [gameLaunch, setGameLaunch] = useState<{ id: number; save: SavedGameSnapshot | null }>({
    id: 0,
    save: null,
  });

  const refreshSavedGame = useCallback(() => {
    void hasResumableGameSave().then(setHasSavedGame);
  }, []);

  useEffect(() => {
    refreshSavedGame();
  }, [refreshSavedGame, screen, showSettings]);

  const openSettings = useCallback((origin: SettingsOrigin) => {
    setSettingsOrigin(origin);
    setShowSettings(true);
  }, []);

  const handleSettingsBack = useCallback(() => {
    setShowSettings(false);
    if (settingsOrigin === 'intro') {
      setScreen('intro');
    }
  }, [settingsOrigin]);

  const handlePlayNew = useCallback(() => {
    setBgmSuppressed(false);
    setGameLaunch((prev) => ({ id: prev.id + 1, save: null }));
    setScreen('game');
  }, []);

  const handleContinue = useCallback(async () => {
    const save = await loadGameSave();
    if (!save) {
      refreshSavedGame();
      return;
    }
    setBgmSuppressed(false);
    setGameLaunch((prev) => ({ id: prev.id + 1, save }));
    setScreen('game');
  }, [refreshSavedGame]);

  const handlePauseToIntro = useCallback((snapshot: SavedGameSnapshot) => {
    setBgmSuppressed(true);
    setScreen('intro');
    refreshSavedGame();
    void saveGameSave(snapshot);
  }, [refreshSavedGame]);

  const bgmActive = screen === 'game' && !showSettings && !bgmSuppressed;

  let content;
  if (showSettings) {
    content = <SettingsScreen onBack={handleSettingsBack} />;
  } else if (screen === 'intro') {
    content = (
      <IntroScreen
        hasSavedGame={hasSavedGame}
        onPlay={handlePlayNew}
        onContinue={handleContinue}
        onOpenSettings={() => openSettings('intro')}
      />
    );
  } else {
    content = (
      <GameScreen
        key={gameLaunch.id}
        initialSave={gameLaunch.save}
        onOpenSettings={() => openSettings('game')}
        onPauseToIntro={handlePauseToIntro}
      />
    );
  }

  return <GameAudioProvider bgmActive={bgmActive}>{content}</GameAudioProvider>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <SettingsProvider>
          <CareerProvider>
            <AppShell />
          </CareerProvider>
        </SettingsProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
