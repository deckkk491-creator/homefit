import { EXERCISE_BY_ID, EXERCISES } from '@/data/exercises';
import {
  availableGear,
  bmi,
  chooseSplit,
  computeLevel,
  formatTarget,
  generatePlan,
  suggestWeight,
  weekdayOf,
  workoutKeyForDate,
} from '@/lib/planGenerator';
import type { Profile, Weekday } from '@/lib/types';

const base: Profile = {
  sex: 'unspecified',
  age: 30,
  heightCm: 180,
  weightKg: 80,
  goal: 'strength',
  maxPushups: 5,
  maxPullups: 0,
  equipment: {
    pullupBar: false,
    dumbbells: { has: false, weightKg: 0, adjustable: false },
    barbell: { has: false, maxKg: 0 },
    bands: false,
    bench: false,
  },
};

const withEq = (patch: Partial<Profile['equipment']>, extra: Partial<Profile> = {}): Profile => ({
  ...base,
  ...extra,
  equipment: { ...base.equipment, ...patch },
});

const MWF: Weekday[] = [0, 2, 4];
const FIXED = new Date(2026, 9, 19, 10); // понедельник

describe('профиль и уровень', () => {
  test('ИМТ считается правильно', () => {
    expect(bmi({ heightCm: 180, weightKg: 81 })).toBe(25);
  });

  test('уровень по отжиманиям/подтягиваниям', () => {
    expect(computeLevel(base)).toBe('beginner');
    expect(computeLevel({ ...base, maxPushups: 20 })).toBe('intermediate');
    expect(computeLevel({ ...base, maxPushups: 40 })).toBe('advanced');
    expect(computeLevel(withEq({ pullupBar: true }, { maxPushups: 40, maxPullups: 12 }))).toBe('advanced');
    expect(computeLevel(withEq({ pullupBar: true }, { maxPushups: 40, maxPullups: 0 }))).toBe('intermediate');
  });

  test('высокий ИМТ и возраст ограничивают уровень', () => {
    expect(computeLevel({ ...base, maxPushups: 40, weightKg: 120 })).toBe('beginner'); // ИМТ ≈ 37
    expect(computeLevel({ ...base, maxPushups: 40, age: 65 })).toBe('intermediate');
  });

  test('инвентарь без веса не учитывается', () => {
    const g = availableGear(withEq({ dumbbells: { has: true, weightKg: 0, adjustable: true }, bands: true }));
    expect(g.has('dumbbells')).toBe(false);
    expect(g.has('bands')).toBe(true);
  });
});

describe('сплиты', () => {
  test.each([
    [2, ['FA', 'FB']],
    [3, ['FA', 'FB', 'FA']],
    [4, ['UA', 'LA', 'UB', 'LB']],
    [6, ['PUA', 'PLA', 'LGA', 'PUB', 'PLB', 'LGB']],
  ])('%i дней', (n, first) => {
    expect(chooseSplit(n).rotation[0]).toEqual(first);
  });

  test('3 дня: A/B/A чередуется с B/A/B', () => {
    expect(chooseSplit(3).rotation[1]).toEqual(['FB', 'FA', 'FB']);
  });
});

describe('generatePlan', () => {
  test('детерминирован', () => {
    const a = generatePlan(base, MWF, FIXED);
    const b = generatePlan(base, MWF, FIXED);
    expect(a).toEqual(b);
  });

  test('без инвентаря — только упражнения без инвентаря', () => {
    const plan = generatePlan(base, MWF, FIXED);
    for (const w of Object.values(plan.workouts)) {
      expect(w.exercises.length).toBeGreaterThanOrEqual(4);
      for (const e of w.exercises) expect(EXERCISE_BY_ID[e.exerciseId].requires).toEqual([]);
    }
  });

  test('новичку с 5 отжиманиями дают облегчённые отжимания', () => {
    const plan = generatePlan(base, MWF, FIXED);
    const ids = plan.workouts.FA.exercises.map((e) => e.exerciseId);
    expect(ids).toContain('Incline_Push-Up');
    expect(ids).not.toContain('Pushups');
  });

  test('с гантелями выбираются базовые упражнения с гантелями и стартовый вес', () => {
    const p = withEq({ dumbbells: { has: true, weightKg: 20, adjustable: true } });
    const plan = generatePlan(p, MWF, FIXED);
    const fa = plan.workouts.FA.exercises;
    const squat = fa.find((e) => e.exerciseId === 'Goblet_Squat');
    expect(squat).toBeDefined();
    expect(squat!.weightKg).toBeGreaterThan(0);
    expect(squat!.weightKg).toBeLessThanOrEqual(20);
    for (const w of Object.values(plan.workouts))
      for (const e of w.exercises) {
        const req = EXERCISE_BY_ID[e.exerciseId].requires;
        expect(req.every((r) => r === 'dumbbells')).toBe(true);
      }
  });

  test('упражнения в одной тренировке не повторяются', () => {
    const p = withEq(
      { pullupBar: true, dumbbells: { has: true, weightKg: 24, adjustable: true }, barbell: { has: true, maxKg: 80 }, bands: true, bench: true },
      { maxPushups: 40, maxPullups: 12 }
    );
    const plan = generatePlan(p, [0, 1, 2, 3, 4, 5], FIXED);
    expect(plan.level).toBe('advanced');
    for (const w of Object.values(plan.workouts)) {
      const ids = w.exercises.map((e) => e.exerciseId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test('цель влияет на диапазон повторов', () => {
    const p = withEq({ dumbbells: { has: true, weightKg: 20, adjustable: true } });
    const strength = generatePlan(p, MWF, FIXED).workouts.FA.exercises[0];
    const tone = generatePlan({ ...p, goal: 'tone' }, MWF, FIXED).workouts.FA.exercises[0];
    expect(strength.repsMax).toBeLessThan(tone.repsMax);
    expect(strength.restSec).toBeGreaterThan(tone.restSec);
  });

  test('без турника нет подтягиваний; при 0 подтягиваний — подводящие', () => {
    const noBar = generatePlan(base, MWF, FIXED);
    const all = Object.values(noBar.workouts).flatMap((w) => w.exercises.map((e) => e.exerciseId));
    expect(all).not.toContain('Pullups');

    const bar = generatePlan(withEq({ pullupBar: true }), MWF, FIXED);
    const ids = bar.workouts.FA.exercises.map((e) => e.exerciseId);
    expect(ids).toContain('Scapular_Pull-Up');
  });
});

describe('вес и календарь', () => {
  test('нерегулируемые гантели — всегда их вес', () => {
    const p = withEq({ dumbbells: { has: true, weightKg: 8, adjustable: false } });
    expect(suggestWeight(EXERCISE_BY_ID.Side_Lateral_Raise, p, 'beginner')).toBe(8);
  });

  test('штанга: процент от рабочего веса, шаг 2.5 кг', () => {
    const p = withEq({ barbell: { has: true, maxKg: 80 } });
    const w = suggestWeight(EXERCISE_BY_ID.Barbell_Squat, p, 'intermediate')!;
    expect(w % 2.5).toBe(0);
    expect(w).toBeLessThanOrEqual(80);
  });

  test('расписание: Пн/Ср/Пт — тренировки, Вт — отдых', () => {
    const plan = generatePlan(base, MWF, FIXED);
    expect(weekdayOf(FIXED)).toBe(0);
    expect(workoutKeyForDate(plan, FIXED)).toBe('FA');
    expect(workoutKeyForDate(plan, new Date(2026, 9, 20))).toBeNull();
    expect(workoutKeyForDate(plan, new Date(2026, 9, 21))).toBe('FB');
    // следующая неделя начинается с B
    expect(workoutKeyForDate(plan, new Date(2026, 9, 26))).toBe('FB');
  });

  test('formatTarget', () => {
    expect(
      formatTarget({ exerciseId: 'Plank', sets: 3, repsMin: 20, repsMax: 30, isTime: true, perSide: false, restSec: 45, weightKg: null })
    ).toBe('3 × 20–30 сек');
  });
});

test('библиотека: 40–60+ упражнений, у каждого есть техника и ошибки', () => {
  expect(EXERCISES.length).toBeGreaterThanOrEqual(40);
  for (const e of EXERCISES) {
    expect(e.steps.length).toBeGreaterThanOrEqual(2);
    expect(e.mistakes.length).toBeGreaterThanOrEqual(1);
  }
});
