import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Choice, Row, SectionLabel, Stepper, T, ToggleRow } from '@/components/ui';
import { bmi, MAX_DAYS, MIN_DAYS, RECOMMENDED_DAYS, WEEKDAY_SHORT } from '@/lib/planGenerator';
import type { Goal, Profile, Sex, Weekday } from '@/lib/types';
import { radius, space, useTheme } from '@/theme';

type P = { profile: Profile; onChange: (p: Profile) => void };

export const GOALS: { value: Goal; title: string; subtitle: string; icon: 'barbell' | 'body' | 'heart' }[] = [
  { value: 'strength', title: 'Сила и мышцы', subtitle: 'Меньше повторов, больше веса и отдыха', icon: 'barbell' },
  { value: 'tone', title: 'Тонус и рельеф', subtitle: 'Средние повторы, короткий отдых', icon: 'body' },
  { value: 'fitness', title: 'Общая форма', subtitle: 'Здоровье, выносливость, регулярность', icon: 'heart' },
];

const SEXES: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
  { value: 'unspecified', label: 'Не указывать' },
];

export function BodyFields({ profile, onChange }: P) {
  const t = useTheme();
  const set = (patch: Partial<Profile>) => onChange({ ...profile, ...patch });
  const b = bmi(profile);
  return (
    <View>
      <SectionLabel style={{ marginTop: 0 }}>Пол (необязательно)</SectionLabel>
      <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
        {SEXES.map((s) => (
          <SegmentButton key={s.value} label={s.label} selected={profile.sex === s.value} onPress={() => set({ sex: s.value })} />
        ))}
      </Row>
      <SectionLabel>Параметры</SectionLabel>
      <Stepper label="Возраст" value={profile.age} min={14} max={90} onChange={(age) => set({ age })} unit="лет" />
      <Stepper label="Рост" value={profile.heightCm} min={120} max={230} onChange={(heightCm) => set({ heightCm })} unit="см" />
      <Stepper label="Вес" value={profile.weightKg} min={35} max={250} step={0.5} onChange={(weightKg) => set({ weightKg })} unit="кг" />
      {b > 0 ? (
        <T variant="small" color={t.textMuted} style={{ marginTop: space.xs }}>
          Индекс массы тела: {b.toFixed(1)}
        </T>
      ) : null}
    </View>
  );
}

export function GoalFields({ profile, onChange }: P) {
  return (
    <View>
      {GOALS.map((g) => (
        <Choice
          key={g.value}
          title={g.title}
          subtitle={g.subtitle}
          icon={g.icon}
          selected={profile.goal === g.value}
          onPress={() => onChange({ ...profile, goal: g.value })}
        />
      ))}
    </View>
  );
}

export function LevelFields({ profile, onChange }: P) {
  const t = useTheme();
  const set = (patch: Partial<Profile>) => onChange({ ...profile, ...patch });
  const eq = profile.equipment;
  return (
    <View>
      <Stepper
        label="Отжимания за подход"
        value={profile.maxPushups}
        min={0}
        max={150}
        onChange={(maxPushups) => set({ maxPushups })}
        unit="макс."
      />
      <T variant="small" color={t.textMuted} style={{ marginBottom: space.lg }}>
        Сколько раз подряд вы отожмётесь от пола с правильной техникой.
      </T>
      <ToggleRow
        icon="git-commit-outline"
        label="Есть турник"
        hint="Дверной или настенный"
        value={eq.pullupBar}
        onChange={(pullupBar) => set({ equipment: { ...eq, pullupBar } })}
      />
      {eq.pullupBar ? (
        <Stepper
          label="Подтягивания за подход"
          value={profile.maxPullups}
          min={0}
          max={60}
          onChange={(maxPullups) => set({ maxPullups })}
          unit="макс."
        />
      ) : null}
      {eq.pullupBar && profile.maxPullups === 0 ? (
        <T variant="small" color={t.textMuted}>
          Ноль — это нормально. План начнёт с подводящих упражнений.
        </T>
      ) : null}
    </View>
  );
}

export function EquipmentFields({ profile, onChange }: P) {
  const t = useTheme();
  const eq = profile.equipment;
  const setEq = (patch: Partial<Profile['equipment']>) => onChange({ ...profile, equipment: { ...eq, ...patch } });
  const nothing = !eq.dumbbells.has && !eq.barbell.has && !eq.bands && !eq.bench;
  return (
    <View>
      <ToggleRow
        icon="barbell-outline"
        label="Гантели"
        value={eq.dumbbells.has}
        onChange={(has) => setEq({ dumbbells: { ...eq.dumbbells, has } })}
      />
      {eq.dumbbells.has ? (
        <View style={[styles.nested, { borderColor: t.border }]}>
          <Stepper
            label={eq.dumbbells.adjustable ? 'Макс. вес одной гантели' : 'Вес одной гантели'}
            value={eq.dumbbells.weightKg}
            min={1}
            max={60}
            step={0.5}
            unit="кг"
            onChange={(weightKg) => setEq({ dumbbells: { ...eq.dumbbells, weightKg } })}
          />
          <ToggleRow
            label="Разборные (можно менять вес)"
            value={eq.dumbbells.adjustable}
            onChange={(adjustable) => setEq({ dumbbells: { ...eq.dumbbells, adjustable } })}
          />
        </View>
      ) : null}
      <ToggleRow
        icon="remove-outline"
        label="Штанга"
        value={eq.barbell.has}
        onChange={(has) => setEq({ barbell: { ...eq.barbell, has } })}
      />
      {eq.barbell.has ? (
        <View style={[styles.nested, { borderColor: t.border }]}>
          <Stepper
            label="Макс. рабочий вес"
            value={eq.barbell.maxKg}
            min={10}
            max={300}
            step={2.5}
            unit="кг"
            onChange={(maxKg) => setEq({ barbell: { ...eq.barbell, maxKg } })}
          />
        </View>
      ) : null}
      <ToggleRow icon="infinite-outline" label="Резинки-эспандеры" value={eq.bands} onChange={(bands) => setEq({ bands })} />
      <ToggleRow
        icon="bed-outline"
        label="Скамья или устойчивый стул"
        value={eq.bench}
        onChange={(bench) => setEq({ bench })}
      />
      {nothing ? (
        <T variant="small" color={t.textMuted} style={{ marginTop: space.sm }}>
          Без инвентаря — тоже отлично: план будет на весе собственного тела.
        </T>
      ) : null}
    </View>
  );
}

export function DayPicker({ days, onChange }: { days: Weekday[]; onChange: (d: Weekday[]) => void }) {
  const t = useTheme();
  const isRecommended = days.length === 3 && RECOMMENDED_DAYS.every((d) => days.includes(d));
  const toggle = (d: Weekday) => {
    if (days.includes(d)) {
      if (days.length <= MIN_DAYS) return;
      onChange(days.filter((x) => x !== d));
    } else {
      if (days.length >= MAX_DAYS) return;
      onChange([...days, d].sort((a, b) => a - b) as Weekday[]);
    }
  };
  return (
    <View>
      <View style={[styles.banner, { backgroundColor: t.accent }]}>
        <Row gap={space.sm} style={{ alignItems: 'flex-start' }}>
          <Ionicons name="sparkles" size={20} color={t.accentInk} style={{ marginTop: 2 }} />
          <T variant="bodyStrong" color={t.accentInk} style={{ flex: 1 }}>
            3 раза в неделю через день (например Пн/Ср/Пт) — оптимально для укрепления и роста мышц
          </T>
        </Row>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(RECOMMENDED_DAYS)}
          disabled={isRecommended}
          style={({ pressed }) => [
            styles.bannerBtn,
            { backgroundColor: t.accentInk, opacity: isRecommended ? 0.5 : pressed ? 0.8 : 1 },
          ]}>
          <Ionicons name={isRecommended ? 'checkmark' : 'flash'} size={18} color={t.accent} />
          <T variant="bodyStrong" color={t.accent}>
            {isRecommended ? 'Выбрано рекомендованное' : 'Выбрать рекомендованное'}
          </T>
        </Pressable>
      </View>

      <View style={styles.days}>
        {WEEKDAY_SHORT.map((label, i) => {
          const d = i as Weekday;
          const on = days.includes(d);
          return (
            <Pressable
              key={label}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={label}
              onPress={() => toggle(d)}
              style={({ pressed }) => [
                styles.day,
                {
                  backgroundColor: on ? t.text : t.surface,
                  borderColor: on ? t.text : t.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <T variant="bodyStrong" color={on ? t.bg : t.text}>
                {label}
              </T>
            </Pressable>
          );
        })}
      </View>
      <T variant="small" color={t.textMuted}>
        Выбрано дней: {days.length}. Можно от {MIN_DAYS} до {MAX_DAYS}.
        {days.length >= 5 ? ' Много тренировок — следите за восстановлением и сном.' : ''}
      </T>
    </View>
  );
}

function SegmentButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.segment,
        { backgroundColor: selected ? t.text : t.surface, borderColor: selected ? t.text : t.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <T variant="bodyStrong" color={selected ? t.bg : t.text}>
        {label}
      </T>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  nested: { marginLeft: space.md, paddingLeft: space.md, borderLeftWidth: 2, marginBottom: space.sm },
  banner: { borderRadius: radius.lg, padding: space.lg, gap: space.md, marginBottom: space.lg },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  days: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: space.md },
  day: {
    flex: 1,
    aspectRatio: 0.8,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: { paddingHorizontal: space.lg, paddingVertical: space.md, borderRadius: radius.pill, borderWidth: 1 },
});
