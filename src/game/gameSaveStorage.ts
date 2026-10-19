import AsyncStorage from '@react-native-async-storage/async-storage';
import { BOARD_COLS, BOARD_ROWS, SAVED_GAME_KEY } from '../constants/game';
import type { SavedGameSnapshot } from '../types/game';

function isValidSnapshot(value: unknown): value is SavedGameSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const snap = value as SavedGameSnapshot;
  const versionOk = snap.version === 1 || snap.version === 2;
  const boardOk =
    Array.isArray(snap.board) &&
    snap.board.length === BOARD_ROWS &&
    snap.board.every(
      (row) => Array.isArray(row) && row.length === BOARD_COLS,
    );
  return (
    versionOk &&
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
    return isValidSnapshot(parsed) ? parsed : null;
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
