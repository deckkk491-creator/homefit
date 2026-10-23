import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card, Gap, Pill, Row, Screen, SectionLabel, T } from '@/components/ui';
import { ExerciseThumb } from '@/components/workout';
import { getExercise, LEVEL_LABELS } from '@/data/exercises';
import { GOALS } from '@/components/ProfileFields';
import { estimateMinutes, formatTarget, plural, WEEKDAY_SHORT, weekdayOf, weekIndex } from '@/lib/planGenerator';
import type { Weekday } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import { radius, space, useTheme } from '@/theme';

/** Буква в кружке календаря: A/B/C — всё тело, В — верх, Н — низ/ноги, Ж — жимы, Т — тяги. */
const SHORT: Record<string, string> = {
  FA: 'A', FB: 'B', FC: 'C', UA: 'В', UB: 'В', LA: 'Н', LB: 'Н',
  PUA: 'Ж', PUB: 'Ж', PLA: 'Т', PLB: 'Т', LGA: 'Н', LGB: 'Н',
};

export default function PlanScreen() {
  const t = useTheme();
  const plan = useAppStore((s) => s.plan);
  const today = weekdayOf(new Date());
  const [selected, setSelected] = useState<Weekday>(() =>
    plan && plan.days.includes(today) ? today : (plan?.days.find((d) => d > today) ?? plan?.days[0] ?? 0)
  );
  if (!plan) return null;

  const week = weekIndex(plan, new Date());
  const rotation = plan.rotation[week % plan.rotation.length];
  const keyFor = (d: Weekday) => {
    const i = plan.days.indexOf(d);
    return i < 0 ? null : rotation[i];
  };
  const selKey = keyFor(selected);
  const workout = selKey ? plan.workouts[selKey] : null;
  const goal = GOALS.find((g) => g.value === plan.goal);

  return (
    <Screen>
      <T variant="label" color={t.textMuted}>
        Неделя {week + 1}
      </T>
      <Gap h={space.xs} />
      <T variant="display">План</T>
      <Gap h={space.md} />
      <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
        <Pill label={LEVEL_LABELS[plan.level]} tone="accent" />
        <Pill label={goal?.title ?? ''} />
        <Pill label={plan.splitName} />
      </Row>
      <Gap h={space.xl} />

      {/* Неделя */}
      <Row gap={6}>
        {WEEKDAY_SHORT.map((label, i) => {
          const d = i as Weekday;
          const key = keyFor(d);
          const isSel = d === selected;
          return (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityState={{ selected: isSel }}
              accessibilityLabel={`${label}: ${key ? plan.workouts[key].title : 'отдых'}`}
              onPress={() => setSelected(d)}
              style={{
                flex: 1,
                paddingVertical: space.md,
                borderRadius: radius.md,
                alignItems: 'center',
                gap: 6,
                backgroundColor: isSel ? t.text : t.surface,
                borderWidth: 1,
                borderColor: isSel ? t.text : d === today ? t.accentStrong : t.border,
              }}>
              <T variant="small" color={isSel ? t.bg : t.textMuted} style={{ fontWeight: '700' }}>
                {label}
              </T>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: key ? t.accent : 'transparent',
                }}>
                {key ? (
                  <T variant="small" color={t.accentInk} style={{ fontWeight: '800', fontSize: 12 }}>
                    {SHORT[key] ?? key.slice(0, 1)}
                  </T>
                ) : (
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isSel ? t.bg : t.textFaint }} />
                )}
              </View>
            </Pressable>
          );
        })}
      </Row>
      <Gap h={space.xl} />

      {workout ? (
        <>
          <T variant="h1">{workout.title}</T>
          <T color={t.textMuted}>
            {workout.focus} · ≈ {estimateMinutes(workout)} мин · {plural(workout.exercises.length, 'упражнение', 'упражнения', 'упражнений')}
          </T>
          <Gap h={space.lg} />
          {workout.exercises.map((pe, i) => {
            const ex = getExercise(pe.exerciseId);
            if (!ex) return null;
            return (
              <Card key={pe.exerciseId} onPress={() => router.push(`/exercise/${pe.exerciseId}`)} style={{ marginBottom: space.sm }}>
                <Row gap={space.md}>
                  <T variant="h3" color={t.textMuted} style={{ width: 20 }}>
                    {i + 1}
                  </T>
                  <ExerciseThumb id={pe.exerciseId} size={56} />
                  <View style={{ flex: 1 }}>
                    <T variant="bodyStrong">{ex.name}</T>
                    <T variant="small" color={t.textMuted}>
                      {formatTarget(pe)}
                      {pe.weightKg ? ` · ${pe.weightKg} кг` : ''}
                    </T>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={t.textFaint} />
                </Row>
              </Card>
            );
          })}
        </>
      ) : (
        <Card tone="alt">
          <T variant="h2">Отдых</T>
          <Gap h={space.xs} />
          <T color={t.textMuted}>В этот день тренировки нет. Лёгкая активность и сон помогут восстановиться.</T>
        </Card>
      )}

      {plan.rotation.length > 1 ? (
        <T variant="small" color={t.textMuted} style={{ marginTop: space.md }}>
          Тренировки A и B чередуются: на следующей неделе порядок поменяется.
        </T>
      ) : null}

      <SectionLabel>Советы</SectionLabel>
      <Card>
        {plan.tips.map((tip, i) => (
          <Row key={i} gap={space.md} style={{ alignItems: 'flex-start', marginBottom: i < plan.tips.length - 1 ? space.md : 0 }}>
            <Ionicons name="checkmark-circle" size={20} color={t.accentStrong} style={{ marginTop: 2 }} />
            <T variant="small" style={{ flex: 1 }}>
              {tip}
            </T>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
