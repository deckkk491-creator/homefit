import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gap, Row, T } from '@/components/ui';
import { ExerciseThumb } from '@/components/workout';
import { GEAR_LABELS, getExercise, LEVEL_LABELS } from '@/data/exercises';
import { alternativesFor } from '@/lib/planGenerator';
import type { Level, Profile } from '@/lib/types';
import { radius, space, useTheme } from '@/theme';

/** Выбор упражнения на замену: тот же тип движения, подходящий инвентарь, уровень и ограничения. */
export function ReplaceSheet({
  exerciseId,
  profile,
  level,
  exclude,
  onPick,
  onClose,
}: {
  exerciseId: string | null;
  profile: Profile;
  level: Level;
  exclude: string[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const current = exerciseId ? getExercise(exerciseId) : undefined;
  const options = useMemo(
    () => (exerciseId ? alternativesFor(exerciseId, profile, level, exclude) : []),
    [exerciseId, profile, level, exclude],
  );
  const same = options.filter((o) => o.pattern === current?.pattern);
  const other = options.filter((o) => o.pattern !== current?.pattern);

  const item = (id: string) => {
    const ex = getExercise(id);
    if (!ex) return null;
    const gear = ex.requires.map((g) => (g === 'bench' && profile.equipment.benchType === 'chair' ? 'Стул' : GEAR_LABELS[g])).join(', ');
    return (
      <Pressable
        key={id}
        accessibilityRole="button"
        accessibilityLabel={`Заменить на: ${ex.name}`}
        onPress={() => onPick(id)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          padding: space.sm,
          borderRadius: radius.md,
          backgroundColor: pressed ? t.surfaceAlt : t.surface,
          borderWidth: 1,
          borderColor: t.border,
          marginBottom: space.sm,
        })}>
        <ExerciseThumb id={id} size={60} />
        <View style={{ flex: 1 }}>
          <T variant="bodyStrong">{ex.name}</T>
          <T variant="small" color={t.textMuted}>
            {LEVEL_LABELS[ex.level]} · {gear || 'без инвентаря'}
          </T>
        </View>
        <Ionicons name="swap-horizontal" size={22} color={t.accentStrong} />
      </Pressable>
    );
  };

  return (
    <Modal visible={!!exerciseId} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <Row style={{ justifyContent: 'space-between', padding: space.lg, paddingBottom: space.sm }}>
          <View style={{ flex: 1 }}>
            <T variant="label" color={t.textMuted}>
              Заменить
            </T>
            <T variant="h2">{current?.name ?? ''}</T>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Закрыть" onPress={onClose} hitSlop={10} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={26} color={t.text} />
          </Pressable>
        </Row>
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, paddingBottom: insets.bottom + space.xl }}>
          <T variant="small" color={t.textMuted}>
            Замена сохранится в плане — в следующий раз будет это упражнение. Вернуть всё как было можно кнопкой «Пересоздать план».
          </T>
          <Gap h={space.lg} />
          {same.length ? (
            <>
              <T variant="label" color={t.textMuted}>
                На те же мышцы
              </T>
              <Gap h={space.sm} />
              {same.map((o) => item(o.id))}
            </>
          ) : null}
          {other.length ? (
            <>
              <Gap h={space.md} />
              <T variant="label" color={t.textMuted}>
                Похожие
              </T>
              <Gap h={space.sm} />
              {other.map((o) => item(o.id))}
            </>
          ) : null}
          {!options.length ? (
            <T color={t.textMuted}>
              Подходящих замен с твоим инвентарём и ограничениями нет. Можно убрать упражнение из тренировки или добавить инвентарь в профиле.
            </T>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
