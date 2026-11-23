import {
  BOARD_COLS,
  CEILING_BLOCK_INTERVAL_MS,
  CEILING_FIRST_BLOCK_MS,
  CEILING_MAX_BLOCKED_ROWS,
  activeKinds,
} from '../constants/game';
import type { ActivePiece, Board, CandyKind, SavedGameSnapshot } from '../types/game';
import { isCandyCell, pieceCells } from '../utils/hexaEngine';

export function rowHasAnyGem(board: Board, row: number): boolean {
  for (let col = 0; col < BOARD_COLS; col += 1) {
    if (isCandyCell(board[row]?.[col])) {
      return true;
    }
  }
  return false;
}

function rowOccupiedByPiece(piece: ActivePiece | null, row: number): boolean {
  if (!piece) {
    return false;
  }
  return pieceCells(piece).some((cell) => cell.row === row);
}

/** Rule A: only gems already on the board (not the falling triplet). */
export function rowBlockedByStackedGems(board: Board, row: number): boolean {
  return rowHasAnyGem(board, row);
}

export function rowBlockedByFallingPiece(piece: ActivePiece | null, row: number): boolean {
  return rowOccupiedByPiece(piece, row);
}

export function pickCeilingRowKind(level: number): CandyKind {
  const pool = activeKinds(level);
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function assignKindsForNewCeilingRows(
  prevKinds: CandyKind[],
  fromRow: number,
  toRow: number,
  level: number,
): CandyKind[] {
  const next = [...prevKinds];
  for (let row = fromRow; row < toRow; row += 1) {
    next[row] = pickCeilingRowKind(level);
  }
  return next;
}

export function initialCeilingNextBlockAt(now = Date.now()): number {
  return now + CEILING_FIRST_BLOCK_MS;
}

export function ceilingBlockRemainingMs(
  ceilingNextBlockAt: number | null,
  now = Date.now(),
): number | null {
  if (ceilingNextBlockAt === null) {
    return null;
  }
  return Math.max(0, ceilingNextBlockAt - now);
}

/** Resume ceiling timer from a saved game (idle time while away does not count). */
export function ceilingNextBlockAtFromSnapshot(
  snapshot: Pick<
    SavedGameSnapshot,
    'blockedRowCount' | 'ceilingNextBlockAt' | 'ceilingBlockRemainingMs' | 'savedAt'
  >,
  now = Date.now(),
): number | null {
  const count = snapshot.blockedRowCount ?? 0;
  if (count >= CEILING_MAX_BLOCKED_ROWS) {
    return null;
  }

  if (
    snapshot.ceilingBlockRemainingMs !== undefined &&
    snapshot.ceilingBlockRemainingMs !== null
  ) {
    if (snapshot.ceilingBlockRemainingMs <= 0) {
      return now;
    }
    return now + snapshot.ceilingBlockRemainingMs;
  }

  if (
    typeof snapshot.ceilingNextBlockAt === 'number' &&
    typeof snapshot.savedAt === 'number'
  ) {
    const rem = Math.max(0, snapshot.ceilingNextBlockAt - snapshot.savedAt);
    if (rem <= 0) {
      return now;
    }
    return now + rem;
  }

  return initialCeilingNextBlockAt(now);
}

export function scheduleNextCeilingBlockAt(now = Date.now()): number {
  return now + CEILING_BLOCK_INTERVAL_MS;
}

export type CeilingBlockResult =
  | { kind: 'unchanged' }
  | { kind: 'blocked'; blockedRowCount: number; ceilingNextBlockAt: number | null }
  | { kind: 'gameOver' };

/**
 * Locks one more top row (index == current blockedRowCount).
 * Rule A: any gem in that row → game over.
 */
export function tryLockNextCeilingRow(
  board: Board,
  blockedRowCount: number,
  piece: ActivePiece | null,
  now = Date.now(),
): CeilingBlockResult {
  if (blockedRowCount >= CEILING_MAX_BLOCKED_ROWS) {
    return { kind: 'unchanged' };
  }

  const rowToBlock = blockedRowCount;
  if (rowBlockedByStackedGems(board, rowToBlock)) {
    return { kind: 'gameOver' };
  }
  if (rowBlockedByFallingPiece(piece, rowToBlock)) {
    return { kind: 'unchanged' };
  }

  const nextCount = blockedRowCount + 1;
  const ceilingNextBlockAt =
    nextCount >= CEILING_MAX_BLOCKED_ROWS
      ? null
      : scheduleNextCeilingBlockAt(now);

  return { kind: 'blocked', blockedRowCount: nextCount, ceilingNextBlockAt };
}

export function processDueCeilingBlocks(
  board: Board,
  blockedRowCount: number,
  ceilingNextBlockAt: number | null,
  piece: ActivePiece | null,
  now = Date.now(),
): {
  blockedRowCount: number;
  ceilingNextBlockAt: number | null;
  gameOver: boolean;
} {
  let count = blockedRowCount;
  let nextAt = ceilingNextBlockAt;

  while (nextAt !== null && now >= nextAt && count < CEILING_MAX_BLOCKED_ROWS) {
    const result = tryLockNextCeilingRow(board, count, piece, now);
    if (result.kind === 'gameOver') {
      return { blockedRowCount: count, ceilingNextBlockAt: nextAt, gameOver: true };
    }
    if (result.kind === 'unchanged') {
      break;
    }
    count = result.blockedRowCount;
    nextAt = result.ceilingNextBlockAt;
    if (nextAt !== null && now >= nextAt) {
      continue;
    }
    break;
  }

  return { blockedRowCount: count, ceilingNextBlockAt: nextAt, gameOver: false };
}