import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BOARD_COLS,
  BOARD_ROWS,
  CANDY_KINDS,
  CEILING_FIRST_BLOCK_MS,
  CEILING_MAX_BLOCKED_ROWS,
  SAVED_GAME_KEY,
} from '../constants/game';
import type { BoardCell, SavedGameSnapshot } from '../types/game';

function isValidBoardCell(cell: unknown): cell is BoardCell {
  return cell === null || CANDY_KINDS.includes(cell as (typeof CANDY_KINDS)[number]);
}

function isValidCeilingSnapshotFields(snap: SavedGameSnapshot): boolean {
  if (snap.version < 3) {
    return (
      snap.blockedRowCount === undefined &&
      snap.ceilingNextBlockAt === undefined &&
      snap.ceilingBlockRemainingMs === undefined
    );
  }

  if (
    typeof snap.blockedRowCount !== 'number' ||
    snap.blockedRowCount < 0 ||
    snap.blockedRowCount > CEILING_MAX_BLOCKED_ROWS
  ) {
    return false;
  }

  const rem = snap.ceilingBlockRemainingMs;
  if (rem !== undefined && rem !== null && typeof rem !== 'number') {
    return false;
  }

  const nextAt = snap.ceilingNextBlockAt;
  if (nextAt !== undefined && nextAt !== null && typeof nextAt !== 'number') {
    return false;
  }

  // v3: remaining ms (current) and/or legacy absolute deadline + savedAt
  if (rem !== undefined || nextAt !== undefined) {
    return true;
  }

  return false;
}

function isValidSnapshot(value: unknown): value is SavedGameSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const snap = value as SavedGameSnapshot;
  const versionOk = snap.version === 1 || snap.version === 2 || snap.version === 3;
  const ceilingOk = isValidCeilingSnapshotFields(snap);
  const boardOk =
    Array.isArray(snap.board) &&
    snap.board.length === BOARD_ROWS &&
    snap.board.every(
      (row) =>
        Array.isArray(row) &&
        row.length === BOARD_COLS &&
        row.every((cell) => isValidBoardCell(cell)),
    );
  return (
    versionOk &&
    ceilingOk &&
    (snap.playMode === 'level' || snap.playMode === 'endless') &&
    boardOk &&
    Array.isArray(snap.nextGems) &&
    snap.nextGems.length === 3 &&
    typeof snap.score === 'number' &&
    typeof snap.level === 'number' &&
    typeof snap.combo === 'number'
  );
}

export async function loadGameSave(): Promise<SavedGameSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_GAME_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSnapshot(parsed)) {
      return null;
    }
    if (parsed.version < 3) {
      return {
        ...parsed,
        version: 3,
        blockedRowCount: 0,
        ceilingBlockRemainingMs: CEILING_FIRST_BLOCK_MS,
        ceilingRowKinds: [],
      };
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveGameSave(snapshot: SavedGameSnapshot): Promise<void> {
  await AsyncStorage.setItem(SAVED_GAME_KEY, JSON.stringify(snapshot));
}

export async function clearGameSave(): Promise<void> {
  await AsyncStorage.removeItem(SAVED_GAME_KEY);
}

export async function hasResumableGameSave(): Promise<boolean> {
  const save = await loadGameSave();
  return save !== null;
}
