import type { CandyKind, PlayMode } from '../types/game';

export const BOARD_COLS = 6;
export const BOARD_ROWS = 12;

/** Any column with room to spawn (Columns-style). */
export const SPAWN_COLUMN_INDICES: readonly number[] = [0, 1, 2, 3, 4, 5];

/** Top row of the piece when it spawns (gems use rows row..row+2, all on the 12-row board). */
export const SPAWN_ROW = 0;

/** 4+ in a line also clears that entire row (Star Line bonus). */
export const ROW_MATCH_BONUS_MIN = 4;

/** Random stone obstacles (mid-board and below). */
export const OBSTACLE_MIN_ROW = 4;
export const OBSTACLE_MAX_ON_BOARD = 9;
export const OBSTACLE_BASE_CHANCE = 0.14;
export const OBSTACLE_CHANCE_PER_LEVEL = 0.025;

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

/** Falling piece height (Columns-style vertical stack). */
export const PIECE_GEM_COUNT = 3;

export function activeKindCount(level: number): number {
  if (level <= 2) {
    return 3;
  }
  return CANDY_KINDS.length;
}

export type LevelCollectGoal = {
  kind: CandyKind;
  required: number;
};

/** Level mode bonus objective (cleared tiles of that color). */
export function levelCollectGoal(level: number): LevelCollectGoal | null {
  switch (level) {
    case 2:
      return { kind: 'Mint', required: 12 };
    case 3:
      return { kind: 'Gold', required: 18 };
    case 4:
      return { kind: 'Red', required: 24 };
    case 5:
      return { kind: 'Blue', required: 30 };
    default:
      return null;
  }
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
