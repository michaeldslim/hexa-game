import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useGameAudio } from '../audio/GameAudioProvider';
import GestureBoard from '../components/GestureBoard';
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

const ANDROID_TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;

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
  const { playSfx, pauseBgm } = useGameAudio();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [promotion, setPromotion] = useState<CareerRank | null>(null);
  const [hudHeight, setHudHeight] = useState(160);
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
    score,
    bestScore,
    level,
    combo,
    gameOver,
    won,
    isResolving,
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
    initialSave,
    onRunEnd: handleRunEnd,
    onPieceLocked: () => playSfx('dropped'),
    onLineMatched: () => playSfx('lineMatched'),
  });

  const handleRestart = useCallback(() => {
    runRecordedRef.current = false;
    restart();
  }, [restart]);

  const cellSize = useMemo(() => {
    const horizontalPad = 24;
    const availableWidth = windowWidth - horizontalPad;
    const availableHeight = Math.max(200, windowHeight - hudHeight - 48);
    const byWidth = Math.floor(availableWidth / BOARD_COLS);
    const byHeight = Math.floor(availableHeight / BOARD_ROWS);
    return Math.max(28, Math.min(byWidth, byHeight, 52));
  }, [hudHeight, windowHeight, windowWidth]);

  const careerBadge = settings.careerModeEnabled
    ? getCareerProgressCopy(strings, careerState).primary
    : null;

  const fourthHud =
    playMode === 'level'
      ? { label: strings.hud.goal, value: `${score}/${goalScore}` }
      : { label: strings.hud.best, value: String(bestScore) };

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

  const gesturesDisabled = gameOver || isResolving;

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
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

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

      <View onLayout={(e) => setHudHeight(e.nativeEvent.layout.height + 44)}>
        {careerBadge ? <Text style={styles.careerBadge}>{careerBadge}</Text> : null}
        <View style={styles.statsRow}>
          <StatCard label={strings.hud.score} value={String(score)} />
          <StatCard label={levelHud.label} value={levelHud.value} />
          <StatCard label={fourthHud.label} value={fourthHud.value} />
          <StatCard label={strings.hud.combo} value={combo > 1 ? `x${combo}` : '-'} />
        </View>
      </View>

      <View style={styles.boardArea}>
        <GestureBoard
          board={board}
          piece={piece}
          cellSize={cellSize}
          disabled={gesturesDisabled}
          onMoveLeft={() => moveHorizontal(-1)}
          onMoveRight={() => moveHorizontal(1)}
          onSoftDrop={softDrop}
          onRotate={rotate}
        />

        {stageClearFlash ? (
          <View style={styles.stageFlash} pointerEvents="none">
            <Text style={styles.stageFlashText}>{strings.stageClear}</Text>
          </View>
        ) : null}

        {combo >= 2 ? (
          <View style={styles.comboPopup} pointerEvents="none">
            <Text style={styles.comboText}>{format(strings.comboPopup, { combo })}</Text>
          </View>
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

      <Text style={styles.gestureHint}>{strings.gestureHint}</Text>

      <PromotionOverlay
        visible={promotion !== null}
        title={promotionCopy?.title ?? ''}
        subtitle={promotionCopy?.subtitle ?? ''}
        isCeo={promotion === 'ceo'}
        playerAvatarId={settings.playerAvatarId}
        onComplete={() => setPromotion(null)}
      />
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0b132b',
    paddingTop: ANDROID_TOP,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  gestureHint: {
    color: '#8d99ae',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    top: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(76, 201, 240, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4cc9f0',
  },
  comboText: {
    color: '#4cc9f0',
    fontWeight: '700',
  },
});
