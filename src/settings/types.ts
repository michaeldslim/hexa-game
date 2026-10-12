import type { AvatarId } from '../constants/avatars';
import { DEFAULT_PLAYER_AVATAR_ID } from '../constants/avatars';
import type { PlayMode } from '../types/game';
import { DEFAULT_PLAY_MODE } from '../constants/game';

export type BgmTrack = 'BGM1' | 'BGM2' | 'BGM3' | 'BGM4';

export const BGM_TRACKS: BgmTrack[] = ['BGM1', 'BGM2', 'BGM3', 'BGM4'];

export function isBgmTrack(value: unknown): value is BgmTrack {
  return typeof value === 'string' && BGM_TRACKS.includes(value as BgmTrack);
}

export const VOLUME_MIN = 1;
export const VOLUME_MAX = 9;

export function clampVolume(level: number): number {
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, Math.round(level)));
}

/** Map level 1–9 to 0–1 volume. */
export function levelToVolume(level: number): number {
  return clampVolume(level) / VOLUME_MAX;
}

export interface AppSettings {
  careerModeEnabled: boolean;
  playMode: PlayMode;
  bgmTrack: BgmTrack;
  bgmVolume: number;
  sfxVolume: number;
  playerAvatarId: AvatarId;
}

export const DEFAULT_SETTINGS: AppSettings = {
  careerModeEnabled: true,
  playMode: DEFAULT_PLAY_MODE,
  bgmTrack: 'BGM1',
  bgmVolume: 5,
  sfxVolume: 5,
  playerAvatarId: DEFAULT_PLAYER_AVATAR_ID,
};
