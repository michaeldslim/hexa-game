import {
  BOARD_COLS,
  BOARD_ROWS,
  MIN_MATCH,
  SCORE_CHAIN_BONUS,
  SCORE_PER_TILE,
  activeKinds,
  SPAWN_COLUMN_INDICES,
} from '../constants/game';
import type { ActivePiece, Board, CandyKind, MatchResolution, Triplet } from '../types/game';

const LINE_DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null),
  );
}

export function rollTriplet(level: number): Triplet {
  const pool = [...activeKinds(level)];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return [pool[0], pool[1], pool[2]];
}

export function rotateTriplet(gems: Triplet): Triplet {
  return [gems[2], gems[0], gems[1]];
}

export function pieceCells(piece: ActivePiece): { row: number; col: number; gem: CandyKind }[] {
  return [0, 1, 2].map((offset) => ({
    row: piece.row + offset,
    col: piece.col,
    gem: piece.gems[offset],
  }));
}

export function canPlacePiece(board: Board, piece: ActivePiece): boolean {
  for (const { row, col } of pieceCells(piece)) {
    if (col < 0 || col >= BOARD_COLS || row >= BOARD_ROWS) {
      return false;
    }
    if (row >= 0 && board[row][col] !== null) {
      return false;
    }
  }
  return true;
}

export function createSpawnPiece(col: number, row: number, gems: Triplet): ActivePiece {
  return { col, row, gems };
}

const SPAWN_ROW = -2;

export function defaultSpawn(board: Board, gems: Triplet): ActivePiece | null {
  const viableCols: number[] = [];
  for (const col of SPAWN_COLUMN_INDICES) {
    if (canPlacePiece(board, createSpawnPiece(col, SPAWN_ROW, gems))) {
      viableCols.push(col);
    }
  }

  if (viableCols.length === 0) {
    return null;
  }

  const col = viableCols[Math.floor(Math.random() * viableCols.length)];
  return createSpawnPiece(col, SPAWN_ROW, gems);
}

export function tryMoveHorizontal(board: Board, piece: ActivePiece, delta: number): ActivePiece | null {
  const next = { ...piece, col: piece.col + delta };
  return canPlacePiece(board, next) ? next : null;
}

export function tryMoveDown(board: Board, piece: ActivePiece): ActivePiece | 'locked' {
  const next = { ...piece, row: piece.row + 1 };
  if (canPlacePiece(board, next)) {
    return next;
  }
  return 'locked';
}

export function tryRotate(board: Board, piece: ActivePiece): ActivePiece {
  return { ...piece, gems: rotateTriplet(piece.gems) };
}

export function lockPiece(board: Board, piece: ActivePiece): Board {
  const next = board.map((row) => [...row]);
  for (const { row, col, gem } of pieceCells(piece)) {
    if (row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS) {
      next[row][col] = gem;
    }
  }
  return next;
}

export function findMatchKeys(board: Board): Set<string> {
  const matched = new Set<string>();

  for (const [dr, dc] of LINE_DIRS) {
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) {
        const kind = board[row][col];
        if (!kind) {
          continue;
        }

        const prevRow = row - dr;
        const prevCol = col - dc;
        if (
          prevRow >= 0 &&
          prevRow < BOARD_ROWS &&
          prevCol >= 0 &&
          prevCol < BOARD_COLS &&
          board[prevRow][prevCol] === kind
        ) {
          continue;
        }

        let length = 0;
        let scanRow = row;
        let scanCol = col;
        while (
          scanRow >= 0 &&
          scanRow < BOARD_ROWS &&
          scanCol >= 0 &&
          scanCol < BOARD_COLS &&
          board[scanRow][scanCol] === kind
        ) {
          length += 1;
          scanRow += dr;
          scanCol += dc;
        }

        if (length < MIN_MATCH) {
          continue;
        }

        scanRow = row;
        scanCol = col;
        for (let i = 0; i < length; i += 1) {
          matched.add(`${scanRow}:${scanCol}`);
          scanRow += dr;
          scanCol += dc;
        }
      }
    }
  }

  return matched;
}

export function applyGravity(board: Board): Board {
  const next = createEmptyBoard();

  for (let col = 0; col < BOARD_COLS; col += 1) {
    const stack: CandyKind[] = [];
    for (let row = BOARD_ROWS - 1; row >= 0; row -= 1) {
      const cell = board[row][col];
      if (cell) {
        stack.push(cell);
      }
    }
    for (let i = 0; i < stack.length; i += 1) {
      next[BOARD_ROWS - 1 - i][col] = stack[i];
    }
  }

  return next;
}

export function clearMatches(board: Board, keys: Set<string>): Board {
  const next = board.map((row) => [...row]);
  keys.forEach((key) => {
    const [rowStr, colStr] = key.split(':');
    const row = Number(rowStr);
    const col = Number(colStr);
    if (next[row]?.[col] !== undefined) {
      next[row][col] = null;
    }
  });
  return next;
}

export function scoreForClear(tileCount: number, chainIndex: number): number {
  const base = tileCount * SCORE_PER_TILE;
  const chainBonus = chainIndex > 0 ? chainIndex * SCORE_CHAIN_BONUS : 0;
  return base + chainBonus;
}

export type MatchClearStep = {
  matchedKeys: string[];
  boardBeforeClear: Board;
};

export function resolveBoardWithSteps(board: Board): {
  steps: MatchClearStep[];
  finalBoard: Board;
  totalCleared: number;
  totalScore: number;
} {
  let working = board;
  let totalCleared = 0;
  let totalScore = 0;
  let chain = 0;
  const steps: MatchClearStep[] = [];

  while (true) {
    const keys = findMatchKeys(working);
    if (keys.size === 0) {
      break;
    }
    steps.push({
      matchedKeys: [...keys],
      boardBeforeClear: working,
    });
    totalScore += scoreForClear(keys.size, chain);
    totalCleared += keys.size;
    working = applyGravity(clearMatches(working, keys));
    chain += 1;
  }

  return { steps, finalBoard: working, totalCleared, totalScore };
}

export function resolveBoard(board: Board): { board: Board; totalCleared: number; totalScore: number } {
  const { finalBoard, totalCleared, totalScore } = resolveBoardWithSteps(board);
  return { board: finalBoard, totalCleared, totalScore };
}

export function lockAndResolve(board: Board, piece: ActivePiece): MatchResolution {
  const locked = lockPiece(board, piece);
  const { finalBoard, totalCleared, totalScore } = resolveBoardWithSteps(locked);
  return {
    board: finalBoard,
    clearedCount: totalCleared,
    scoreGain: totalScore,
    hadMatch: totalCleared > 0,
  };
}

export function cellAt(board: Board, row: number, col: number, piece: ActivePiece | null): CandyKind | null {
  if (piece) {
    for (const cell of pieceCells(piece)) {
      if (cell.row === row && cell.col === col) {
        return cell.gem;
      }
    }
  }
  if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) {
    return null;
  }
  return board[row][col];
}
