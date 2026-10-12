import { useMemo, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { BOARD_COLS, BOARD_ROWS } from '../constants/game';
import type { ActivePiece, Board } from '../types/game';
import { cellAt, pieceCells } from '../utils/hexaEngine';
import CandyGem from './CandyGem';

const SWIPE_THRESHOLD = 24;
const TAP_THRESHOLD = 20;

type GestureBoardProps = {
  board: Board;
  piece: ActivePiece | null;
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

  const applySoftDropSteps = (dy: number, dx: number) => {
    if (dy < SWIPE_THRESHOLD || dy <= Math.abs(dx)) {
      return;
    }
    const stepPx = Math.max(20, cellSizeRef.current * 0.5);
    const targetSteps = Math.floor(dy / stepPx);
    while (softDropStepsRef.current < targetSteps) {
      handlersRef.current.onSoftDrop();
      softDropStepsRef.current += 1;
      movedRef.current = true;
    }
  };

  const activeKeys = useMemo(() => {
    if (!piece) {
      return new Set<string>();
    }
    return new Set(pieceCells(piece).map((c) => `${c.row}:${c.col}`));
  }, [piece]);

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
          applySoftDropSteps(gesture.dy, gesture.dx);
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

          applySoftDropSteps(dy, dx);
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
              const kind = cellAt(board, row, col, piece);
              const isActive = activeKeys.has(`${row}:${col}`);

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
                    isActive ? (
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
