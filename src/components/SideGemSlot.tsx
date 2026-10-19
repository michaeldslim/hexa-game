import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Triplet } from '../types/game';
import CandyGem from './CandyGem';

type SideGemSlotProps = {
  label: string;
  gems: Triplet | null;
  gemSize: number;
  onPress?: () => void;
  pressEnabled?: boolean;
  emptyHint?: string;
};

function VerticalTriplet({ gems, size }: { gems: Triplet; size: number }) {
  return (
    <View style={styles.triplet}>
      {gems.map((kind, index) => (
        <View key={`${kind}-${index}`} style={styles.gemRow}>
          <CandyGem kind={kind} size={size} />
        </View>
      ))}
    </View>
  );
}

export default function SideGemSlot({
  label,
  gems,
  gemSize,
  onPress,
  pressEnabled = false,
  emptyHint = '—',
}: SideGemSlotProps) {
  const inner = (
    <>
      <Text style={styles.label}>{label}</Text>
      {gems ? (
        <VerticalTriplet gems={gems} size={gemSize} />
      ) : (
        <View style={[styles.empty, { width: gemSize + 8, minHeight: gemSize * 3 + 8 }]}>
          <Text style={styles.emptyText}>{emptyHint}</Text>
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={[styles.slot, !pressEnabled && styles.slotDisabled]}
        onPress={onPress}
        disabled={!pressEnabled}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.slot}>{inner}</View>;
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1b263b',
    borderWidth: 1,
    borderColor: '#415a77',
    minWidth: 56,
  },
  slotDisabled: {
    opacity: 0.5,
  },
  label: {
    color: '#8d99ae',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  triplet: {
    alignItems: 'center',
    gap: 2,
  },
  gemRow: {
    alignItems: 'center',
  },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#415a77',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#415a77',
    fontSize: 16,
    fontWeight: '700',
  },
});
