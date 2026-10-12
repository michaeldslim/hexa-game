import AsyncStorage from '@react-native-async-storage/async-storage';
import { BEST_SCORE_KEY } from '../constants/game';

export type BestScoreRecord = {
  score: number;
  initials: string;
};

const DEFAULT_RECORD: BestScoreRecord = { score: 0, initials: '' };

function normalizeInitials(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);
}

function parseRecord(raw: string | null): BestScoreRecord {
  if (!raw) {
    return DEFAULT_RECORD;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as BestScoreRecord).score === 'number' &&
      typeof (parsed as BestScoreRecord).initials === 'string'
    ) {
      const record = parsed as BestScoreRecord;
      return {
        score: Math.max(0, Math.floor(record.score)),
        initials: normalizeInitials(record.initials),
      };
    }
  } catch {
    const legacy = Number(raw);
    if (!Number.isNaN(legacy) && legacy > 0) {
      return { score: legacy, initials: '' };
    }
  }

  return DEFAULT_RECORD;
}

export async function loadBestScoreRecord(): Promise<BestScoreRecord> {
  try {
    const raw = await AsyncStorage.getItem(BEST_SCORE_KEY);
    return parseRecord(raw);
  } catch {
    return DEFAULT_RECORD;
  }
}

export async function saveBestScoreRecord(record: BestScoreRecord): Promise<void> {
  const payload: BestScoreRecord = {
    score: Math.max(0, Math.floor(record.score)),
    initials: normalizeInitials(record.initials),
  };
  await AsyncStorage.setItem(BEST_SCORE_KEY, JSON.stringify(payload));
}

export { normalizeInitials };
