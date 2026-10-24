import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DifficultyFields, GOALS, GoalFields } from '@/components/ProfileFields';
import { Button, Card, Gap, Row, SectionLabel, T } from '@/components/ui';
import { LEVEL_LABELS } from '@/data/exercises';
import { computeBaseLevel, computeLevel } from '@/lib/planGenerator';
import type { Profile } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import { space, useTheme } from '@/theme';

/**
 * Быстро поменять программу: цель (мышцы / рельеф / форма) и сложность (легче / тяжелее),
 * или начать анкету заново. Журнал тренировок при этом сохраняется.
 */
export function ChangePlanSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const saved = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => s.plan);
  const setProfile = useAppStore((s) => s.setProfile);
  const regenerate = useAppStore((s) => s.regenerate);
  const restart = useAppStore((s) => s.restartOnboarding);
  const [draft, setDraft] = useState<Profile>(saved);

  useEffect(() => {
    if (visible) setDraft(saved);
  }, [visible, saved]);

  const level = computeLevel(draft);
  const base = computeBaseLevel(draft);

  const apply = () => {
    const prevLevel = plan?.level;
    const prevGoal = plan?.goal;
    setProfile(draft);
    regenerate();
    onClose();
    const goal = GOALS.find((g) => g.value === draft.goal)?.title ?? '';
    const changes = [
      prevGoal !== draft.goal ? `цель: ${goal}` : null,
      prevLevel !== level ? `уровень: ${LEVEL_LABELS[level]}` : null,
    ].filter(Boolean);
    Alert.alert(
      'План пересоздан',
      changes.length
        ? `Поменялось — ${changes.join(', ')}. Подходы, повторения и упражнения подобраны заново.`
        : 'Упражнения подобраны заново. Цель и уровень остались прежними — если хочешь другой план, поменяй цель или сложность.',
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <Row style={{ justifyContent: 'space-between', padding: space.lg, paddingBottom: 0 }}>
          <T variant="h1">Изменить план</T>
          <Pressable accessibilityRole="button" accessibilityLabel="Закрыть" onPress={onClose} hitSlop={10} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={26} color={t.text} />
          </Pressable>
        </Row>
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xl }}>
          <T color={t.textMuted}>Выбери новую цель или сделай тренировки легче или тяжелее. Журнал тренировок сохранится.</T>
          <SectionLabel>Цель</SectionLabel>
          <GoalFields profile={draft} onChange={setDraft} />
          <SectionLabel>Сложность</SectionLabel>
          <DifficultyFields profile={draft} onChange={setDraft} />
          <Gap h={space.md} />
          <Card tone="alt">
            <Row style={{ justifyContent: 'space-between' }}>
              <T variant="bodyStrong">Уровень плана</T>
              <T variant="h3" color={t.accentStrong}>
                {LEVEL_LABELS[level]}
              </T>
            </Row>
            {level !== base ? (
              <T variant="small" color={t.textMuted} style={{ marginTop: space.xs }}>
                По твоим результатам — {LEVEL_LABELS[base].toLowerCase()}, с поправкой — {LEVEL_LABELS[level].toLowerCase()}.
              </T>
            ) : (draft.difficulty ?? 0) !== 0 ? (
              <T variant="small" color={t.textMuted} style={{ marginTop: space.xs }}>
                {draft.difficulty === 1 ? 'Тяжелее уже некуда' : 'Легче уже некуда'} — уровень ограничен твоими результатами и безопасностью.
              </T>
            ) : null}
          </Card>
          <Gap h={space.xl} />
          <Button title="Пересоздать план" icon="refresh" onPress={apply} />
          <Gap h={space.md} />
          <Button
            title="Пройти анкету заново"
            variant="ghost"
            onPress={() =>
              Alert.alert('Начать заново?', 'Откроется анкета: рост, вес, цель, инвентарь, здоровье и дни. Журнал тренировок сохранится.', [
                { text: 'Отмена', style: 'cancel' },
                {
                  text: 'Начать',
                  onPress: () => {
                    onClose();
                    restart();
                  },
                },
              ])
            }
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
