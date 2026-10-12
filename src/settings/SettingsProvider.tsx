import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { resolveAvatarId, type AvatarId } from '../constants/avatars';
import type { PlayMode } from '../types/game';
import {
  clampVolume,
  DEFAULT_SETTINGS,
  isBgmTrack,
  type AppSettings,
  type BgmTrack,
} from './types';

const STORAGE_KEY = 'hexaAppSettings';

function loadSettings(raw: string | null): AppSettings {
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const playMode =
      parsed.playMode === 'endless' || parsed.playMode === 'level'
        ? parsed.playMode
        : DEFAULT_SETTINGS.playMode;

    return {
      careerModeEnabled: parsed.careerModeEnabled ?? DEFAULT_SETTINGS.careerModeEnabled,
      playMode,
      bgmTrack: isBgmTrack(parsed.bgmTrack) ? parsed.bgmTrack : DEFAULT_SETTINGS.bgmTrack,
      bgmVolume: clampVolume(parsed.bgmVolume ?? DEFAULT_SETTINGS.bgmVolume),
      sfxVolume: clampVolume(parsed.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume),
      playerAvatarId: resolveAvatarId(parsed.playerAvatarId, DEFAULT_SETTINGS.playerAvatarId),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface SettingsContextValue {
  settings: AppSettings;
  loaded: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setBgmTrack: (track: BgmTrack) => void;
  setBgmVolume: (level: number) => void;
  setSfxVolume: (level: number) => void;
  setPlayerAvatarId: (avatarId: AvatarId) => void;
  setCareerModeEnabled: (enabled: boolean) => void;
  setPlayMode: (mode: PlayMode) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!cancelled && raw) {
          setSettings(loadSettings(raw));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: AppSettings) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((previous) => {
        const next = { ...previous, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setBgmTrack = useCallback(
    (bgmTrack: BgmTrack) => updateSettings({ bgmTrack }),
    [updateSettings],
  );
  const setBgmVolume = useCallback(
    (bgmVolume: number) => updateSettings({ bgmVolume: clampVolume(bgmVolume) }),
    [updateSettings],
  );
  const setSfxVolume = useCallback(
    (sfxVolume: number) => updateSettings({ sfxVolume: clampVolume(sfxVolume) }),
    [updateSettings],
  );
  const setPlayerAvatarId = useCallback(
    (playerAvatarId: AvatarId) => updateSettings({ playerAvatarId }),
    [updateSettings],
  );
  const setCareerModeEnabled = useCallback(
    (careerModeEnabled: boolean) => updateSettings({ careerModeEnabled }),
    [updateSettings],
  );
  const setPlayMode = useCallback(
    (playMode: PlayMode) => updateSettings({ playMode }),
    [updateSettings],
  );

  const value = useMemo(
    () => ({
      settings,
      loaded,
      updateSettings,
      setBgmTrack,
      setBgmVolume,
      setSfxVolume,
      setPlayerAvatarId,
      setCareerModeEnabled,
      setPlayMode,
    }),
    [
      settings,
      loaded,
      updateSettings,
      setBgmTrack,
      setBgmVolume,
      setSfxVolume,
      setPlayerAvatarId,
      setCareerModeEnabled,
      setPlayMode,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
