import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, View } from 'react-native';

import { Button, Card, Gap, Pill, Row, Screen, T } from '@/components/ui';
import { HoldTimer } from '@/components/HoldTimer';
import { ReplaceSheet } from '@/components/ReplaceSheet';
import { SwipeRow } from '@/components/SwipeRow';
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
import { useNow } from '@/lib/useNow';
import { todayKey, useAppStore } from '@/store/useAppStore';
import { radius, space, useTheme } from '@/theme';

/** Номер первого неотмеченного подхода */
function nextOpenSet(done: boolean[], total: number): number {
  for (let i = 0; i < total; i++) if (!done[i]) return i;
  return 0;
}

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
  const profile = useAppStore((s) => s.profile);
  const replaceExercise = useAppStore((s) => s.replaceExercise);
  const removeExercise = useAppStore((s) => s.removeExercise);

  const now = useNow();
  const dateKey = todayKey(now);
  const scheduledKey = plan ? workoutKeyForDate(plan, now) : null;
  // Можно потренироваться и в день отдыха — выбрав тренировку вручную.
  const [manualKey, setManualKey] = useState<string | null>(null);
  const activeKey = session && session.date === dateKey ? session.workoutKey : manualKey ?? scheduledKey;
  const workout = plan && activeKey ? plan.workouts[activeKey] : null;
  // l.date хранится в UTC (toISOString), поэтому сравниваем по локальной дате, а не по первым 10 символам.
  const doneToday = logs.some((l) => todayKey(new Date(l.date)) === dateKey);
  const inSession = !!session && session.date === dateKey && session.workoutKey === activeKey;

  const [timer, setTimer] = useState<{ sec: number; key: number } | null>(null);
  // Замена упражнения и таймер удержания (планка и т.п.)
  const [replacing, setReplacing] = useState<{ index: number; id: string } | null>(null);
  const [hold, setHold] = useState<{ index: number; set: number } | null>(null);

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

  const confirmRemove = (index: number, name: string) => {
    if (!workout || !activeKey) return;
    if (workout.exercises.length <= 1) {
      Alert.alert('Это последнее упражнение', 'Его можно заменить, но не удалить.');
      return;
    }
    Alert.alert(`Убрать «${name}»?`, 'Упражнение исчезнет из этой тренировки и в следующие разы. Вернуть можно кнопкой «Пересоздать план».', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Убрать', style: 'destructive', onPress: () => removeExercise(activeKey, index) },
    ]);
  };

  const exerciseMenu = (index: number, id: string, name: string) => {
    const replace = () => setReplacing({ index, id });
    const remove = () => confirmRemove(index, name);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: name, options: ['Заменить на другое', 'Убрать из тренировки', 'Отмена'], destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        (i) => (i === 0 ? replace() : i === 1 ? remove() : undefined),
      );
    } else {
      Alert.alert(name, undefined, [
        { text: 'Заменить', onPress: replace },
        { text: 'Убрать', style: 'destructive', onPress: remove },
        { text: 'Отмена', style: 'cancel' },
      ]);
    }
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
            Дни тренировок
          </T>
          <Gap h={space.xs} />
          <T variant="h2">{nextDays}</T>
        </Card>
        <Gap h={space.xl} />
        <T variant="h3">Хочешь потренироваться сегодня?</T>
        <Gap h={space.sm} />
        {Object.values(plan.workouts).map((w) => (
          <Card key={w.key} onPress={() => setManualKey(w.key)} style={{ marginBottom: space.sm }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong">{w.title}</T>
                <T variant="small" color={t.textMuted}>
                  {w.focus} · ≈ {estimateMinutes(w)} мин
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
              {workout.focus} · ≈ {estimateMinutes(workout)} мин
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
          Подходов: {setsDone} из {setsTotal}. Отметь подход — запустится таймер отдыха.
        </T>
        <Gap h={space.lg} />

        {workout.exercises.map((pe, i) => {
          const ex = getExercise(pe.exerciseId);
          if (!ex) return null;
          const done = inSession ? session?.done[i] ?? [] : [];
          const complete = done.filter(Boolean).length === pe.sets;
          return (
            <SwipeRow
              key={`${pe.exerciseId}-${i}`}
              style={{ marginBottom: space.md }}
              actions={[
                { label: 'Заменить', icon: 'swap-horizontal', tone: 'accent', onPress: () => setReplacing({ index: i, id: pe.exerciseId }) },
                { label: 'Убрать', icon: 'trash-outline', tone: 'danger', onPress: () => confirmRemove(i, ex.name) },
              ]}>
            <Card style={{ opacity: complete ? 0.7 : 1 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Открыть технику выполнения. Смахни влево, чтобы заменить или убрать"
                onPress={() => router.push(`/exercise/${pe.exerciseId}`)}
                onLongPress={() => exerciseMenu(i, pe.exerciseId, ex.name)}>
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
                      отдых {pe.restSec} сек
                    </T>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Действия: ${ex.name}`}
                    hitSlop={10}
                    onPress={() => exerciseMenu(i, pe.exerciseId, ex.name)}
                    style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="ellipsis-horizontal" size={22} color={t.textFaint} />
                  </Pressable>
                </Row>
              </Pressable>
              {pe.note ? (
                <T variant="small" color={t.textMuted} style={{ marginTop: space.sm }}>
                  {pe.note}
                </T>
              ) : null}
              <Gap h={space.md} />
              <SetBoxes total={pe.sets} done={done} onToggle={(si) => onToggle(i, si, pe.sets, pe.restSec)} />
              {pe.isTime && !complete ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setHold({ index: i, set: nextOpenSet(done, pe.sets) })}
                  style={({ pressed }) => ({
                    marginTop: space.md,
                    minHeight: 48,
                    borderRadius: radius.pill,
                    backgroundColor: t.accent,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: space.sm,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  <Ionicons name="timer-outline" size={20} color={t.accentInk} />
                  <T variant="bodyStrong" color={t.accentInk}>
                    Таймер: стоять {pe.repsMax} сек
                  </T>
                </Pressable>
              ) : null}
            </Card>
            </SwipeRow>
          );
        })}

        {workout.exercises.length ? (
          <T variant="small" color={t.textFaint} style={{ textAlign: 'center', marginBottom: space.md }}>
            Смахни упражнение влево, чтобы заменить или убрать его
          </T>
        ) : null}
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
      <ReplaceSheet
        exerciseId={replacing?.id ?? null}
        profile={profile}
        level={plan.level}
        exclude={workout.exercises.map((e) => e.exerciseId)}
        onClose={() => setReplacing(null)}
        onPick={(id) => {
          if (replacing && activeKey) replaceExercise(activeKey, replacing.index, id);
          setReplacing(null);
        }}
      />
      {hold && workout.exercises[hold.index] ? (
        <HoldTimer
          visible
          title={getExercise(workout.exercises[hold.index].exerciseId)?.name ?? ''}
          setLabel={`Подход ${hold.set + 1} из ${workout.exercises[hold.index].sets}`}
          targetSec={workout.exercises[hold.index].repsMax}
          minSec={workout.exercises[hold.index].repsMin}
          maxSec={workout.exercises[hold.index].repsMax}
          onClose={() => setHold(null)}
          onDone={() => {
            const pe = workout.exercises[hold.index];
            const already = inSession && !!session?.done[hold.index]?.[hold.set];
            if (!already) onToggle(hold.index, hold.set, pe.sets, pe.restSec);
            setHold(null);
          }}
        />
      ) : null}
    </View>
  );
}
