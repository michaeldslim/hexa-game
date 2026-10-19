import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { COMBO_POPUP_MS } from '../constants/game';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameAudio } from '../audio/GameAudioProvider';
import GestureBoard from '../components/GestureBoard';
import MatchFeedbackPop from '../components/MatchFeedbackPop';
import SideGemSlot from '../components/SideGemSlot';
import HighScoreInitialsModal from '../components/HighScoreInitialsModal';
import HighScoreRecordsModal from '../components/HighScoreRecordsModal';
import PlayerAvatar from '../components/PlayerAvatar';
import PromotionOverlay from '../components/PromotionOverlay';
import { careerRankLabel, getCareerProgressCopy } from '../career/careerLabels';
import { useCareer } from '../career/CareerProvider';
import { BOARD_COLS, BOARD_ROWS, MAX_LEVEL } from '../constants/game';
import { useHexaGame } from '../hooks/useHexaGame';
import { useI18n } from '../i18n/I18nContext';
import { useSettings } from '../settings/SettingsProvider';
import type { CareerRank } from '../types/career';
import type { SavedGameSnapshot } from '../types/game';

type GameScreenProps = {
  initialSave?: SavedGameSnapshot | null;
  onOpenSettings: () => void;
  onPauseToIntro: (snapshot: SavedGameSnapshot) => void;
};

export default function GameScreen({
  initialSave = null,
  onOpenSettings,
  onPauseToIntro,
}: GameScreenProps) {
  const { strings, format } = useI18n();
  const { settings } = useSettings();
  const { careerState, recordRunResult } = useCareer();
  const { playSfx, pauseBgm, resumeBgm } = useGameAudio();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [promotion, setPromotion] = useState<CareerRank | null>(null);
  const [recordsModalOpen, setRecordsModalOpen] = useState(false);
  const [comboDisplay, setComboDisplay] = useState<number | null>(null);
  const comboAnim = useRef(new Animated.Value(0)).current;
  const [headerHeight, setHeaderHeight] = useState(180);
  const [footerHeight, setFooterHeight] = useState(40);
  const runRecordedRef = useRef(false);

  const handleRunEnd = useCallback(
    (payload: { won: boolean; score: number; level: number }) => {
      if (runRecordedRef.current) {
        return;
      }
      runRecordedRef.current = true;

      if (!payload.won) {
        playSfx('gameOver');
        recordRunResult({ won: false });
        return;
      }

      const result = recordRunResult({
        won: true,
        completedLevel: payload.level,
      });

      if (result?.promoted) {
        setPromotion(result.promoted);
      }
    },
    [playSfx, recordRunResult],
  );

  const {
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
    matchedKeys,
    stageClearFlash,
    goalScore,
    playMode,
    moveHorizontal,
    softDrop,
    rotate,
    restart,
    exportSnapshot,
  } = useHexaGame({
    playMode: initialSave?.playMode ?? settings.playMode,
    gamePace: settings.gamePace,
    initialSave,
    paused: recordsModalOpen,
    onRunEnd: handleRunEnd,
    onPieceLocked: () => playSfx('dropped'),
    onLineMatched: () => playSfx('lineMatched'),
  });

  useEffect(() => {
    if (comboFlashTick === 0 || combo < 2) {
      return;
    }

    setComboDisplay(combo);
    comboAnim.setValue(0);
    const anim = Animated.timing(comboAnim, {
      toValue: 1,
      duration: COMBO_POPUP_MS,
      easing: Easing.bezier(0.2, 0.85, 0.35, 1),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) {
        setComboDisplay(null);
      }
    });
    return () => {
      anim.stop();
    };
  }, [combo, comboAnim, comboFlashTick]);

  const comboScale = comboAnim.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0.45, 1.15, 1, 0.85],
  });
  const comboOpacity = comboAnim.interpolate({
    inputRange: [0, 0.08, 0.82, 1],
    outputRange: [0, 1, 1, 0],
  });
  const comboTranslateY = comboAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });

  const handleRestart = useCallback(() => {
    if (pendingHighScore !== null) {
      return;
    }
    runRecordedRef.current = false;
    restart();
    resumeBgm();
  }, [pendingHighScore, restart, resumeBgm]);

  const bestHudValue = useMemo(() => {
    if (bestRecord.initials && score <= bestRecord.score) {
      return `${bestRecord.initials} ${bestRecord.score}`;
    }
    return String(bestScore);
  }, [bestRecord.initials, bestRecord.score, bestScore, score]);

  const sideSlotWidth = 64;

  const cellSize = useMemo(() => {
    const horizontalPad = 16;
    const verticalPad = insets.top + insets.bottom + headerHeight + footerHeight + 16;
    const availableWidth = windowWidth - horizontalPad - sideSlotWidth * 2;
    const availableHeight = Math.max(120, windowHeight - verticalPad);
    const byWidth = Math.floor(availableWidth / BOARD_COLS);
    const byHeight = Math.floor(availableHeight / BOARD_ROWS);
    return Math.max(24, Math.min(byWidth, byHeight, 56));
  }, [footerHeight, headerHeight, insets.bottom, insets.top, windowHeight, windowWidth]);

  const sideGemSize = Math.max(20, Math.min(28, cellSize * 0.42));

  const careerBadge = settings.careerModeEnabled
    ? getCareerProgressCopy(strings, careerState).primary
    : null;

  const collectHud =
    collectGoal && playMode === 'level'
      ? `${collectProgress[collectGoal.kind] ?? 0}/${collectGoal.required} ${collectGoal.kind}`
      : null;

  const thirdHud =
    playMode === 'level'
      ? { label: strings.hud.goal, value: `${score}/${goalScore}` }
      : { label: strings.hud.best, value: bestHudValue };

  const recordsHudValue = bestRecord.initials || '—';

  const levelHud =
    playMode === 'level'
      ? { label: strings.hud.level, value: `${level}/${MAX_LEVEL}` }
      : { label: strings.hud.difficulty, value: `${level}` };

  const promotionCopy = promotion
    ? promotion === 'ceo'
      ? strings.career.ceoReached
      : {
          title: strings.career.promoted.title,
          subtitle: format(strings.career.promoted.subtitle, {
            rank: careerRankLabel(strings, promotion),
          }),
        }
    : null;

  const gesturesDisabled = gameOver || isResolving || recordsModalOpen;

  const handleOpenRecords = useCallback(() => {
    if (settings.careerModeEnabled || isResolving || pendingHighScore !== null) {
      return;
    }
    setRecordsModalOpen(true);
    if (!gameOver) {
      pauseBgm();
    }
  }, [gameOver, isResolving, pauseBgm, pendingHighScore, settings.careerModeEnabled]);

  const handleCloseRecords = useCallback(() => {
    setRecordsModalOpen(false);
    if (!gameOver) {
      resumeBgm();
    }
  }, [gameOver, resumeBgm]);

  const handlePause = useCallback(() => {
    if (gameOver || isResolving) {
      return;
    }
    pauseBgm();
    const snapshot = exportSnapshot();
    if (snapshot) {
      onPauseToIntro(snapshot);
    }
  }, [exportSnapshot, gameOver, isResolving, onPauseToIntro, pauseBgm]);

  return (
    <View
      style={[
        styles.safe,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar style="light" />

      <View
        style={styles.header}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <View style={styles.topBar}>
          <View style={styles.titleRow}>
            <PlayerAvatar avatarId={settings.playerAvatarId} size="sm" />
            <Text style={styles.appTitle}>{strings.app.title}</Text>
          </View>
          <View style={styles.topActions}>
            <Pressable onPress={onOpenSettings} style={styles.gearButton}>
              <Text style={styles.gearText}>⚙</Text>
            </Pressable>
            <Pressable
              onPress={handlePause}
              disabled={gameOver}
              style={[styles.pauseButton, gameOver && styles.topActionDisabled]}
            >
              <Text style={[styles.pauseText, gameOver && styles.pauseTextDisabled]}>
                {strings.hud.pause}
              </Text>
            </Pressable>
          </View>
        </View>

        {careerBadge ? <Text style={styles.careerBadge}>{careerBadge}</Text> : null}
        {collectHud ? (
          <Text style={styles.collectBadge}>
            {strings.hud.collect}: {collectHud}
          </Text>
        ) : null}
        <View style={styles.statsRow}>
          <StatCard label={strings.hud.score} value={String(score)} />
          <StatCard label={levelHud.label} value={levelHud.value} />
          <StatCard label={thirdHud.label} value={thirdHud.value} />
          {settings.careerModeEnabled ? (
            <StatCard
              label={strings.hud.combo}
              value={combo > 1 ? `x${combo}` : '-'}
            />
          ) : (
            <StatCard
              label={strings.hud.records}
              value={recordsHudValue}
              onPress={handleOpenRecords}
              valueStyle={styles.recordsInitials}
              disabled={isResolving || pendingHighScore !== null}
            />
          )}
        </View>
      </View>

      <View style={styles.boardArea}>
        <View style={styles.boardRow}>
          <SideGemSlot
            label={strings.hud.hold}
            gems={heldGems}
            gemSize={sideGemSize}
            onPress={swapHold}
            pressEnabled={holdEnabled}
          />
          <GestureBoard
            board={board}
            piece={piece}
            matchedKeys={matchedKeys}
            cellSize={cellSize}
            boardThemeId={settings.boardTheme}
            disabled={gesturesDisabled}
            onMoveLeft={() => moveHorizontal(-1)}
            onMoveRight={() => moveHorizontal(1)}
            onSoftDrop={softDrop}
            onRotate={rotate}
          />
          <SideGemSlot label={strings.hud.next} gems={nextGems} gemSize={sideGemSize} />
        </View>

        {stageClearFlash ? (
          <View style={styles.stageFlash} pointerEvents="none">
            <Text style={styles.stageFlashText}>{strings.stageClear}</Text>
          </View>
        ) : null}

        <MatchFeedbackPop
          feedback={matchFeedback}
          goodLabel={strings.matchFeedback.good}
          rowBonusLabel={strings.matchFeedback.rowBonus}
          durationMs={900}
        />

        {comboDisplay !== null ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.comboPopup,
              {
                opacity: comboOpacity,
                transform: [{ scale: comboScale }, { translateY: comboTranslateY }],
              },
            ]}
          >
            <Text style={styles.comboText}>{format(strings.comboPopup, { combo: comboDisplay })}</Text>
          </Animated.View>
        ) : null}

        {gameOver ? (
          <Pressable style={styles.gameOverOverlay} onPress={handleRestart}>
            <View style={styles.gameOverCard}>
              <Text style={styles.gameOverTitle}>
                {won ? strings.gameOver.titleWin : strings.gameOver.titleLose}
              </Text>
              <Text style={styles.gameOverBody}>
                {won ? strings.gameOver.winBody : strings.gameOver.loseBody}
              </Text>
              <Text style={styles.gameOverHint}>{strings.gameOver.tapRestart}</Text>
            </View>
          </Pressable>
        ) : null}
      </View>

      <Text
        style={styles.gestureHint}
        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
      >
        {strings.gestureHint}
      </Text>

      <HighScoreInitialsModal
        visible={pendingHighScore !== null}
        score={pendingHighScore ?? 0}
        onSubmit={submitBestInitials}
      />

      <HighScoreRecordsModal
        visible={recordsModalOpen}
        records={scoreRecords}
        onClose={handleCloseRecords}
      />

      <PromotionOverlay
        visible={promotion !== null}
        title={promotionCopy?.title ?? ''}
        subtitle={promotionCopy?.subtitle ?? ''}
        isCeo={promotion === 'ceo'}
        playerAvatarId={settings.playerAvatarId}
        onComplete={() => setPromotion(null)}
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  onPress,
  valueStyle,
  disabled = false,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  valueStyle?: object;
  disabled?: boolean;
}) {
  const content = (
    <>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
    </>
  );

  if (!onPress) {
    return <View style={styles.statCard}>{content}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.statCard,
        styles.statCardPressable,
        disabled && styles.statCardDisabled,
        pressed && !disabled && styles.statCardPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0b132b',
  },
  header: {
    zIndex: 2,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appTitle: {
    color: '#edf2f4',
    fontSize: 24,
    fontWeight: '800',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginRight: -4,
  },
  pauseButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1b263b',
    borderWidth: 1,
    borderColor: '#415a77',
  },
  pauseText: {
    color: '#edf2f4',
    fontSize: 13,
    fontWeight: '700',
  },
  pauseTextDisabled: {
    color: '#8d99ae',
  },
  topActionDisabled: {
    opacity: 0.55,
    borderColor: '#2a3649',
  },
  gearButton: {
    padding: 8,
  },
  gearText: {
    fontSize: 22,
  },
  careerBadge: {
    color: '#8d99ae',
    fontSize: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  collectBadge: {
    color: '#ffd166',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1b263b',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statCardPressable: {
    borderWidth: 1,
    borderColor: '#415a77',
  },
  statCardPressed: {
    opacity: 0.85,
    backgroundColor: '#243047',
  },
  statCardDisabled: {
    opacity: 0.55,
  },
  recordsInitials: {
    letterSpacing: 4,
    fontSize: 17,
  },
  statLabel: {
    color: '#8d99ae',
    fontSize: 11,
  },
  statValue: {
    color: '#ffd166',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  boardArea: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  gestureHint: {
    color: '#8d99ae',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  gameOverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverCard: {
    backgroundColor: '#1b263b',
    borderRadius: 14,
    padding: 22,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: '#415a77',
  },
  gameOverTitle: {
    color: '#ffd166',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  gameOverBody: {
    color: '#edf2f4',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  gameOverHint: {
    color: '#8d99ae',
    marginTop: 14,
    textAlign: 'center',
    fontSize: 13,
  },
  stageFlash: {
    position: 'absolute',
    top: '40%',
    backgroundColor: 'rgba(255, 209, 102, 0.92)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stageFlashText: {
    color: '#1b263b',
    fontWeight: '800',
    fontSize: 18,
  },
  comboPopup: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  comboText: {
    color: '#ffd166',
    fontWeight: '900',
    fontSize: 30,
    textShadowColor: '#0b132b',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
