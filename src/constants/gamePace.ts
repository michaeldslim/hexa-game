export type GamePace = 'normal' | 'fast';

export const GAME_PACE_OPTIONS: GamePace[] = ['normal', 'fast'];

export function isGamePace(value: unknown): value is GamePace {
  return value === 'normal' || value === 'fast';
}

/** Multipliers applied to drop interval and match resolve timings. */
export function gamePaceScale(pace: GamePace): {
  dropInterval: number;
  matchSparkle: number;
  matchPop: number;
  matchChainGap: number;
  spawnAfterMatch: number;
} {
  if (pace === 'fast') {
    return {
      dropInterval: 0.82,
      matchSparkle: 0.55,
      matchPop: 0.55,
      matchChainGap: 0.5,
      spawnAfterMatch: 0.55,
    };
  }
  return {
    dropInterval: 1,
    matchSparkle: 1,
    matchPop: 1,
    matchChainGap: 1,
    spawnAfterMatch: 1,
  };
}
