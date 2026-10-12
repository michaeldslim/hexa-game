import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useSettings } from '../settings/SettingsProvider';
import { levelToVolume } from '../settings/types';
import { getBgmSource, SOUND_ASSETS, type SfxId } from './sounds';

type GameAudioContextValue = {
  playSfx: (id: SfxId) => void;
  pauseBgm: () => void;
  resumeBgm: () => void;
};

const GameAudioContext = createContext<GameAudioContextValue | null>(null);

function sfxSource(id: SfxId) {
  if (id === 'dropped') {
    return SOUND_ASSETS.dropped;
  }
  if (id === 'lineMatched') {
    return SOUND_ASSETS.lineMatched;
  }
  return SOUND_ASSETS.gameOver;
}

export function GameAudioProvider({
  children,
  bgmActive,
}: {
  children: ReactNode;
  bgmActive: boolean;
}) {
  const { settings } = useSettings();
  const bgmRef = useRef<AudioPlayer | null>(null);
  const sfxRef = useRef<Partial<Record<SfxId, AudioPlayer>>>({});

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    });

    return () => {
      bgmRef.current?.remove();
      bgmRef.current = null;
      Object.values(sfxRef.current).forEach((player) => {
        player?.remove();
      });
      sfxRef.current = {};
    };
  }, []);

  const pauseBgm = useCallback(() => {
    bgmRef.current?.pause();
  }, []);

  const resumeBgm = useCallback(() => {
    const player = bgmRef.current;
    if (player && settings.bgmVolume > 0 && bgmActive) {
      player.play();
    }
  }, [bgmActive, settings.bgmVolume]);

  useEffect(() => {
    const volume = levelToVolume(settings.bgmVolume);
    const source = getBgmSource(settings.bgmTrack);

    bgmRef.current?.remove();
    bgmRef.current = null;

    const player = createAudioPlayer(source);
    bgmRef.current = player;
    player.loop = true;
    player.volume = volume;
    player.pause();

    return () => {
      player.remove();
      if (bgmRef.current === player) {
        bgmRef.current = null;
      }
    };
  }, [settings.bgmTrack, settings.bgmVolume]);

  useLayoutEffect(() => {
    const player = bgmRef.current;
    if (!player) {
      return;
    }
    player.volume = levelToVolume(settings.bgmVolume);
    if (settings.bgmVolume > 0 && bgmActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [bgmActive, settings.bgmVolume]);

  const ensureSfx = useCallback((id: SfxId): AudioPlayer => {
    const cached = sfxRef.current[id];
    if (cached) {
      return cached;
    }
    const player = createAudioPlayer(sfxSource(id), { keepAudioSessionActive: true });
    sfxRef.current[id] = player;
    player.loop = false;
    return player;
  }, []);

  const playSfx = useCallback(
    (id: SfxId) => {
      if (settings.sfxVolume <= 0) {
        return;
      }

      const volume = levelToVolume(settings.sfxVolume);
      const player = ensureSfx(id);

      if (id === 'gameOver') {
        bgmRef.current?.pause();
      }

      player.volume = volume;
      void player.seekTo(0).then(() => {
        player.play();
      });
    },
    [ensureSfx, settings.sfxVolume],
  );

  const value = useMemo(
    () => ({ playSfx, pauseBgm, resumeBgm }),
    [pauseBgm, playSfx, resumeBgm],
  );

  return <GameAudioContext.Provider value={value}>{children}</GameAudioContext.Provider>;
}

export function useGameAudio(): GameAudioContextValue {
  const context = useContext(GameAudioContext);
  if (!context) {
    throw new Error('useGameAudio must be used within GameAudioProvider');
  }
  return context;
}
