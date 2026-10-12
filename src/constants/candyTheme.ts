import type { CandyKind } from '../types/game';

export const CANDY_FRAME_HEX: Record<CandyKind, string> = {
  Red: '#FF5A5F',
  Blue: '#4D96FF',
  Gold: '#FFD93D',
  Mint: '#6BCB77',
};

export const CANDY_FRAME_GLOW: Record<CandyKind, string> = {
  Red: 'rgba(255, 90, 95, 0.22)',
  Blue: 'rgba(77, 150, 255, 0.22)',
  Gold: 'rgba(255, 217, 61, 0.22)',
  Mint: 'rgba(107, 203, 119, 0.22)',
};
