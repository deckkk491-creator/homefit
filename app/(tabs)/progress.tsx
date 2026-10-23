import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, View } from 'react-native';

import { Card, Gap, Row, Screen, SectionLabel, T } from '@/components/ui';
import { WEEKDAY_SHORT, weekdayOf } from '@/lib/planGenerator';
import { useNow } from '@/lib/useNow';
import { useAppStore } from '@/store/useAppStore';
import { radius, space, type as typo, useTheme } from '@/theme';

const DAY = 24 * 3600 * 1000;

function startOfWeek(d: Date): number {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - weekdayOf(x));
  return x.getTime();
}

export default function Progress() {
  const t = useTheme();
  const logs = useAppStore((s) => s.logs);
  const plan = useAppStore((s) => s.plan);
  const deleteLog = useAppStore((s) => s.deleteLog);

  const now = useNow();
  const thisWeek = startOfWeek(now);
  const perWeek = plan?.days.length ?? 3;

  // Последние 8 недель: сколько тренировок в каждой.
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const from = thisWeek - (7 - i) * 7 * DAY;
    const to = from + 7 * DAY;
    const count = logs.filter((l) => {
      const ts = new Date(l.date).getTime();
      return ts >= from && ts < to;
    }).length;
    return { from, count };
  });
  const thisWeekCount = weeks[7].count;
  const totalMin = logs.reduce((a, l) => a + l.durationMin, 0);

  // Серия недель подряд с выполненным планом (текущая неделя считается, если план уже выполнен).
  let streak = 0;
  for (let i = 7; i >= 0; i--) {
    if (weeks[i].count >= perWeek) streak++;
    else if (i === 7) continue;
    else break;
  }

  const maxBar = Math.max(perWeek, ...weeks.map((w) => w.count));

  return (
    <Screen>
      <T variant="display">Прогресс</T>
      <Gap h={space.xl} />

      <Card tone="accent">
        <T variant="label" color={t.accentInk} style={{ opacity: 0.7 }}>
          Эта неделя
        </T>
        <Row gap={space.xs} style={{ alignItems: 'flex-end' }}>
          <T style={typo.number} color={t.accentInk}>
            {thisWeekCount}
          </T>
          <T variant="h2" color={t.accentInk} style={{ marginBottom: 8, opacity: 0.6 }}>
            / {perWeek}
          </T>
        </Row>
        <T variant="bodyStrong" color={t.accentInk}>
          {thisWeekCount >= perWeek ? 'План недели выполнен!' : `Осталось тренировок: ${perWeek - thisWeekCount}`}
        </T>
      </Card>
      <Gap h={space.md} />
      <Row gap={space.md}>
        <Stat label="Всего" value={String(logs.length)} />
        <Stat label="Минут" value={String(totalMin)} />
        <Stat label="Недель подряд" value={String(streak)} />
      </Row>

      <SectionLabel>Последние 8 недель</SectionLabel>
      <Card>
        <Row gap={space.sm} style={{ alignItems: 'flex-end', height: 120 }}>
          {weeks.map((w, i) => (
            <View key={w.from} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: '100%',
                  height: Math.max(4, (w.count / maxBar) * 96),
                  borderRadius: 6,
                  backgroundColor: w.count >= perWeek ? t.accent : w.count > 0 ? t.textFaint : t.surfaceAlt,
                  borderWidth: i === 7 ? 1.5 : 0,
                  borderColor: t.text,
                }}
              />
            </View>
          ))}
        </Row>
        <Gap h={space.sm} />
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="small" color={t.textMuted}>
            7 нед. назад
          </T>
          <T variant="small" color={t.textMuted}>
            сейчас
          </T>
        </Row>
      </Card>

      <SectionLabel>Журнал</SectionLabel>
      {logs.length === 0 ? (
        <Card tone="alt">
          <T color={t.textMuted}>
            Здесь появятся завершённые тренировки. Отмечай подходы на вкладке «Сегодня» и нажми «Завершить тренировку».
          </T>
        </Card>
      ) : (
        logs.slice(0, 60).map((l) => {
          const d = new Date(l.date);
          return (
            <Card key={l.id} style={{ marginBottom: space.sm, padding: space.md }}>
              <Row gap={space.md}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: radius.sm,
                    backgroundColor: t.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <T variant="small" color={t.textMuted} style={{ fontSize: 11, fontWeight: '700' }}>
                    {WEEKDAY_SHORT[weekdayOf(d)]}
                  </T>
                  <T variant="h3">{d.getDate()}</T>
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="bodyStrong">{l.title}</T>
                  <T variant="small" color={t.textMuted}>
                    {d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} · {l.durationMin} мин · подходов{' '}
                    {l.setsDone}/{l.setsTotal}
                  </T>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Удалить запись"
                  hitSlop={10}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() =>
                    Alert.alert('Удалить запись?', l.title, [
                      { text: 'Отмена', style: 'cancel' },
                      { text: 'Удалить', style: 'destructive', onPress: () => deleteLog(l.id) },
                    ])
                  }>
                  <Ionicons name="trash-outline" size={20} color={t.textFaint} />
                </Pressable>
              </Row>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <Card style={{ flex: 1, padding: space.md }}>
      <T variant="h1">{value}</T>
      <T variant="small" color={t.textMuted}>
        {label}
      </T>
    </Card>
  );
}
