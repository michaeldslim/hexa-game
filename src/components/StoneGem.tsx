import { StyleSheet, View } from 'react-native';

type StoneGemProps = {
  size: number;
};

export default function StoneGem({ size }: StoneGemProps) {
  const radius = Math.max(6, size * 0.16);
  const inner = size * 0.82;

  return (
    <View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}
    >
      <View
        style={[
          styles.core,
          {
            width: inner,
            height: inner,
            borderRadius: radius * 0.85,
          },
        ]}
      />
      <View style={[styles.fleck, { top: size * 0.22, left: size * 0.28, width: size * 0.14, height: size * 0.1 }]} />
      <View style={[styles.fleck, { top: size * 0.55, left: size * 0.52, width: size * 0.12, height: size * 0.08, opacity: 0.5 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3d4654',
    borderWidth: 2,
    borderColor: '#5c6778',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },
  core: {
    backgroundColor: '#2a313c',
    borderWidth: 1,
    borderColor: '#4a5568',
  },
  fleck: {
    position: 'absolute',
    backgroundColor: '#6b7280',
    borderRadius: 2,
    opacity: 0.65,
  },
});
