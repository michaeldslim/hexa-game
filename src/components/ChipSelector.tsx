import { Pressable, StyleSheet, Text, View } from 'react-native';
import { VOLUME_MAX, VOLUME_MIN } from '../settings/types';
import { theme } from '../theme/colors';

export type ChipOption<T extends string> = {
  value: T;
  label: string;
};

type ChipSelectorProps<T extends string> = {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function ChipSelector<T extends string>({
  options,
  value,
  onChange,
}: ChipSelectorProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type VolumeChipRowProps = {
  value: number;
  onChange: (value: number) => void;
};

export function VolumeChipRow({ value, onChange }: VolumeChipRowProps) {
  const levels = Array.from(
    { length: VOLUME_MAX - VOLUME_MIN + 1 },
    (_, index) => VOLUME_MIN + index,
  );

  return (
    <View style={styles.volumeRow}>
      {levels.map((level) => {
        const selected = level === value;
        return (
          <Pressable
            key={level}
            style={[styles.volumeChip, selected && styles.chipSelected]}
            onPress={() => onChange(level)}
          >
            <Text style={[styles.volumeLabel, selected && styles.chipLabelSelected]}>
              {level}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    backgroundColor: theme.boardBackground,
    alignItems: 'center',
  },
  chipSelected: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(255, 209, 102, 0.12)',
  },
  chipLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  chipLabelSelected: {
    color: theme.accent,
  },
  volumeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  volumeChip: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    backgroundColor: theme.boardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
});
