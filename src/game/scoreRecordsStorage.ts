import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_SCORE_RECORDS, SCORE_RECORDS_KEY } from '../constants/game';
import {
  loadBestScoreRecord,
  normalizeInitials,
  type BestScoreRecord,
} from './bestScoreStorage';

export type ScoreRecordEntry = {
  score: number;
  initials: string;
  savedAt: number;
};

function parseEntries(raw: string | null): ScoreRecordEntry[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item): ScoreRecordEntry | null => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const row = item as ScoreRecordEntry;
        if (typeof row.score !== 'number') {
          return null;
        }
        return {
          score: Math.max(0, Math.floor(row.score)),
          initials: normalizeInitials(typeof row.initials === 'string' ? row.initials : ''),
          savedAt: typeof row.savedAt === 'number' ? row.savedAt : 0,
        };
      })
      .filter((entry): entry is ScoreRecordEntry => entry !== null)
      .sort((a, b) => b.score - a.score || a.savedAt - b.savedAt)
      .slice(0, MAX_SCORE_RECORDS);
  } catch {
    return [];
  }
}

function sortAndTrim(entries: ScoreRecordEntry[]): ScoreRecordEntry[] {
  return [...entries]
    .sort((a, b) => b.score - a.score || a.savedAt - b.savedAt)
    .slice(0, MAX_SCORE_RECORDS);
}

async function persist(entries: ScoreRecordEntry[]): Promise<void> {
  await AsyncStorage.setItem(SCORE_RECORDS_KEY, JSON.stringify(sortAndTrim(entries)));
}

function entryFromBest(best: BestScoreRecord): ScoreRecordEntry | null {
  if (best.score <= 0) {
    return null;
  }
  return {
    score: best.score,
    initials: best.initials,
    savedAt: 0,
  };
}

export async function loadScoreRecords(): Promise<ScoreRecordEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(SCORE_RECORDS_KEY);
    let entries = parseEntries(raw);
    if (entries.length === 0) {
      const best = await loadBestScoreRecord();
      const legacy = entryFromBest(best);
      if (legacy) {
        entries = [legacy];
        await persist(entries);
      }
    }
    return entries;
  } catch {
    return [];
  }
}

export async function appendScoreRecord(
  record: Pick<ScoreRecordEntry, 'score' | 'initials'>,
): Promise<ScoreRecordEntry[]> {
  const entries = await loadScoreRecords();
  const next: ScoreRecordEntry = {
    score: Math.max(0, Math.floor(record.score)),
    initials: normalizeInitials(record.initials),
    savedAt: Date.now(),
  };
  const merged = sortAndTrim([...entries, next]);
  await persist(merged);
  return merged;
}
