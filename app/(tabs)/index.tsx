import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button, Card, Gap, Pill, Row, Screen, T } from '@/components/ui';
import { ExerciseThumb, RestTimer, SetBoxes } from '@/components/workout';
import { getExercise } from '@/data/exercises';
import {
  estimateMinutes,
  formatTarget,
  WEEKDAY_FULL,
  WEEKDAY_SHORT,
  weekdayOf,
  workoutKeyForDate,
} from '@/lib/planGenerator';
import { todayKey, useAppStore } from '@/store/useAppStore';
import { radius, space, useTheme } from '@/theme';

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export default function Today() {
  const t = useTheme();
  const plan = useAppStore((s) => s.plan);
  const session = useAppStore((s) => s.session);
  const logs = useAppStore((s) => s.logs);
  const startSession = useAppStore((s) => s.startSession);
  const toggleSet = useAppStore((s) => s.toggleSet);
  const finishSession = useAppStore((s) => s.finishSession);
  const discardSession = useAppStore((s) => s.discardSession);

  const now = new Date();
  const dateKey = todayKey(now);
  const scheduledKey = plan ? workoutKeyForDate(plan, now) : null;
  // Можно потренироваться и в день отдыха — выбрав тренировку вручную.
  const [manualKey, setManualKey] = useState<string | null>(null);
  const activeKey = session && session.date === dateKey ? session.workoutKey : manualKey ?? scheduledKey;
  const workout = plan && activeKey ? plan.workouts[activeKey] : null;
  const doneToday = logs.some((l) => l.date.slice(0, 10) === dateKey);
  const inSession = !!session && session.date === dateKey && session.workoutKey === activeKey;

  const [timer, setTimer] = useState<{ sec: number; key: number } | null>(null);

  const { setsDone, setsTotal } = useMemo(() => {
    if (!workout) return { setsDone: 0, setsTotal: 0 };
    let d = 0;
    let tot = 0;
    workout.exercises.forEach((e, i) => {
      tot += e.sets;
      d += (session?.done[i] ?? []).filter(Boolean).length;
    });
    return { setsDone: inSession ? d : 0, setsTotal: tot };
  }, [workout, session, inSession]);

  if (!plan) return null;

  const onToggle = (ei: number, si: number, total: number, rest: number) => {
    if (!workout || !activeKey) return;
    if (!inSession) startSession(dateKey, activeKey);
    const wasDone = !!session?.done[ei]?.[si] && inSession;
    toggleSet(ei, si, total);
    if (!wasDone) setTimer({ sec: rest, key: Date.now() });
  };

  const finish = () => {
    if (!workout || !activeKey || !session) return;
    const minutes = Math.max(1, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000));
    const save = () => {
      finishSession({
        date: new Date().toISOString(),
        workoutKey: activeKey,
        title: workout.title,
        durationMin: minutes,
        setsDone,
        setsTotal,
      });
      setTimer(null);
      setManualKey(null);
    };
    if (setsDone < setsTotal) {
      Alert.alert('Завершить тренировку?', `Выполнено подходов: ${setsDone} из ${setsTotal}.`, [
        { text: 'Продолжить', style: 'cancel' },
        { text: 'Завершить', onPress: save },
      ]);
    } else save();
  };

  const header = (
    <>
      <T variant="label" color={t.textMuted}>
        {WEEKDAY_FULL[weekdayOf(now)]}, {now.getDate()} {MONTHS[now.getMonth()]}
      </T>
      <Gap h={space.xs} />
    </>
  );

  // ── День отдыха ──
  if (!workout) {
    const nextDays = plan.days.map((d) => WEEKDAY_SHORT[d]).join(' · ');
    return (
      <Screen>
        {header}
        <T variant="display">{doneToday ? 'Готово!' : 'День отдыха'}</T>
        <Gap h={space.sm} />
        <T color={t.textMuted}>
          {doneToday
            ? 'Тренировка на сегодня записана. Мышцы растут во время восстановления.'
            : 'Восстановление — часть тренировочного процесса. Прогулка или растяжка будут кстати.'}
        </T>
        <Gap h={space.xl} />
        <Card tone="alt">
          <T variant="label" color={t.textMuted}>
            Ваши дни
          </T>
          <Gap h={space.xs} />
          <T variant="h2">{nextDays}</T>
        </Card>
        <Gap h={space.xl} />
        <T variant="h3">Хотите потренироваться сегодня?</T>
        <Gap h={space.sm} />
        {Object.values(plan.workouts).map((w) => (
          <Card key={w.key} onPress={() => setManualKey(w.key)} style={{ marginBottom: space.sm }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong">{w.title}</T>
                <T variant="small" color={t.textMuted}>
                  {w.focus} · ~{estimateMinutes(w)} мин
                </T>
              </View>
              <Ionicons name="chevron-forward" size={22} color={t.textFaint} />
            </Row>
          </Card>
        ))}
      </Screen>
    );
  }

  const pct = setsTotal ? setsDone / setsTotal : 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Screen contentStyle={{ paddingBottom: timer ? 220 : 140 }}>
        {header}
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <T variant="display">{workout.title}</T>
            <Gap h={space.xs} />
            <T color={t.textMuted}>
              {workout.focus} · ~{estimateMinutes(workout)} мин
            </T>
          </View>
        </Row>
        {manualKey && !inSession ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setManualKey(null)}
            style={{ marginTop: space.xs, minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
            <T variant="small" color={t.accentStrong} style={{ fontWeight: '700' }}>
              ← Вернуться к расписанию
            </T>
          </Pressable>
        ) : null}
        {doneToday && !inSession ? (
          <>
            <Gap h={space.md} />
            <Pill label="Сегодня уже есть записанная тренировка" tone="accent" />
          </>
        ) : null}
        <Gap h={space.lg} />

        {/* Прогресс */}
        <View style={{ height: 10, borderRadius: radius.pill, backgroundColor: t.surfaceAlt, overflow: 'hidden' }}>
          <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: t.accent }} />
        </View>
        <Gap h={space.xs} />
        <T variant="small" color={t.textMuted}>
          Подходов: {setsDone} из {setsTotal}. Отметьте подход — запустится таймер отдыха.
        </T>
        <Gap h={space.lg} />

        {workout.exercises.map((pe, i) => {
          const ex = getExercise(pe.exerciseId);
          if (!ex) return null;
          const done = inSession ? session?.done[i] ?? [] : [];
          const complete = done.filter(Boolean).length === pe.sets;
          return (
            <Card key={pe.exerciseId} style={{ marginBottom: space.md, opacity: complete ? 0.7 : 1 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Открыть технику выполнения"
                onPress={() => router.push(`/exercise/${pe.exerciseId}`)}>
                <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
                  <ExerciseThumb id={pe.exerciseId} size={72} />
                  <View style={{ flex: 1 }}>
                    <T variant="h3">{ex.name}</T>
                    <Gap h={2} />
                    <T variant="bodyStrong" color={t.accentStrong}>
                      {formatTarget(pe)}
                    </T>
                    <T variant="small" color={t.textMuted}>
                      {pe.weightKg ? `${pe.weightKg} кг${ex.loadType === 'dumbbell' ? ' (гантель)' : ''} · ` : ''}
                      отдых {pe.restSec} с
                    </T>
                  </View>
                  <Ionicons name="information-circle-outline" size={24} color={t.textFaint} />
                </Row>
              </Pressable>
              {pe.note ? (
                <T variant="small" color={t.textMuted} style={{ marginTop: space.sm }}>
                  {pe.note}
                </T>
              ) : null}
              <Gap h={space.md} />
              <SetBoxes total={pe.sets} done={done} onToggle={(si) => onToggle(i, si, pe.sets, pe.restSec)} />
            </Card>
          );
        })}

        <Gap h={space.sm} />
        {inSession ? (
          <>
            <Button title="Завершить тренировку" icon="flag" onPress={finish} />
            <Gap h={space.sm} />
            <Button
              title="Сбросить отметки"
              variant="ghost"
              onPress={() =>
                Alert.alert('Сбросить прогресс тренировки?', undefined, [
                  { text: 'Отмена', style: 'cancel' },
                  {
                    text: 'Сбросить',
                    style: 'destructive',
                    onPress: () => {
                      discardSession();
                      setTimer(null);
                    },
                  },
                ])
              }
            />
          </>
        ) : (
          <Button
            title="Начать тренировку"
            icon="play"
            onPress={() => activeKey && startSession(dateKey, activeKey)}
          />
        )}
      </Screen>
      {timer ? (
        <View style={{ position: 'absolute', left: space.lg, right: space.lg, bottom: space.md }}>
          <RestTimer seconds={timer.sec} startKey={timer.key} onClose={() => setTimer(null)} />
        </View>
      ) : null}
    </View>
  );
}
