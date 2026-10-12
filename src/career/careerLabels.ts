import { format } from '../i18n/format';
import type { IStrings } from '../i18n/types';
import type { CareerRank, CareerState } from '../types/career';
import {
  CAREER_RANK_ORDER,
  getPromotionTarget,
  getRequirementToReachRank,
  rankIndex,
} from './careerRules';

export function careerRankLabel(strings: IStrings, rank: CareerRank): string {
  return strings.career.ranks[rank];
}

export function getCareerProgressCopy(
  strings: IStrings,
  state: CareerState,
): { primary: string; secondary?: string } {
  const rankLabel = careerRankLabel(strings, state.rank);
  const target = getPromotionTarget(state.rank);

  if (!target) {
    return { primary: format(strings.career.maxRank, { rank: rankLabel }) };
  }

  return {
    primary: format(strings.career.homeBadge, {
      rank: rankLabel,
      current: state.promotionWins,
      required: target.requiredWins,
    }),
    secondary: format(strings.career.progressNext, {
      nextRank: careerRankLabel(strings, target.nextRank),
      required: target.requiredWins,
    }),
  };
}

export type CareerLadderStatus = 'achieved' | 'current' | 'locked';

export function getCareerLadderStatus(state: CareerState, rank: CareerRank): CareerLadderStatus {
  const currentIndex = rankIndex(state.rank);
  const rowIndex = rankIndex(rank);

  if (rowIndex < currentIndex) {
    return 'achieved';
  }
  if (rowIndex === currentIndex) {
    return 'current';
  }
  return 'locked';
}

export function getCareerLadderRows(): CareerRank[] {
  return [...CAREER_RANK_ORDER].reverse();
}

export function getPromotionRequirementCopy(strings: IStrings, rank: CareerRank): string | null {
  const requirement = getRequirementToReachRank(rank);
  if (!requirement) {
    return null;
  }

  if (requirement.minGameLevel) {
    return format(strings.career.ladder.requirementLevel, {
      wins: requirement.requiredWins,
      level: requirement.minGameLevel,
    });
  }

  return format(strings.career.ladder.requirement, { wins: requirement.requiredWins });
}
