import { useMemo, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { BOARD_COLS, BOARD_ROWS } from '../constants/game';
import type { ActivePiece, Board } from '../types/game';
import { cellAt, pieceCells } from '../utils/hexaEngine';
import CandyGem from './CandyGem';
import MatchClearCandy from './MatchClearCandy';

const SWIPE_THRESHOLD = 24;
const TAP_THRESHOLD = 20;
/** Finger travel per one soft-drop step (~1.3 grid cells). */
const SOFT_DROP_STEP_CELL_RATIO = 1.35;
const SOFT_DROP_MAX_STEPS = 5;

type GestureBoardProps = {
  board: Board;
  piece: ActivePiece | null;
  matchedKeys: string[];
  cellSize: number;
  disabled: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSoftDrop: () => void;
  onRotate: () => void;
};

export default function GestureBoard({
  board,
  piece,
  matchedKeys,
  cellSize,
  disabled,
  onMoveLeft,
  onMoveRight,
  onSoftDrop,
  onRotate,
}: GestureBoardProps) {
  const movedRef = useRef(false);
  const softDropStepsRef = useRef(0);
  const pieceRef = useRef(piece);
  const disabledRef = useRef(disabled);
  const cellSizeRef = useRef(cellSize);
  const handlersRef = useRef({ onMoveLeft, onMoveRight, onSoftDrop, onRotate });

  pieceRef.current = piece;
  disabledRef.current = disabled;
  cellSizeRef.current = cellSize;
  handlersRef.current = { onMoveLeft, onMoveRight, onSoftDrop, onRotate };

  const trySoftDropAlongSwipe = (dy: number, dx: number, maxNewSteps: number) => {
    if (dy < SWIPE_THRESHOLD || dy <= Math.abs(dx) || maxNewSteps <= 0) {
      return;
    }
    const stepPx = Math.max(32, cellSizeRef.current * SOFT_DROP_STEP_CELL_RATIO);
    const targetSteps = Math.min(SOFT_DROP_MAX_STEPS, Math.floor(dy / stepPx));
    let added = 0;
    while (softDropStepsRef.current < targetSteps && added < maxNewSteps) {
      handlersRef.current.onSoftDrop();
      softDropStepsRef.current += 1;
      added += 1;
      movedRef.current = true;
    }
  };

  const activeKeys = useMemo(() => {
    if (!piece) {
      return new Set<string>();
    }
    return new Set(pieceCells(piece).map((c) => `${c.row}:${c.col}`));
  }, [piece]);

  const matchedKeySet = useMemo(() => new Set(matchedKeys), [matchedKeys]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabledRef.current,
        onMoveShouldSetPanResponder: (_, gesture) =>
          !disabledRef.current &&
          (Math.abs(gesture.dx) > TAP_THRESHOLD || Math.abs(gesture.dy) > TAP_THRESHOLD),
        onPanResponderGrant: () => {
          movedRef.current = false;
          softDropStepsRef.current = 0;
        },
        onPanResponderMove: (_, gesture) => {
          if (disabledRef.current) {
            return;
          }
          if (Math.abs(gesture.dx) > TAP_THRESHOLD || Math.abs(gesture.dy) > TAP_THRESHOLD) {
            movedRef.current = true;
          }
          trySoftDropAlongSwipe(gesture.dy, gesture.dx, 1);
        },
        onPanResponderRelease: (_, gesture) => {
          if (disabledRef.current) {
            return;
          }

          const { dx, dy } = gesture;
          const isTap = !movedRef.current && Math.abs(dx) < TAP_THRESHOLD && Math.abs(dy) < TAP_THRESHOLD;

          if (isTap) {
            return;
          }

          if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) >= SWIPE_THRESHOLD) {
            if (dx < 0) {
              handlersRef.current.onMoveLeft();
            } else {
              handlersRef.current.onMoveRight();
            }
            return;
          }

          trySoftDropAlongSwipe(dy, dx, SOFT_DROP_MAX_STEPS);
        },
      }),
    [],
  );

  const gridWidth = BOARD_COLS * cellSize;
  const gridHeight = BOARD_ROWS * cellSize;

  const handleRotatePress = () => {
    if (!disabledRef.current) {
      handlersRef.current.onRotate();
    }
  };

  return (
    <View
      style={[styles.wrap, { width: gridWidth, height: gridHeight }]}
      {...panResponder.panHandlers}
    >
      <View
        style={[styles.grid, { width: gridWidth, height: gridHeight }]}
        pointerEvents="box-none"
      >
        {Array.from({ length: BOARD_ROWS }, (_, row) => (
          <View key={`r-${row}`} style={styles.gridRow} pointerEvents="box-none">
            {Array.from({ length: BOARD_COLS }, (_, col) => {
              const cellKey = `${row}:${col}`;
              const kind = cellAt(board, row, col, piece);
              const isActive = activeKeys.has(cellKey);
              const isMatching = matchedKeySet.has(cellKey);

              return (
                <View
                  key={`c-${row}-${col}`}
                  style={[
                    styles.cell,
                    {
                      width: cellSize,
                      height: cellSize,
                    },
                  ]}
                  pointerEvents="box-none"
                >
                  {kind ? (
                    isMatching ? (
                      <MatchClearCandy kind={kind} size={cellSize * 0.94} />
                    ) : isActive ? (
                      <Pressable
                        onPress={handleRotatePress}
                        disabled={disabled}
                        hitSlop={6}
                        style={styles.gemPressable}
                      >
                        <CandyGem kind={kind} size={cellSize * 0.94} active />
                      </Pressable>
                    ) : (
                      <CandyGem kind={kind} size={cellSize * 0.94} />
                    )
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  grid: {
    borderWidth: 2,
    borderColor: '#415a77',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    backgroundColor: '#25344a',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gemPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
