export type CandyKind = 'Red' | 'Blue' | 'Gold' | 'Mint';

/** Fixed obstacle; does not match or fall. */
export type StoneCell = 'Stone';

export type BoardCell = CandyKind | StoneCell | null;

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
  version: 1 | 2;
  playMode: PlayMode;
  board: Board;
  piece: ActivePiece | null;
  nextGems: Triplet;
  score: number;
  level: number;
  combo: number;
  savedAt: number;
  heldGems?: Triplet | null;
  holdUsed?: boolean;
  collectProgress?: Partial<Record<CandyKind, number>>;
}

export type MatchFeedback = {
  id: number;
  score: number;
  rowBonus: boolean;
};
