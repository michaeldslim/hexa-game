import type { CandyKind, PlayMode } from '../types/game';

export const BOARD_COLS = 8;
export const BOARD_ROWS = 14;

/** Spawn columns 4–5 (1-based) → indices 3–4 on the 8-wide board. */
export const SPAWN_COLUMN_INDICES: readonly number[] = [3, 4];

export const MIN_MATCH = 3;
export const MAX_LEVEL = 5;

export const SCORE_PER_TILE = 10;
export const SCORE_CHAIN_BONUS = 15;

export const DROP_MS_BASE = 750;
export const DROP_MS_MIN = 320;
export const DROP_MS_LEVEL_STEP = 45;

/** Sparkle + pop before cells are removed from the board. */
export const MATCH_SPARKLE_MS = 360;
export const MATCH_POP_MS = 200;
export const MATCH_CHAIN_GAP_MS = 90;
export const SPAWN_AFTER_MATCH_MS = 160;
/** Combo callout visible ~1s (candy-break style fade). */
export const COMBO_POPUP_MS = 1000;

export const BEST_SCORE_KEY = 'hexaBestScore';
export const SCORE_RECORDS_KEY = 'hexaScoreRecords';
export const MAX_SCORE_RECORDS = 10;
export const PLAY_MODE_KEY = 'hexaPlayMode';
export const SAVED_GAME_KEY = 'hexaSavedGame';

export const CANDY_KINDS: CandyKind[] = ['Red', 'Blue', 'Gold', 'Mint'];

/** Cumulative score thresholds: reaching score >= value completes that level. */
export const LEVEL_SCORE_THRESHOLDS: Record<number, number> = {
  1: 1500,
  2: 3500,
  3: 6000,
  4: 9500,
  5: 14000,
};

export function activeKindCount(_level: number): number {
  return CANDY_KINDS.length;
}

export function activeKinds(level: number): CandyKind[] {
  return CANDY_KINDS.slice(0, activeKindCount(level));
}

export function dropIntervalMs(level: number): number {
  return Math.max(DROP_MS_MIN, DROP_MS_BASE - (level - 1) * DROP_MS_LEVEL_STEP);
}

export function levelGoalScore(level: number): number {
  return LEVEL_SCORE_THRESHOLDS[level] ?? LEVEL_SCORE_THRESHOLDS[MAX_LEVEL];
}

export function isRunWon(playMode: PlayMode, level: number, score: number): boolean {
  return playMode === 'level' && level >= MAX_LEVEL && score >= levelGoalScore(MAX_LEVEL);
}

export const DEFAULT_PLAY_MODE: PlayMode = 'level';
