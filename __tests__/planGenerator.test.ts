import { EXERCISE_BY_ID, EXERCISES } from '@/data/exercises';
import { clampStep, formatNumber, parseNumberInput } from '@/lib/number';
import {
  availableGear,
  bmi,
  chooseSplit,
  computeLevel,
  formatTarget,
  fullBodyFallback,
  generatePlan,
  MIN_EXERCISES,
  plural,
  REPS_CAP,
  sanitizeProfile,
  suggestWeight,
  weekdayOf,
  weekIndex,
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

describe('крайние случаи генератора', () => {
  const ALL_DAYS: Record<number, Weekday[]> = {
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 3, 4],
    6: [0, 1, 2, 3, 4, 5],
  };

  test.each([2, 3, 4, 5, 6])('без инвентаря, новичок, %i дней — в каждой тренировке ≥ 4 упражнений', (n) => {
    const plan = generatePlan(base, ALL_DAYS[n], FIXED);
    for (const w of Object.values(plan.workouts)) expect(w.exercises.length).toBeGreaterThanOrEqual(MIN_EXERCISES);
    // каждый тренировочный день ссылается на существующую тренировку
    for (const week of plan.rotation) {
      expect(week).toHaveLength(n);
      for (const key of week) expect(plan.workouts[key]).toBeDefined();
    }
  });

  test('6 дней без инвентаря → запасной сплит «всё тело» с недельным сдвигом', () => {
    const plan = generatePlan(base, ALL_DAYS[6], FIXED);
    expect(plan.splitName).toBe(fullBodyFallback(6).name);
    expect(plan.rotation[0]).toEqual(['FA', 'FB', 'FC', 'FA', 'FB', 'FC']);
  });

  test('полный инвентарь на 6 дней сохраняет «жимы / тяги / ноги»', () => {
    const p = withEq(
      { pullupBar: true, dumbbells: { has: true, weightKg: 24, adjustable: true }, barbell: { has: true, maxKg: 80 }, bands: true, bench: true },
      { maxPushups: 40, maxPullups: 12 }
    );
    expect(generatePlan(p, ALL_DAYS[6], FIXED).rotation[0]).toEqual(['PUA', 'PLA', 'LGA', 'PUB', 'PLB', 'LGB']);
  });

  test('0 подтягиваний и нет турника — ни одного упражнения на турнике', () => {
    for (const n of [2, 3, 4, 5, 6]) {
      const plan = generatePlan({ ...base, maxPullups: 0 }, ALL_DAYS[n], FIXED);
      for (const w of Object.values(plan.workouts))
        for (const e of w.exercises) expect(EXERCISE_BY_ID[e.exerciseId].requires).not.toContain('bar');
    }
  });

  test('подтягивания без турника не влияют на план (значение из старого профиля)', () => {
    const a = generatePlan({ ...base, maxPushups: 20, maxPullups: 0 }, MWF, FIXED);
    const b = generatePlan({ ...base, maxPushups: 20, maxPullups: 15 }, MWF, FIXED);
    expect(b.workouts).toEqual(a.workouts);
  });

  test('1–2 подтягивания — подводящие упражнения, а не подходы «на максимум»', () => {
    const p = withEq({ pullupBar: true }, { maxPushups: 20, maxPullups: 1 });
    const ids = Object.values(generatePlan(p, MWF, FIXED).workouts).flatMap((w) => w.exercises.map((e) => e.exerciseId));
    expect(ids).not.toContain('Chin-Up');
    expect(ids).not.toContain('Pullups');
    expect(ids).toContain('Scapular_Pull-Up');
  });

  test('много отжиманий — диапазон повторений ограничен', () => {
    const plan = generatePlan({ ...base, maxPushups: 150 }, MWF, FIXED);
    const push = Object.values(plan.workouts)
      .flatMap((w) => w.exercises)
      .filter((e) => EXERCISE_BY_ID[e.exerciseId].repsFrom === 'pushups');
    expect(push.length).toBeGreaterThan(0);
    for (const e of push) {
      expect(e.repsMin).toBeLessThanOrEqual(REPS_CAP.pushups[0]);
      expect(e.repsMax).toBeLessThanOrEqual(REPS_CAP.pushups[1]);
      expect(e.repsMax).toBeGreaterThan(e.repsMin);
    }
  });

  test('экстремальные и некорректные данные анкеты не ломают план', () => {
    const weird: Profile[] = [
      { ...base, age: 90, heightCm: 120, weightKg: 250 },
      { ...base, age: 14, heightCm: 230, weightKg: 35 },
      { ...base, age: Number.NaN, heightCm: 0, weightKg: -5, maxPushups: Number.NaN },
      { ...base, heightCm: Number.POSITIVE_INFINITY, maxPushups: 10_000 },
    ];
    for (const p of weird) {
      const plan = generatePlan(p, MWF, FIXED);
      expect(['beginner', 'intermediate', 'advanced']).toContain(plan.level);
      for (const w of Object.values(plan.workouts)) {
        expect(w.exercises.length).toBeGreaterThanOrEqual(MIN_EXERCISES);
        for (const e of w.exercises) {
          expect(Number.isFinite(e.repsMin)).toBe(true);
          expect(Number.isFinite(e.repsMax)).toBe(true);
          if (e.weightKg !== null) expect(Number.isFinite(e.weightKg)).toBe(true);
        }
      }
    }
    // ИМТ ≈ 173 → новичок, без прыжков
    const heavy = generatePlan({ ...base, maxPushups: 40, heightCm: 120, weightKg: 250 }, MWF, FIXED);
    expect(heavy.level).toBe('beginner');
    const ids = Object.values(heavy.workouts).flatMap((w) => w.exercises.map((e) => e.exerciseId));
    for (const id of ids) expect(EXERCISE_BY_ID[id].impact).toBeFalsy();
  });

  test('sanitizeProfile зажимает значения в допустимые диапазоны', () => {
    const s = sanitizeProfile({ ...base, age: 5, heightCm: Number.NaN, weightKg: 999, maxPushups: -3 });
    expect(s.age).toBe(14);
    expect(s.heightCm).toBe(175);
    expect(s.weightKg).toBe(250);
    expect(s.maxPushups).toBe(0);
  });

  test('меньше 2 или повторяющиеся дни → рекомендованные; больше 6 — обрезаются', () => {
    expect(generatePlan(base, [], FIXED).days).toEqual([0, 2, 4]);
    expect(generatePlan(base, [3, 3], FIXED).days).toEqual([0, 2, 4]);
    expect(generatePlan(base, [6, 5, 4, 3, 2, 1, 0], FIXED).days).toHaveLength(6);
  });
});

describe('календарь: смена недели', () => {
  test('воскресенье → понедельник переключает чередование A/B', () => {
    const plan = generatePlan(base, [0, 2, 6], FIXED); // Пн/Ср/Вс
    expect(workoutKeyForDate(plan, new Date(2026, 9, 25, 23, 59))).toBe('FA'); // Вс, неделя 1: A/B/A
    expect(workoutKeyForDate(plan, new Date(2026, 9, 26, 0, 1))).toBe('FB'); // Пн, неделя 2: B/A/B
  });

  test('weekAnchor сохраняет номер недели после пересоздания плана', () => {
    const old = generatePlan(base, MWF, FIXED);
    const later = new Date(2026, 9, 28, 9); // среда второй недели
    const regenerated = { ...generatePlan(base, MWF, later), weekAnchor: old.createdAt };
    expect(weekIndex(regenerated, later)).toBe(1);
    expect(workoutKeyForDate(regenerated, later)).toBe(workoutKeyForDate(old, later));
    // без якоря отсчёт начался бы заново
    expect(weekIndex({ createdAt: later.toISOString() }, later)).toBe(0);
  });

  test('план, созданный в воскресенье, со следующего понедельника — неделя 2', () => {
    const sunday = new Date(2026, 9, 25, 20);
    const plan = generatePlan(base, MWF, sunday);
    expect(weekIndex(plan, sunday)).toBe(0);
    expect(weekIndex(plan, new Date(2026, 9, 26, 8))).toBe(1);
  });
});

describe('ввод чисел', () => {
  test('запятая, точка, пробелы', () => {
    expect(parseNumberInput('75,5')).toBe(75.5);
    expect(parseNumberInput('75.5')).toBe(75.5);
    expect(parseNumberInput(' 1 80 ')).toBe(180);
  });

  test('пустое поле и мусор → null', () => {
    expect(parseNumberInput('')).toBeNull();
    expect(parseNumberInput(',')).toBeNull();
    expect(parseNumberInput('abc')).toBeNull();
    expect(parseNumberInput('1,2,3')).toBeNull();
  });

  test('clampStep: диапазон и шаг', () => {
    expect(clampStep(5, 14, 90, 1)).toBe(14);
    expect(clampStep(30.6, 14, 90, 1)).toBe(31);
    expect(clampStep(75.55, 35, 250, 0.5)).toBe(75.6);
    expect(clampStep(999, 35, 250, 0.5)).toBe(250);
  });

  test('formatNumber — русская запятая', () => {
    expect(formatNumber(75.5)).toBe('75,5');
    expect(formatNumber(80)).toBe('80');
  });
});

test('plural — склонение', () => {
  expect(plural(1, 'упражнение', 'упражнения', 'упражнений')).toBe('1 упражнение');
  expect(plural(3, 'упражнение', 'упражнения', 'упражнений')).toBe('3 упражнения');
  expect(plural(5, 'упражнение', 'упражнения', 'упражнений')).toBe('5 упражнений');
  expect(plural(11, 'упражнение', 'упражнения', 'упражнений')).toBe('11 упражнений');
  expect(plural(21, 'упражнение', 'упражнения', 'упражнений')).toBe('21 упражнение');
});

// ───────────── Ограничения, стул, сложность, замены ─────────────

import { alternativesFor, computeBaseLevel, LIMITATIONS } from '@/lib/planGenerator';

const allIds = (p: Profile) =>
  Object.values(generatePlan(p, [0, 2, 4]).workouts).flatMap((w) => w.exercises.map((e) => e.exerciseId));

const fullGear = (extra: Partial<Profile> = {}): Profile =>
  withEq(
    {
      pullupBar: true,
      dumbbells: { has: true, weightKg: 20, adjustable: true },
      barbell: { has: true, maxKg: 80 },
      bands: true,
      bench: true,
    },
    { maxPushups: 35, maxPullups: 10, ...extra },
  );

test('ограничения исключают упражнения, нагружающие отмеченные зоны', () => {
  for (const lim of LIMITATIONS) {
    const ids = allIds(fullGear({ limitations: [lim] }));
    for (const id of ids) {
      expect(EXERCISE_BY_ID[id].stresses ?? []).not.toContain(lim);
    }
  }
});

test('с коленями, спиной или давлением — без прыжков', () => {
  for (const lim of ['knees', 'back', 'pressure'] as const) {
    const ids = allIds(fullGear({ limitations: [lim] }));
    expect(ids.some((id) => EXERCISE_BY_ID[id].impact)).toBe(false);
  }
});

test('план не пустеет даже при всех ограничениях', () => {
  const plan = generatePlan(fullGear({ limitations: [...LIMITATIONS] }), [0, 2, 4]);
  for (const w of Object.values(plan.workouts)) expect(w.exercises.length).toBeGreaterThanOrEqual(3);
});

test('стул вместо скамьи: нет упражнений лёжа на скамье', () => {
  const p = fullGear();
  p.equipment = { ...p.equipment, benchType: 'chair' };
  const ids = allIds(p);
  for (const id of ids) {
    const ex = EXERCISE_BY_ID[id];
    if (ex.requires.includes('bench') && ex.chair) expect(ex.chair.ok).toBe(true);
  }
  // а на скамье жим лёжа доступен
  expect(alternativesFor('Dumbbell_Floor_Press', fullGear(), 'advanced').map((e) => e.id)).toContain('Dumbbell_Bench_Press');
  expect(alternativesFor('Dumbbell_Floor_Press', p, 'advanced').map((e) => e.id)).not.toContain('Dumbbell_Bench_Press');
});

test('сложность: легче/тяжелее сдвигает уровень, но не обходит ограничения безопасности', () => {
  const mid = fullGear({ maxPushups: 15, maxPullups: 3 });
  expect(computeLevel(mid)).toBe('intermediate');
  expect(computeLevel({ ...mid, difficulty: -1 })).toBe('beginner');
  expect(computeLevel({ ...mid, difficulty: 1 })).toBe('advanced');
  expect(computeBaseLevel({ ...mid, difficulty: 1 })).toBe('intermediate');
  // ИМТ ≥ 35 — всегда новичок
  expect(computeLevel({ ...mid, weightKg: 120, heightCm: 180, difficulty: 1 })).toBe('beginner');
  // 60+ — не выше среднего
  expect(computeLevel({ ...mid, age: 65, difficulty: 1 })).toBe('intermediate');
});

test('замены: тот же тип движения первым, без уже выбранных и с учётом ограничений', () => {
  const p = fullGear();
  const alts = alternativesFor('Goblet_Squat', p, 'advanced', ['Barbell_Squat']);
  expect(alts.length).toBeGreaterThan(0);
  expect(alts[0].pattern).toBe('squat');
  expect(alts.map((e) => e.id)).not.toContain('Goblet_Squat');
  expect(alts.map((e) => e.id)).not.toContain('Barbell_Squat');
  const knees = alternativesFor('Goblet_Squat', { ...p, limitations: ['knees'] }, 'advanced');
  for (const e of knees) expect(e.stresses ?? []).not.toContain('knees');
});

test('sanitizeProfile: старые профили без новых полей работают', () => {
  const s = sanitizeProfile(base);
  expect(s.limitations).toEqual([]);
  expect(s.difficulty).toBe(0);
  expect(s.equipment.benchType).toBe('bench');
});
