import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MATCH_CHAIN_GAP_MS,
  MATCH_POP_MS,
  MATCH_SPARKLE_MS,
  MAX_LEVEL,
  SPAWN_AFTER_MATCH_MS,
  dropIntervalMs,
  isRunWon,
  levelCollectGoal,
  levelGoalScore,
} from '../constants/game';
import { gamePaceScale, type GamePace } from '../constants/gamePace';
import { loadBestScoreRecord, saveBestScoreRecord, type BestScoreRecord } from '../game/bestScoreStorage';
import {
  appendScoreRecord,
  loadScoreRecords,
  type ScoreRecordEntry,
} from '../game/scoreRecordsStorage';
import { clearGameSave } from '../game/gameSaveStorage';
import type {
  ActivePiece,
  Board,
  CandyKind,
  MatchFeedback,
  PlayMode,
  SavedGameSnapshot,
  Triplet,
} from '../types/game';
import {
  applyGravity,
  boardAfterLockSettle,
  clearMatches,
  createEmptyBoard,
  defaultSpawn,
  lockPiece,
  resolveBoardWithSteps,
  rollTriplet,
  tryMoveDown,
  tryMoveHorizontal,
  tryRotate,
} from '../utils/hexaEngine';

export interface UseHexaGameOptions {
  playMode: PlayMode;
  gamePace?: GamePace;
  initialSave?: SavedGameSnapshot | null;
  paused?: boolean;
  onRunEnd?: (payload: { won: boolean; score: number; level: number }) => void;
  onPieceLocked?: () => void;
  onLineMatched?: () => void;
}

export interface HexaGameState {
  board: Board;
  piece: ActivePiece | null;
  nextGems: Triplet;
  score: number;
  bestScore: number;
  level: number;
  combo: number;
  gameOver: boolean;
  won: boolean;
  isResolving: boolean;
  stageClearFlash: boolean;
  matchedKeys: string[];
}

function levelFromScore(score: number): number {
  let level = 1;
  for (let step = 1; step < MAX_LEVEL; step += 1) {
    if (score >= levelGoalScore(step)) {
      level = step + 1;
    } else {
      break;
    }
  }
  return level;
}

export function useHexaGame({
  playMode,
  gamePace = 'normal',
  initialSave = null,
  paused = false,
  onRunEnd,
  onPieceLocked,
  onLineMatched,
}: UseHexaGameOptions) {
  const [board, setBoard] = useState<Board>(() => initialSave?.board ?? createEmptyBoard());
  const [piece, setPiece] = useState<ActivePiece | null>(() => initialSave?.piece ?? null);
  const [nextGems, setNextGems] = useState<Triplet>(() => initialSave?.nextGems ?? rollTriplet(1));
  const [score, setScore] = useState(() => initialSave?.score ?? 0);
  const [bestRecord, setBestRecord] = useState<BestScoreRecord>({ score: 0, initials: '' });
  const [pendingHighScore, setPendingHighScore] = useState<number | null>(null);
  const [scoreRecords, setScoreRecords] = useState<ScoreRecordEntry[]>([]);
  const bestRecordRef = useRef(bestRecord);
  const pausedRef = useRef(paused);
  const [level, setLevel] = useState(() => initialSave?.level ?? 1);
  const [combo, setCombo] = useState(() => initialSave?.combo ?? 0);
  /** Bumps when cascade combo (x2+) should flash on the board. */
  const [comboFlashTick, setComboFlashTick] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [stageClearFlash, setStageClearFlash] = useState(false);
  const [matchedKeys, setMatchedKeys] = useState<string[]>([]);
  const [heldGems, setHeldGems] = useState<Triplet | null>(() => initialSave?.heldGems ?? null);
  const [collectProgress, setCollectProgress] = useState<Partial<Record<CandyKind, number>>>(
    () => initialSave?.collectProgress ?? {},
  );
  const [matchFeedback, setMatchFeedback] = useState<MatchFeedback | null>(null);

  const boardRef = useRef(board);
  const pieceRef = useRef(piece);
  const nextGemsRef = useRef(nextGems);
  const scoreRef = useRef(score);
  const levelRef = useRef(level);
  const comboRef = useRef(combo);
  const gameOverRef = useRef(gameOver);
  const isResolvingRef = useRef(isResolving);
  const playModeRef = useRef(playMode);
  const gamePaceRef = useRef(gamePace);
  const heldGemsRef = useRef(heldGems);
  const [holdUsed, setHoldUsed] = useState(() => initialSave?.holdUsed ?? false);
  const holdUsedRef = useRef(holdUsed);
  const matchFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  boardRef.current = board;
  pieceRef.current = piece;
  nextGemsRef.current = nextGems;
  scoreRef.current = score;
  levelRef.current = level;
  comboRef.current = combo;
  gameOverRef.current = gameOver;
  isResolvingRef.current = isResolving;
  playModeRef.current = playMode;
  gamePaceRef.current = gamePace;
  heldGemsRef.current = heldGems;
  holdUsedRef.current = holdUsed;
  bestRecordRef.current = bestRecord;
  pausedRef.current = paused;

  const paceScale = useCallback(() => gamePaceScale(gamePaceRef.current), []);

  useEffect(() => {
    void loadBestScoreRecord().then((record) => {
      setBestRecord(record);
      bestRecordRef.current = record;
    });
    void loadScoreRecords().then(setScoreRecords);
  }, []);

  const queueHighScoreIfNeeded = useCallback((finalScore: number) => {
    if (finalScore > bestRecordRef.current.score) {
      setPendingHighScore(finalScore);
    }
  }, []);

  const submitBestInitials = useCallback((initials: string) => {
    setPendingHighScore((pending) => {
      if (pending === null) {
        return null;
      }
      const next: BestScoreRecord = { score: pending, initials };
      setBestRecord(next);
      bestRecordRef.current = next;
      void saveBestScoreRecord(next);
      void appendScoreRecord({ score: pending, initials }).then(setScoreRecords);
      return null;
    });
  }, []);

  const applyScore = useCallback(
    (delta: number) => {
      setScore((prev) => {
        const nextScore = prev + delta;
        const prevLevel = levelRef.current;
        const nextLevel = levelFromScore(nextScore);
        if (nextLevel > prevLevel) {
          levelRef.current = nextLevel;
          setLevel(nextLevel);
          setStageClearFlash(true);
          setTimeout(() => setStageClearFlash(false), 900);
        }
        if (isRunWon(playModeRef.current, nextLevel, nextScore)) {
          gameOverRef.current = true;
          setWon(true);
          setGameOver(true);
          void clearGameSave();
          queueHighScoreIfNeeded(nextScore);
          onRunEnd?.({ won: true, score: nextScore, level: nextLevel });
        }
        return nextScore;
      });
    },
    [onRunEnd, queueHighScoreIfNeeded],
  );

  const spawnPiece = useCallback((currentBoard: Board, gems: Triplet): ActivePiece | null => {
    return defaultSpawn(currentBoard, gems);
  }, []);

  const afterLock = useCallback(
    (currentBoard: Board, lockedPiece: ActivePiece) => {
      onPieceLocked?.();
      isResolvingRef.current = true;
      setIsResolving(true);
      setPiece(null);
      pieceRef.current = null;

      const locked = lockPiece(currentBoard, lockedPiece);
      const { steps, finalBoard, totalScore } = resolveBoardWithSteps(locked);
      const scale = paceScale();
      const matchClearMs = Math.round(
        (MATCH_SPARKLE_MS + MATCH_POP_MS) * scale.matchSparkle,
      );
      const chainGapMs = Math.round(MATCH_CHAIN_GAP_MS * scale.matchChainGap);
      const spawnDelayMs = Math.round(SPAWN_AFTER_MATCH_MS * scale.spawnAfterMatch);

      const addCollectFromKinds = (kinds: CandyKind[]) => {
        if (playModeRef.current !== 'level' || kinds.length === 0) {
          return;
        }
        setCollectProgress((prev) => {
          const next = { ...prev };
          kinds.forEach((kind) => {
            next[kind] = (next[kind] ?? 0) + 1;
          });
          return next;
        });
      };

      const showMatchFeedback = (scoreGain: number, rowBonus: boolean) => {
        if (matchFeedbackTimerRef.current) {
          clearTimeout(matchFeedbackTimerRef.current);
        }
        const id = Date.now();
        setMatchFeedback({ id, score: scoreGain, rowBonus });
        matchFeedbackTimerRef.current = setTimeout(() => {
          setMatchFeedback(null);
          matchFeedbackTimerRef.current = null;
        }, 900);
      };

      const spawnNextPiece = (settledBoard: Board) => {
        const boardForSpawn = boardAfterLockSettle(settledBoard, levelRef.current);
        if (boardForSpawn !== settledBoard) {
          setBoard(boardForSpawn);
          boardRef.current = boardForSpawn;
        }

        setTimeout(() => {
          const spawnBoard = boardRef.current;
          const incoming = nextGemsRef.current;
          const upcoming = rollTriplet(levelRef.current);
          setNextGems(upcoming);
          nextGemsRef.current = upcoming;

          const spawned = spawnPiece(spawnBoard, incoming);
          if (!spawned) {
            gameOverRef.current = true;
            setGameOver(true);
            setWon(false);
            setPiece(null);
            pieceRef.current = null;
            isResolvingRef.current = false;
            setIsResolving(false);
            void clearGameSave();
            queueHighScoreIfNeeded(scoreRef.current);
            onRunEnd?.({
              won: false,
              score: scoreRef.current,
              level: levelRef.current,
            });
            return;
          }

          setPiece(spawned);
          pieceRef.current = spawned;
          holdUsedRef.current = false;
          setHoldUsed(false);
          isResolvingRef.current = false;
          setIsResolving(false);
        }, spawnDelayMs);
      };

      const finishResolution = (settledBoard: Board) => {
        setMatchedKeys([]);
        setBoard(settledBoard);
        boardRef.current = settledBoard;

        if (totalScore > 0) {
          applyScore(totalScore);
        }

        spawnNextPiece(settledBoard);
      };

      if (steps.length === 0) {
        setBoard(locked);
        boardRef.current = locked;
        setCombo(0);
        spawnNextPiece(locked);
        return;
      }

      onLineMatched?.();
      setCombo(0);

      let stepIndex = 0;
      const runStep = () => {
        if (stepIndex >= steps.length) {
          finishResolution(finalBoard);
          return;
        }

        const cascade = stepIndex + 1;
        if (cascade >= 2) {
          setCombo(cascade);
          setComboFlashTick((t) => t + 1);
        }

        const step = steps[stepIndex];
        if (stepIndex === 0) {
          showMatchFeedback(step.scoreGain, step.hadRowBonus);
        }
        addCollectFromKinds(step.clearedKinds);

        setBoard(step.boardBeforeClear);
        boardRef.current = step.boardBeforeClear;
        setMatchedKeys(step.matchedKeys);

        setTimeout(() => {
          setMatchedKeys([]);
          const afterStep = applyGravity(
            clearMatches(step.boardBeforeClear, new Set(step.matchedKeys)),
          );
          setBoard(afterStep);
          boardRef.current = afterStep;
          stepIndex += 1;
          setTimeout(runStep, chainGapMs);
        }, matchClearMs);
      };

      runStep();
    },
    [applyScore, onLineMatched, onPieceLocked, onRunEnd, paceScale, queueHighScoreIfNeeded, spawnPiece],
  );

  const applySnapshot = useCallback((snapshot: SavedGameSnapshot) => {
    boardRef.current = snapshot.board;
    pieceRef.current = snapshot.piece;
    nextGemsRef.current = snapshot.nextGems;
    levelRef.current = snapshot.level;
    gameOverRef.current = false;
    isResolvingRef.current = false;
    scoreRef.current = snapshot.score;
    comboRef.current = snapshot.combo;

    setBoard(snapshot.board);
    setPiece(snapshot.piece);
    setNextGems(snapshot.nextGems);
    setScore(snapshot.score);
    setLevel(snapshot.level);
    setCombo(snapshot.combo);
    setGameOver(false);
    setWon(false);
    setIsResolving(false);
    setStageClearFlash(false);
    setMatchedKeys([]);
    setHeldGems(snapshot.heldGems ?? null);
    heldGemsRef.current = snapshot.heldGems ?? null;
    const savedHoldUsed = snapshot.holdUsed ?? false;
    holdUsedRef.current = savedHoldUsed;
    setHoldUsed(savedHoldUsed);
    setCollectProgress(snapshot.collectProgress ?? {});
  }, []);

  const restart = useCallback(() => {
    const empty = createEmptyBoard();
    const firstNext = rollTriplet(1);
    const firstGems = rollTriplet(1);
    const spawned = defaultSpawn(empty, firstGems);

    boardRef.current = empty;
    pieceRef.current = spawned;
    nextGemsRef.current = firstNext;
    levelRef.current = 1;
    gameOverRef.current = false;
    isResolvingRef.current = false;
    scoreRef.current = 0;
    comboRef.current = 0;

    setBoard(empty);
    setPiece(spawned);
    setNextGems(firstNext);
    setScore(0);
    setLevel(1);
    setCombo(0);
    setComboFlashTick(0);
    setGameOver(false);
    setWon(false);
    setIsResolving(false);
    setStageClearFlash(false);
    setMatchedKeys([]);
    setPendingHighScore(null);
    setHeldGems(null);
    heldGemsRef.current = null;
    holdUsedRef.current = false;
    setHoldUsed(false);
    setCollectProgress({});
    setMatchFeedback(null);

    void clearGameSave();

    if (!spawned) {
      setGameOver(true);
    }
  }, []);

  const skipPlayModeRestartRef = useRef(!!initialSave);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) {
      return;
    }
    mountedRef.current = true;
    if (initialSave) {
      applySnapshot(initialSave);
    } else {
      restart();
    }
  }, [applySnapshot, initialSave, restart]);

  useEffect(() => {
    if (skipPlayModeRestartRef.current) {
      skipPlayModeRestartRef.current = false;
      return;
    }
    restart();
  }, [playMode, restart]);

  const exportSnapshot = useCallback((): SavedGameSnapshot | null => {
    if (gameOverRef.current) {
      return null;
    }
    return {
      version: 2,
      playMode: playModeRef.current,
      board: boardRef.current,
      piece: pieceRef.current,
      nextGems: nextGemsRef.current,
      score: scoreRef.current,
      level: levelRef.current,
      combo: comboRef.current,
      savedAt: Date.now(),
      heldGems: heldGemsRef.current,
      holdUsed: holdUsedRef.current,
      collectProgress: collectProgress,
    };
  }, [collectProgress]);

  const lockCurrentPiece = useCallback(() => {
    const currentBoard = boardRef.current;
    const currentPiece = pieceRef.current;
    if (!currentPiece || isResolvingRef.current || gameOverRef.current) {
      return;
    }
    afterLock(currentBoard, currentPiece);
    setPiece(null);
    pieceRef.current = null;
  }, [afterLock]);

  const tickDown = useCallback(() => {
    if (pausedRef.current || isResolvingRef.current || gameOverRef.current) {
      return;
    }
    const currentBoard = boardRef.current;
    const currentPiece = pieceRef.current;
    if (!currentPiece) {
      return;
    }

    const moved = tryMoveDown(currentBoard, currentPiece);
    if (moved === 'locked') {
      lockCurrentPiece();
      return;
    }
    setPiece(moved);
    pieceRef.current = moved;
  }, [lockCurrentPiece]);

  useEffect(() => {
    const scale = gamePaceScale(gamePace);
    const id = setInterval(() => {
      tickDown();
    }, Math.round(dropIntervalMs(levelRef.current) * scale.dropInterval));

    return () => clearInterval(id);
  }, [gamePace, level, tickDown]);

  const moveHorizontal = useCallback((delta: number) => {
    if (pausedRef.current || isResolvingRef.current || gameOverRef.current) {
      return;
    }
    const currentBoard = boardRef.current;
    const currentPiece = pieceRef.current;
    if (!currentPiece) {
      return;
    }
    const moved = tryMoveHorizontal(currentBoard, currentPiece, delta);
    if (moved) {
      setPiece(moved);
      pieceRef.current = moved;
    }
  }, []);

  const softDrop = useCallback(() => {
    tickDown();
  }, [tickDown]);

  const rotate = useCallback(() => {
    if (pausedRef.current || isResolvingRef.current || gameOverRef.current) {
      return;
    }
    const currentBoard = boardRef.current;
    const currentPiece = pieceRef.current;
    if (!currentPiece) {
      return;
    }
    const rotated = tryRotate(currentBoard, currentPiece);
    setPiece(rotated);
    pieceRef.current = rotated;
  }, []);

  const swapHold = useCallback(() => {
    if (
      holdUsedRef.current ||
      pausedRef.current ||
      isResolvingRef.current ||
      gameOverRef.current
    ) {
      return;
    }
    const currentPiece = pieceRef.current;
    if (!currentPiece) {
      return;
    }

    holdUsedRef.current = true;
    setHoldUsed(true);

    if (!heldGemsRef.current) {
      const stored = currentPiece.gems;
      const incoming = nextGemsRef.current;
      const upcoming = rollTriplet(levelRef.current);
      const nextPiece: ActivePiece = { ...currentPiece, gems: incoming };

      heldGemsRef.current = stored;
      setHeldGems(stored);
      nextGemsRef.current = upcoming;
      setNextGems(upcoming);
      pieceRef.current = nextPiece;
      setPiece(nextPiece);
      return;
    }

    const swapGems = heldGemsRef.current;
    heldGemsRef.current = currentPiece.gems;
    setHeldGems(currentPiece.gems);
    const swappedPiece: ActivePiece = { ...currentPiece, gems: swapGems };
    pieceRef.current = swappedPiece;
    setPiece(swappedPiece);
  }, []);

  const goalScore =
    playMode === 'level' ? levelGoalScore(Math.min(level, MAX_LEVEL)) : 0;

  const collectGoal =
    playMode === 'level' ? levelCollectGoal(Math.min(level, MAX_LEVEL)) : null;

  const holdEnabled = !gameOver && !isResolving && !paused && piece !== null && !holdUsed;

  const bestScore = Math.max(bestRecord.score, score);

  return {
    board,
    piece,
    nextGems,
    heldGems,
    holdEnabled,
    swapHold,
    matchFeedback,
    collectProgress,
    collectGoal,
    score,
    bestScore,
    bestRecord,
    scoreRecords,
    pendingHighScore,
    submitBestInitials,
    level,
    combo,
    comboFlashTick,
    gameOver,
    won,
    isResolving,
    stageClearFlash,
    matchedKeys,
    goalScore,
    playMode,
    moveHorizontal,
    softDrop,
    rotate,
    restart,
    exportSnapshot,
  };
}
