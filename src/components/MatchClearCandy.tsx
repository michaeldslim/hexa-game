import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { CANDY_FRAME_HEX } from '../constants/candyTheme';
import { MATCH_POP_MS, MATCH_SPARKLE_MS } from '../constants/game';
import type { CandyKind } from '../types/game';
import CandyGem from './CandyGem';

type MatchClearCandyProps = {
  kind: CandyKind;
  size: number;
};

export default function MatchClearCandy({ kind, size }: MatchClearCandyProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.1,
            duration: MATCH_SPARKLE_MS / 6,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(shimmer, {
            toValue: 1,
            duration: MATCH_SPARKLE_MS / 6,
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 1,
            duration: MATCH_SPARKLE_MS / 6,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: MATCH_SPARKLE_MS / 6,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(shimmer, {
            toValue: 0.15,
            duration: MATCH_SPARKLE_MS / 6,
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.55,
            duration: MATCH_SPARKLE_MS / 6,
            useNativeDriver: true,
          }),
        ]),
      ]),
      { iterations: 3 },
    );

    sparkleLoop.start();

    const popTimer = setTimeout(() => {
      sparkleLoop.stop();
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.38,
          duration: MATCH_POP_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: MATCH_POP_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 1,
          duration: MATCH_POP_MS * 0.6,
          useNativeDriver: true,
        }),
      ]).start();
    }, MATCH_SPARKLE_MS);

    return () => {
      clearTimeout(popTimer);
      sparkleLoop.stop();
    };
  }, [glow, opacity, scale, shimmer]);

  const frameColor = CANDY_FRAME_HEX[kind];

  return (
    <Animated.View style={[styles.wrap, { opacity, transform: [{ scale }] }]}>
      <CandyGem kind={kind} size={size} active />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowRing,
          {
            width: size * 1.05,
            height: size * 1.05,
            borderRadius: size * 0.22,
            borderColor: frameColor,
            opacity: glow,
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmer,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: size * 0.2,
            opacity: shimmer,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  shimmer: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
});
