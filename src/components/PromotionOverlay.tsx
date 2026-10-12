import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { AvatarId } from '../constants/avatars';
import PlayerAvatar from './PlayerAvatar';

interface PromotionOverlayProps {
  visible: boolean;
  title: string;
  subtitle: string;
  isCeo: boolean;
  playerAvatarId: AvatarId;
  onComplete: () => void;
}

const DISPLAY_MS = 1200;
const CEO_DISPLAY_MS = 1800;
const FADE_MS = 400;

export default function PromotionOverlay({
  visible,
  title,
  subtitle,
  isCeo,
  playerAvatarId,
  onComplete,
}: PromotionOverlayProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.45)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    const displayMs = isCeo ? CEO_DISPLAY_MS : DISPLAY_MS;

    backdropOpacity.setValue(0);
    bannerScale.setValue(0.45);
    bannerOpacity.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(backdropOpacity, {
          toValue: 0.62,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: FADE_MS,
          easing: Easing.in(Easing.quad),
          delay: displayMs,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(bannerScale, {
          toValue: 1.14,
          duration: 260,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(bannerScale, {
          toValue: 1,
          duration: 160,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(bannerOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: FADE_MS,
          delay: displayMs,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const timer = setTimeout(onComplete, displayMs + FADE_MS + 80);
    return () => clearTimeout(timer);
  }, [visible, isCeo, onComplete, backdropOpacity, bannerScale, bannerOpacity]);

  if (!visible) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.banner,
            {
              opacity: bannerOpacity,
              transform: [{ scale: bannerScale }],
            },
          ]}
        >
          <PlayerAvatar avatarId={playerAvatarId} size="lg" />
          <Text style={styles.emoji}>{isCeo ? '👑' : '🎉'}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    backgroundColor: '#1c2541',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 22,
    borderWidth: 2,
    borderColor: '#ffd166',
    alignItems: 'center',
    maxWidth: '88%',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    color: '#ffd166',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#edf2f4',
    fontSize: 15,
    textAlign: 'center',
  },
});
