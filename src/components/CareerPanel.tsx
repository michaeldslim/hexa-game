import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  careerRankLabel,
  getCareerLadderRows,
  getCareerLadderStatus,
  getCareerProgressCopy,
  getPromotionRequirementCopy,
} from '../career/careerLabels';
import { getPromotionTarget } from '../career/careerRules';
import { useCareer } from '../career/CareerProvider';
import { useI18n } from '../i18n/I18nContext';
import { format } from '../i18n/format';
import { useSettings } from '../settings/SettingsProvider';
import type { CareerRank } from '../types/career';

type CareerPanelProps = {
  visible: boolean;
  onClose: () => void;
};

export default function CareerPanel({ visible, onClose }: CareerPanelProps) {
  const insets = useSafeAreaInsets();
  const { strings } = useI18n();
  const { careerState } = useCareer();
  const { settings } = useSettings();
  const progress = getCareerProgressCopy(strings, careerState);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          { paddingTop: Math.max(56, insets.top + 12), paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{strings.career.screen.title}</Text>
          <Pressable style={styles.backButton} onPress={onClose} hitSlop={8}>
            <Text style={styles.backText}>{strings.common.back}</Text>
          </Pressable>
        </View>

        {!settings.careerModeEnabled ? (
          <View style={styles.disabledBox}>
            <Text style={styles.disabledTitle}>{strings.career.screen.disabledTitle}</Text>
            <Text style={styles.disabledBody}>{strings.career.screen.disabledBody}</Text>
          </View>
        ) : (
          <>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>{strings.career.screen.currentRank}</Text>
              <Text style={styles.summaryValue}>{progress.primary}</Text>
              {progress.secondary ? (
                <Text style={styles.summaryHint}>{progress.secondary}</Text>
              ) : null}
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom + 20) }}
              showsVerticalScrollIndicator={false}
            >
              {getCareerLadderRows().map((rank) => {
                const status = getCareerLadderStatus(careerState, rank);
                return (
                  <LadderRow
                    key={rank}
                    rank={rank}
                    status={status}
                    careerStateRank={careerState.rank}
                    promotionWins={careerState.promotionWins}
                  />
                );
              })}
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
}

function LadderRow({
  rank,
  status,
  careerStateRank,
  promotionWins,
}: {
  rank: CareerRank;
  status: 'achieved' | 'current' | 'locked';
  careerStateRank: CareerRank;
  promotionWins: number;
}) {
  const { strings } = useI18n();
  const label = careerRankLabel(strings, rank);
  const statusLabel =
    status === 'achieved'
      ? strings.career.ladder.achieved
      : status === 'current'
        ? strings.career.ladder.current
        : strings.career.ladder.locked;

  let detail = getPromotionRequirementCopy(strings, rank) ?? '';
  if (status === 'current' && careerStateRank === rank) {
    const target = getPromotionTarget(rank);
    if (target) {
      detail = format(strings.career.ladder.progressToNext, {
        current: promotionWins,
        required: target.requiredWins,
        nextRank: careerRankLabel(strings, target.nextRank),
      });
    }
  }
  if (rank === 'intern' && status !== 'locked') {
    detail = strings.career.ladder.startingRank;
  }

  return (
    <View style={[styles.row, status === 'current' && styles.rowCurrent]}>
      <Text style={styles.rowRank}>{label}</Text>
      <Text style={styles.rowStatus}>{statusLabel}</Text>
      {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b132b',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    flex: 1,
    color: '#edf2f4',
    fontSize: 22,
    fontWeight: '700',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  summary: {
    backgroundColor: '#1b263b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    color: '#8d99ae',
    fontSize: 12,
  },
  summaryValue: {
    color: '#ffd166',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryHint: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 6,
  },
  scroll: {
    flex: 1,
  },
  row: {
    backgroundColor: '#1c2541',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  rowCurrent: {
    borderWidth: 1,
    borderColor: '#ffd166',
  },
  rowRank: {
    color: '#edf2f4',
    fontSize: 16,
    fontWeight: '600',
  },
  rowStatus: {
    color: '#6bcb77',
    fontSize: 12,
    marginTop: 2,
  },
  rowDetail: {
    color: '#8d99ae',
    fontSize: 12,
    marginTop: 4,
  },
  disabledBox: {
    backgroundColor: '#1b263b',
    borderRadius: 12,
    padding: 16,
  },
  disabledTitle: {
    color: '#edf2f4',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledBody: {
    color: '#8d99ae',
    marginTop: 8,
    lineHeight: 20,
  },
  backText: {
    color: '#4cc9f0',
    fontSize: 16,
    fontWeight: '600',
  },
});
