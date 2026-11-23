export type CandyKind = 'Red' | 'Blue' | 'Gold' | 'Mint' | 'Green';

export type BoardCell = CandyKind | null;

export type PlayMode = 'endless' | 'level';

export type Board = BoardCell[][];

export type Triplet = [CandyKind, CandyKind, CandyKind];

export interface ActivePiece {
  col: number;
  /** Row index of the top gem in the triplet. */
  row: number;
  gems: Triplet;
}

export interface MatchResolution {
  board: Board;
  clearedCount: number;
  scoreGain: number;
  hadMatch: boolean;
}

export interface SavedGameSnapshot {
  version: 1 | 2 | 3;
  playMode: PlayMode;
  board: Board;
  piece: ActivePiece | null;
  nextGems: Triplet;
  score: number;
  level: number;
  combo: number;
  savedAt: number;
  collectProgress?: Partial<Record<CandyKind, number>>;
  /** Rows 0..count-1 are ceiling-blocked (v3). */
  blockedRowCount?: number;
  /** @deprecated use ceilingBlockRemainingMs on save */
  ceilingNextBlockAt?: number | null;
  /** Ms until the next ceiling row locks when the snapshot was saved. */
  ceilingBlockRemainingMs?: number | null;
  /** Visual candy per locked row index (same kind across the row). */
  ceilingRowKinds?: CandyKind[];
}

export type MatchFeedback = {
  id: number;
  score: number;
  rowBonus: boolean;
};
