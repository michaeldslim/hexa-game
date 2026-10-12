import { Image, StyleSheet, View } from 'react-native';
import { CANDY_FRAME_GLOW, CANDY_FRAME_HEX } from '../constants/candyTheme';
import type { CandyKind } from '../types/game';

const CANDY_IMAGES: Record<CandyKind, ReturnType<typeof require>> = {
  Red: require('../../assets/images/candy_red.png'),
  Blue: require('../../assets/images/candy_blue.png'),
  Gold: require('../../assets/images/candy_gold.png'),
  Mint: require('../../assets/images/candy_mint.png'),
};

type CandyGemProps = {
  kind: CandyKind;
  size: number;
  active?: boolean;
};

export default function CandyGem({ kind, size, active = false }: CandyGemProps) {
  const frameColor = CANDY_FRAME_HEX[kind];
  const inner = size * 0.88;

  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderColor: frameColor,
          backgroundColor: CANDY_FRAME_GLOW[kind],
          borderWidth: active ? 3 : 2,
          borderRadius: Math.max(6, size * 0.18),
          shadowColor: active ? frameColor : 'transparent',
          shadowOpacity: active ? 0.55 : 0,
          shadowRadius: active ? 6 : 0,
          elevation: active ? 4 : 0,
        },
      ]}
    >
      <Image
        source={CANDY_IMAGES[kind]}
        style={{ width: inner, height: inner }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
