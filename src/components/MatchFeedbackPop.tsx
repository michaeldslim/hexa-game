import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { MatchFeedback } from '../types/game';

type MatchFeedbackPopProps = {
  feedback: MatchFeedback | null;
  goodLabel: string;
  rowBonusLabel: string;
  durationMs: number;
};

export default function MatchFeedbackPop({
  feedback,
  goodLabel,
  rowBonusLabel,
  durationMs,
}: MatchFeedbackPopProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (!feedback) {
      return;
    }

    opacity.setValue(0);
    scale.setValue(0.85);
    translateY.setValue(8);

    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: durationMs * 0.15,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: durationMs * 0.2,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -6,
        duration: durationMs * 0.85,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const hold = Animated.sequence([
      anim,
      Animated.timing(opacity, {
        toValue: 0,
        duration: durationMs * 0.25,
        delay: durationMs * 0.55,
        useNativeDriver: true,
      }),
    ]);

    hold.start();
    return () => hold.stop();
  }, [durationMs, feedback, opacity, scale, translateY]);

  if (!feedback) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { opacity, transform: [{ scale }, { translateY }] },
      ]}
    >
      <Text style={styles.good}>{goodLabel}</Text>
      <Text style={styles.score}>+{feedback.score}</Text>
      {feedback.rowBonus ? (
        <View style={styles.bonusBadge}>
          <Text style={styles.bonusText}>{rowBonusLabel}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: '32%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  good: {
    color: '#ffe566',
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: '#0b132b',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  score: {
    color: '#edf2f4',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  bonusBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(255, 209, 102, 0.25)',
    borderWidth: 1,
    borderColor: '#ffd166',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  bonusText: {
    color: '#ffd166',
    fontSize: 12,
    fontWeight: '800',
  },
});
