import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CAREER_STATE } from './careerProgress';
import { CAREER_RANK_ORDER } from './careerRules';
import type { CareerRank, CareerState } from '../types/career';

const STORAGE_KEY = 'hexaCareerState';

function isCareerRank(value: unknown): value is CareerRank {
  return typeof value === 'string' && CAREER_RANK_ORDER.includes(value as CareerRank);
}

export function parseCareerState(raw: string | null): CareerState {
  if (!raw) {
    return DEFAULT_CAREER_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CareerState>;
    const rank = isCareerRank(parsed.rank) ? parsed.rank : DEFAULT_CAREER_STATE.rank;
    const highestRankAchieved = isCareerRank(parsed.highestRankAchieved)
      ? parsed.highestRankAchieved
      : rank;
    const promotionWins =
      typeof parsed.promotionWins === 'number' && parsed.promotionWins >= 0
        ? Math.floor(parsed.promotionWins)
        : 0;

    return { rank, promotionWins, highestRankAchieved };
  } catch {
    return DEFAULT_CAREER_STATE;
  }
}

export async function loadCareerState(): Promise<CareerState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return parseCareerState(raw);
}

export async function saveCareerState(state: CareerState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
