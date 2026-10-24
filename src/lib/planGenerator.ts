/**
 * Детерминированный генератор плана тренировок.
 * Никаких сетевых запросов и ИИ — только правила. Все функции чистые,
 * поэтому легко покрываются unit-тестами (см. __tests__/planGenerator.test.ts).
 */
import { EXERCISES } from '@/data/exercises';
import type {
  Difficulty,
  Exercise,
  Gear,
  Limitation,
  Goal,
  Level,
  Pattern,
  Plan,
  PlannedExercise,
  Profile,
  Weekday,
  WorkoutTemplate,
} from './types';

export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];
export const LIMITATIONS: Limitation[] = ['knees', 'back', 'shoulders', 'wrists', 'neck', 'pressure'];
export const RECOMMENDED_DAYS: Weekday[] = [0, 2, 4];
export const MIN_DAYS = 2;
export const MAX_DAYS = 6;

const levelRank = (l: Level) => LEVELS.indexOf(l);

// ───────────────────────── Профиль ─────────────────────────

const finiteOr = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const clampNum = (v: unknown, min: number, max: number, fallback: number) =>
  Math.max(min, Math.min(max, finiteOr(v, fallback)));

/** Приводит профиль к допустимым диапазонам (защита от старых/повреждённых данных). */
export function sanitizeProfile(p: Profile): Profile {
  const e = p.equipment;
  return {
    ...p,
    age: clampNum(p.age, 14, 90, 30),
    heightCm: clampNum(p.heightCm, 120, 230, 175),
    weightKg: clampNum(p.weightKg, 35, 250, 75),
    maxPushups: Math.round(clampNum(p.maxPushups, 0, 150, 0)),
    maxPullups: e.pullupBar ? Math.round(clampNum(p.maxPullups, 0, 60, 0)) : 0,
    limitations: Array.isArray(p.limitations) ? p.limitations.filter((l) => LIMITATIONS.includes(l)) : [],
    difficulty: p.difficulty === -1 || p.difficulty === 1 ? p.difficulty : 0,
    equipment: {
      ...e,
      benchType: e.benchType === 'chair' ? 'chair' : 'bench',
      dumbbells: { ...e.dumbbells, weightKg: clampNum(e.dumbbells.weightKg, 0, 60, 0) },
      barbell: { ...e.barbell, maxKg: clampNum(e.barbell.maxKg, 0, 300, 0) },
    },
  };
}

export function bmi(p: Pick<Profile, 'heightCm' | 'weightKg'>): number {
  const h = p.heightCm / 100;
  if (!h || !p.weightKg) return 0;
  return Math.round((p.weightKg / (h * h)) * 10) / 10;
}

/** Уровень без ручной поправки — чтобы показать, что именно поменяла «легче / тяжелее». */
export function computeBaseLevel(p: Profile): Level {
  return computeLevel({ ...p, difficulty: 0 });
}

/**
 * Уровень подготовки по отжиманиям, подтягиваниям, ИМТ, возрасту и ручной поправке сложности.
 * Отжимания: <10 → 0, 10–29 → 1, ≥30 → 2. Подтягивания: 0 → 0, 1–7 → 1, ≥8 → 2.
 * Без турника подтягивания не учитываются.
 */
export function computeLevel(p: Profile): Level {
  const push = p.maxPushups >= 30 ? 2 : p.maxPushups >= 10 ? 1 : 0;
  let score: number;
  if (p.equipment.pullupBar) {
    const pull = p.maxPullups >= 8 ? 2 : p.maxPullups >= 1 ? 1 : 0;
    score = (push + pull) / 2;
  } else {
    score = push;
  }
  let rank = score >= 1.75 ? 2 : score >= 0.75 ? 1 : 0;
  // Ручная поправка «легче / тяжелее» — до ограничений безопасности ниже
  const diff: Difficulty = p.difficulty === -1 || p.difficulty === 1 ? p.difficulty : 0;
  rank = Math.max(0, Math.min(2, rank + diff));

  const b = bmi(p);
  if (b >= 35) rank = 0;
  else if (b >= 30) rank = Math.min(rank, 1);
  if (p.age >= 60) rank = Math.min(rank, 1);

  return LEVELS[rank];
}

export function availableGear(p: Profile): Set<Gear> {
  const g = new Set<Gear>();
  const e = p.equipment;
  if (e.pullupBar) g.add('bar');
  if (e.dumbbells.has && e.dumbbells.weightKg > 0) g.add('dumbbells');
  if (e.barbell.has && e.barbell.maxKg > 0) g.add('barbell');
  if (e.bands) g.add('bands');
  if (e.bench) g.add('bench');
  return g;
}

// ───────────────────────── Отбор упражнений ─────────────────────────

export function isEligible(ex: Exercise, p: Profile, level: Level, gear: Set<Gear>): boolean {
  if (!ex.requires.every((r) => gear.has(r))) return false;
  if (levelRank(ex.level) > levelRank(level)) return false;
  if (ex.minPushups !== undefined && p.maxPushups < ex.minPushups) return false;
  if (ex.maxPushups !== undefined && p.maxPushups > ex.maxPushups) return false;
  if (ex.minPullups !== undefined && p.maxPullups < ex.minPullups) return false;
  if (ex.maxPullups !== undefined && p.maxPullups > ex.maxPullups) return false;
  if (ex.impact && (bmi(p) >= 30 || p.age >= 55)) return false;
  // Ограничения по здоровью: упражнение не должно нагружать проблемные зоны
  const lim = p.limitations ?? [];
  if (lim.length) {
    if (ex.stresses?.some((z) => lim.includes(z))) return false;
    if (ex.impact && (lim.includes('knees') || lim.includes('back') || lim.includes('pressure'))) return false;
  }
  // Стул вместо скамьи: лёжа на стуле не позанимаешься
  if (ex.requires.includes('bench') && p.equipment.benchType === 'chair' && ex.chair && !ex.chair.ok) return false;
  return true;
}

/** Похожие двигательные паттерны: чем заменить упражнение, если подходящих в своём нет. */
const RELATED: Record<Pattern, Pattern[]> = {
  squat: ['lunge', 'glutes'],
  lunge: ['squat', 'glutes'],
  hinge: ['glutes'],
  glutes: ['hinge', 'squat'],
  push_h: ['push_v', 'triceps'],
  push_v: ['push_h', 'delts'],
  pull_v: ['pull_h'],
  pull_h: ['pull_v', 'delts'],
  delts: ['push_v', 'pull_h'],
  biceps: ['pull_h', 'pull_v'],
  triceps: ['push_h'],
  calves: ['squat', 'lunge'],
  core: [],
};

/**
 * Чем заменить упражнение: сначала тот же паттерн, потом похожие.
 * Учитывает инвентарь, уровень и ограничения; не предлагает то, что уже есть в тренировке.
 */
export function alternativesFor(exerciseId: string, profile: Profile, level: Level, exclude: string[] = []): Exercise[] {
  const ex = EXERCISES.find((e) => e.id === exerciseId);
  if (!ex) return [];
  const p = sanitizeProfile(profile);
  const gear = availableGear(p);
  const skip = new Set([exerciseId, ...exclude]);
  const out: Exercise[] = [];
  for (const pattern of [ex.pattern, ...RELATED[ex.pattern]]) {
    for (const c of rankCandidates(pattern, p, level, gear)) {
      if (!skip.has(c.id)) {
        out.push(c);
        skip.add(c.id);
      }
    }
  }
  return out;
}

const LOWER: Pattern[] = ['squat', 'hinge', 'lunge', 'calves', 'glutes'];

/** Чем выше — тем предпочтительнее упражнение для данного профиля. */
export function exerciseScore(ex: Exercise, p: Profile): number {
  let s = ex.priority ?? 0;
  const loadBonus = { barbell: 3, dumbbell: 2, band: 1, bodyweight: 0 }[ex.loadType];
  s += loadBonus;
  // Лёгкие нерегулируемые гантели почти бесполезны для ног.
  if (ex.loadType === 'dumbbell' && LOWER.includes(ex.pattern)) {
    const d = p.equipment.dumbbells;
    if (!d.adjustable && d.weightKg * 2 < 8) s -= 4;
  }
  // Для силы и массы веса важнее, для общего фитнеса — меньше.
  if (p.goal === 'fitness' && ex.loadType === 'barbell') s -= 1;
  return s;
}

export function rankCandidates(pattern: Pattern, p: Profile, level: Level, gear: Set<Gear>): Exercise[] {
  return EXERCISES.filter((e) => e.pattern === pattern && isEligible(e, p, level, gear)).sort(
    (a, b) => exerciseScore(b, p) - exerciseScore(a, p) || a.id.localeCompare(b.id)
  );
}

// ───────────────────────── Подходы, повторы, вес ─────────────────────────

const COMPOUND: Pattern[] = ['squat', 'hinge', 'lunge', 'push_h', 'push_v', 'pull_v', 'pull_h'];

interface Scheme {
  sets: number;
  reps: [number, number];
  rest: number;
}

export function scheme(goal: Goal, level: Level, compound: boolean): Scheme {
  const lr = levelRank(level);
  if (goal === 'strength') {
    return compound
      ? { sets: [3, 4, 4][lr], reps: [6, 10], rest: [90, 120, 150][lr] }
      : { sets: 3, reps: [10, 12], rest: 60 };
  }
  if (goal === 'tone') {
    return compound
      ? { sets: [3, 3, 4][lr], reps: [10, 15], rest: [60, 75, 75][lr] }
      : { sets: [2, 3, 3][lr], reps: [12, 15], rest: 45 };
  }
  return compound
    ? { sets: [2, 3, 3][lr], reps: [12, 15], rest: 60 }
    : { sets: 2, reps: [12, 20], rest: 45 };
}

const roundTo = (v: number, step: number) => Math.round(v / step) * step;

/** Стартовый вес: % от заявленного веса гантели / штанги. */
export function suggestWeight(ex: Exercise, p: Profile, level: Level): number | null {
  if (!ex.loadPct) return null;
  let pct = ex.loadPct[levelRank(level)];
  if (p.goal !== 'strength') pct *= 0.85;
  if (ex.loadType === 'dumbbell') {
    const d = p.equipment.dumbbells;
    if (!d.adjustable) return d.weightKg;
    return Math.max(1, Math.min(d.weightKg, roundTo(d.weightKg * pct, 1)));
  }
  if (ex.loadType === 'barbell') {
    const max = p.equipment.barbell.maxKg;
    return Math.max(Math.min(10, max), Math.min(max, roundTo(max * pct, 2.5)));
  }
  return null;
}

/** Максимальный диапазон повторений для упражнений «от максимума». */
export const REPS_CAP = { pushups: [20, 30], pullups: [10, 15] } as const;

export function planExercise(ex: Exercise, p: Profile, level: Level): PlannedExercise {
  const compound = COMPOUND.includes(ex.pattern);
  const sc = scheme(p.goal, level, compound);
  let [repsMin, repsMax] = sc.reps;
  let note: string | undefined;
  const lr = levelRank(level);

  if (ex.isTime) {
    [repsMin, repsMax] = [
      [20, 30],
      [30, 45],
      [45, 60],
    ][lr] as [number, number];
  } else if (ex.repsFrom) {
    const max = ex.repsFrom === 'pushups' ? p.maxPushups : p.maxPullups;
    // Потолок: 40+ отжиманий не превращаются в подходы по 80 — дальше нужен более сложный вариант.
    const [capMin, capMax] = REPS_CAP[ex.repsFrom];
    repsMin = Math.min(capMin, Math.max(ex.repsFrom === 'pullups' ? 1 : 3, Math.round(max * 0.5)));
    repsMax = Math.min(capMax, Math.max(repsMin + 1, Math.round(max * 0.75)));
    note = 'Повторения подобраны от твоего максимума. Оставляй 1–2 повторения «в запасе».';
  } else if (ex.loadType === 'bodyweight' || ex.loadType === 'band') {
    // Без внешнего веса прогресс идёт через повторы.
    if (ex.pattern === 'core') [repsMin, repsMax] = lr === 0 ? [10, 15] : [12, 20];
    else if (ex.id === 'Scapular_Pull-Up') [repsMin, repsMax] = [6, 10];
    else if (ex.id === 'Band_Assisted_Pull-Up') [repsMin, repsMax] = [4, 8];
    else [repsMin, repsMax] = [Math.max(repsMin, 12), Math.max(repsMax, 20)];
    if (ex.loadType === 'band') note = 'Подбери резинку, с которой последние 2 повторения даются тяжело.';
  }

  const weightKg = suggestWeight(ex, p, level);
  if (ex.loadType === 'dumbbell' && !p.equipment.dumbbells.adjustable && ex.loadPct) {
    const ideal = ex.loadPct[lr] * p.equipment.dumbbells.weightKg;
    if (ideal < p.equipment.dumbbells.weightKg * 0.8) {
      note = 'Гантели нерегулируемые: если вес великоват — сделай меньше повторений, но сохрани технику.';
    }
  }

  return {
    exerciseId: ex.id,
    sets: sc.sets,
    repsMin,
    repsMax,
    isTime: !!ex.isTime,
    perSide: !!ex.perSide,
    restSec: sc.rest,
    weightKg,
    note,
  };
}

// ───────────────────────── Сплиты ─────────────────────────

interface Slot {
  patterns: Pattern[]; // основной паттерн и запасные
  variant?: 0 | 1; // 1 = взять второй по рейтингу вариант (для разнообразия A/B)
}

const S = (patterns: Pattern[], variant: 0 | 1 = 0): Slot => ({ patterns, variant });

interface TemplateDef {
  key: string;
  title: string;
  focus: string;
  slots: Slot[];
}

const T: Record<string, TemplateDef> = {
  FA: {
    key: 'FA',
    title: 'Всё тело A',
    focus: 'Присед · жим · тяга',
    slots: [S(['squat']), S(['push_h']), S(['pull_v', 'pull_h']), S(['hinge', 'glutes']), S(['delts', 'push_v']), S(['core'])],
  },
  FB: {
    key: 'FB',
    title: 'Всё тело B',
    focus: 'Наклон · выпад · жим вверх',
    slots: [
      S(['hinge', 'glutes']),
      S(['push_v', 'push_h'], 1),
      S(['pull_h', 'pull_v']),
      S(['lunge', 'squat'], 0),
      S(['glutes', 'calves']),
      S(['core'], 1),
    ],
  },
  FC: {
    key: 'FC',
    title: 'Всё тело C',
    focus: 'Объём и руки',
    slots: [S(['lunge', 'squat'], 1), S(['push_h'], 1), S(['pull_v', 'pull_h'], 1), S(['biceps', 'pull_h']), S(['triceps', 'push_h']), S(['core'])],
  },
  UA: {
    key: 'UA',
    title: 'Верх A',
    focus: 'Грудь · спина · руки',
    slots: [S(['push_h']), S(['pull_v', 'pull_h']), S(['push_v', 'push_h'], 1), S(['pull_h', 'pull_v'], 1), S(['triceps']), S(['biceps', 'delts'])],
  },
  UB: {
    key: 'UB',
    title: 'Верх B',
    focus: 'Плечи · спина · кор',
    slots: [S(['push_v', 'push_h']), S(['pull_h', 'pull_v']), S(['push_h'], 1), S(['pull_v', 'pull_h'], 1), S(['delts']), S(['core'])],
  },
  LA: {
    key: 'LA',
    title: 'Низ A',
    focus: 'Квадрицепсы · ягодицы',
    slots: [S(['squat']), S(['hinge']), S(['lunge']), S(['calves', 'glutes']), S(['core'])],
  },
  LB: {
    key: 'LB',
    title: 'Низ B',
    focus: 'Задняя цепь · баланс',
    slots: [S(['hinge']), S(['squat'], 1), S(['glutes']), S(['lunge'], 1), S(['core'], 1)],
  },
  PUA: {
    key: 'PUA',
    title: 'Жимы A',
    focus: 'Грудь · плечи · трицепс',
    slots: [S(['push_h']), S(['push_v', 'push_h'], 1), S(['delts']), S(['triceps']), S(['core'])],
  },
  PUB: {
    key: 'PUB',
    title: 'Жимы B',
    focus: 'Плечи · грудь · трицепс',
    slots: [S(['push_v', 'push_h']), S(['push_h'], 1), S(['delts'], 1), S(['triceps'], 1), S(['core'], 1)],
  },
  PLA: {
    key: 'PLA',
    title: 'Тяги A',
    focus: 'Спина · бицепс',
    slots: [S(['pull_v', 'pull_h']), S(['pull_h']), S(['delts']), S(['biceps']), S(['core'])],
  },
  PLB: {
    key: 'PLB',
    title: 'Тяги B',
    focus: 'Спина · задняя дельта',
    slots: [S(['pull_h', 'pull_v']), S(['pull_v', 'pull_h'], 1), S(['delts'], 1), S(['biceps'], 1), S(['core'], 1)],
  },
  LGA: {
    key: 'LGA',
    title: 'Ноги A',
    focus: 'Присед · ягодицы',
    slots: [S(['squat']), S(['hinge']), S(['lunge']), S(['glutes']), S(['calves', 'core'])],
  },
  LGB: {
    key: 'LGB',
    title: 'Ноги B',
    focus: 'Наклон · выпады',
    slots: [S(['hinge']), S(['squat'], 1), S(['lunge'], 1), S(['glutes'], 1), S(['core'])],
  },
};

export interface Split {
  name: string;
  templates: string[];
  rotation: string[][];
}

export function chooseSplit(dayCount: number): Split {
  const n = Math.max(MIN_DAYS, Math.min(MAX_DAYS, dayCount));
  switch (n) {
    case 2:
      return { name: 'Всё тело A/B', templates: ['FA', 'FB'], rotation: [['FA', 'FB']] };
    case 3:
      return {
        name: 'Всё тело A/B/A с чередованием',
        templates: ['FA', 'FB'],
        rotation: [
          ['FA', 'FB', 'FA'],
          ['FB', 'FA', 'FB'],
        ],
      };
    case 4:
      return { name: 'Верх / Низ', templates: ['UA', 'LA', 'UB', 'LB'], rotation: [['UA', 'LA', 'UB', 'LB']] };
    case 5:
      return {
        name: 'Верх / Низ + всё тело',
        templates: ['UA', 'LA', 'FC', 'UB', 'LB'],
        rotation: [['UA', 'LA', 'FC', 'UB', 'LB']],
      };
    default:
      return {
        name: 'Жимы / Тяги / Ноги ×2',
        templates: ['PUA', 'PLA', 'LGA', 'PUB', 'PLB', 'LGB'],
        rotation: [['PUA', 'PLA', 'LGA', 'PUB', 'PLB', 'LGB']],
      };
  }
}

export function buildWorkout(def: TemplateDef, p: Profile, level: Level, gear: Set<Gear>): WorkoutTemplate {
  const used = new Set<string>();
  const exercises: PlannedExercise[] = [];
  for (const slot of def.slots) {
    let picked: Exercise | undefined;
    for (const pattern of slot.patterns) {
      const cands = rankCandidates(pattern, p, level, gear).filter((e) => !used.has(e.id));
      if (cands.length === 0) continue;
      picked = cands[Math.min(slot.variant ?? 0, cands.length - 1)];
      break;
    }
    if (picked) {
      used.add(picked.id);
      exercises.push(planExercise(picked, p, level));
    }
  }
  return { key: def.key, title: def.title, focus: def.focus, exercises };
}

function tipsFor(level: Level, goal: Goal, limitations: Limitation[] = [], chair = false): string[] {
  const tips = [
    'Перед тренировкой — 5–7 минут разминки: суставная гимнастика и лёгкое кардио.',
    'Двойная прогрессия: когда во всех подходах выполнишь верхнюю границу повторений — добавь вес или переходи к более сложному варианту.',
    'Последние 1–2 повторения должны даваться тяжело, но без нарушения техники.',
  ];
  if (level === 'beginner') tips.push('Первые 2 недели сосредоточься на технике, а не на весе.');
  if (goal === 'strength') tips.push('Для роста мышц ешь достаточно белка (≈ 1,6 г на кг веса) и спи 7–9 часов.');
  if (goal === 'tone') tips.push('Отдыхай между подходами недолго и проходи 7–10 тысяч шагов в день.');
  if (goal === 'fitness') tips.push('Регулярность важнее интенсивности: не пропускай тренировки.');
  if (limitations.length)
    tips.push('С учётом твоих ограничений часть упражнений исключена. Если что-то вызывает боль — остановись и замени упражнение; при травмах сначала посоветуйся с врачом.');
  if (limitations.includes('pressure')) tips.push('Не задерживай дыхание на усилии: выдох — на самой тяжёлой части движения.');
  if (chair) tips.push('Стул для упражнений — крепкий, без колёсиков, придвинутый спинкой к стене.');
  return tips;
}

/** Меньше упражнений в тренировке — сплит не подходит под инвентарь/уровень. */
export const MIN_EXERCISES = 4;

/**
 * Запасной сплит для 4–6 дней: тренировки на всё тело A/B/C по кругу.
 * Каждую неделю порядок сдвигается, чтобы нагрузка распределялась равномерно.
 */
export function fullBodyFallback(dayCount: number): Split {
  const cycle = ['FA', 'FB', 'FC'];
  const rotation = cycle.map((_, week) => Array.from({ length: dayCount }, (_, i) => cycle[(week * dayCount + i) % 3]));
  return { name: 'Всё тело A/B/C', templates: cycle, rotation };
}

function buildAll(split: Split, p: Profile, level: Level, gear: Set<Gear>): Record<string, WorkoutTemplate> {
  const workouts: Record<string, WorkoutTemplate> = {};
  for (const key of split.templates) workouts[key] = buildWorkout(T[key], p, level, gear);
  return workouts;
}

export function generatePlan(profile: Profile, days: Weekday[], now: Date = new Date()): Plan {
  const p = sanitizeProfile(profile);
  const valid = days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  let sortedDays = [...new Set(valid)].sort((a, b) => a - b) as Weekday[];
  if (sortedDays.length < MIN_DAYS) sortedDays = RECOMMENDED_DAYS;
  if (sortedDays.length > MAX_DAYS) sortedDays = sortedDays.slice(0, MAX_DAYS);
  const level = computeLevel(p);
  const gear = availableGear(p);
  let split = chooseSplit(sortedDays.length);
  let workouts = buildAll(split, p, level, gear);
  // Без инвентаря новичку на сплите «жимы/тяги» или «верх/низ» может достаться 2 упражнения
  // на тренировку — тогда честнее тренировать всё тело A/B/C.
  if (sortedDays.length >= 4 && Object.values(workouts).some((w) => w.exercises.length < MIN_EXERCISES)) {
    split = fullBodyFallback(sortedDays.length);
    workouts = buildAll(split, p, level, gear);
  }
  return {
    level,
    goal: p.goal,
    createdAt: now.toISOString(),
    days: sortedDays,
    workouts,
    rotation: split.rotation,
    splitName: split.name,
    tips: tipsFor(level, p.goal, p.limitations, p.equipment.bench && p.equipment.benchType === 'chair'),
  };
}

// ───────────────────────── Календарь ─────────────────────────

/** День недели 0 = Пн … 6 = Вс. */
export function weekdayOf(d: Date): Weekday {
  return ((d.getDay() + 6) % 7) as Weekday;
}

function mondayOf(d: Date): number {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - weekdayOf(x));
  return x.getTime();
}

export function weekIndex(plan: Pick<Plan, 'createdAt' | 'weekAnchor'>, date: Date): number {
  const diff = mondayOf(date) - mondayOf(new Date(plan.weekAnchor ?? plan.createdAt));
  return Math.max(0, Math.round(diff / (7 * 24 * 3600 * 1000)));
}

/** Тренировка на дату или null, если это день отдыха. */
export function workoutKeyForDate(plan: Plan, date: Date): string | null {
  const idx = plan.days.indexOf(weekdayOf(date));
  if (idx < 0) return null;
  const week = plan.rotation[weekIndex(plan, date) % plan.rotation.length];
  return week[idx] ?? null;
}

export function estimateMinutes(w: WorkoutTemplate): number {
  const sec = w.exercises.reduce((acc, e) => {
    const work = e.isTime ? e.repsMax : e.repsMax * 3;
    return acc + e.sets * (work * (e.perSide ? 2 : 1) + e.restSec);
  }, 0);
  return Math.round(sec / 60) + 5;
}

export function formatTarget(e: PlannedExercise): string {
  const unit = e.isTime ? 'сек' : 'повт.';
  const range = e.repsMin === e.repsMax ? `${e.repsMin}` : `${e.repsMin}–${e.repsMax}`;
  return `${e.sets} × ${range} ${unit}${e.perSide ? ' на сторону' : ''}`;
}

/** Русское склонение: plural(5, 'упражнение', 'упражнения', 'упражнений') → «5 упражнений». */
export function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  const word = a > 10 && a < 20 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many;
  return `${n} ${word}`;
}

export const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;
export const WEEKDAY_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'] as const;
