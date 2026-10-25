import { STONE_LIFETIME_MS } from '../constants/game';
import type { Board, StoneTimer } from '../types/game';
import { applyGravity } from '../utils/hexaEngine';

export function findNewStoneCells(
  before: Board,
  after: Board,
): { row: number; col: number }[] {
  const added: { row: number; col: number }[] = [];
  for (let row = 0; row < after.length; row += 1) {
    for (let col = 0; col < after[row]!.length; col += 1) {
      if (before[row]?.[col] !== 'Stone' && after[row]![col] === 'Stone') {
        added.push({ row, col });
      }
    }
  }
  return added;
}

export function enqueueNewStones(
  before: Board,
  after: Board,
  queue: StoneTimer[],
  now = Date.now(),
): StoneTimer[] {
  const added = findNewStoneCells(before, after);
  if (added.length === 0) {
    return queue;
  }
  const spawned = added.map(({ row, col }) => ({
    row,
    col,
    expiresAt: now + STONE_LIFETIME_MS,
  }));
  return [...queue, ...spawned];
}

/** Remove expired stones in spawn order; applies gravity after each removal. */
export function expireStonesDue(
  board: Board,
  queue: StoneTimer[],
  now: number,
): { board: Board; queue: StoneTimer[]; removed: boolean } {
  let nextBoard = board;
  const nextQueue = [...queue];
  let removed = false;

  while (nextQueue.length > 0 && nextQueue[0]!.expiresAt <= now) {
    const { row, col } = nextQueue.shift()!;
    if (nextBoard[row]?.[col] === 'Stone') {
      const cleared = nextBoard.map((r) => [...r]);
      cleared[row]![col] = null;
      nextBoard = applyGravity(cleared);
      removed = true;
    }
  }

  return { board: nextBoard, queue: nextQueue, removed };
}

export function stoneTimersForBoard(board: Board, now = Date.now()): StoneTimer[] {
  const timers: StoneTimer[] = [];
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row]!.length; col += 1) {
      if (board[row]![col] === 'Stone') {
        timers.push({ row, col, expiresAt: now + STONE_LIFETIME_MS });
      }
    }
  }
  return timers;
}

export function pruneStoneTimers(queue: StoneTimer[], board: Board): StoneTimer[] {
  return queue.filter(({ row, col }) => board[row]?.[col] === 'Stone');
}
