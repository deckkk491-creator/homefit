// Общие типы приложения HomeFit.

export type Sex = 'male' | 'female' | 'unspecified';
export type Goal = 'strength' | 'tone' | 'fitness';
export type Level = 'beginner' | 'intermediate' | 'advanced';

/** 0 = понедельник … 6 = воскресенье */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Травмы и ограничения, которые учитываются при подборе упражнений. */
export type Limitation = 'knees' | 'back' | 'shoulders' | 'wrists' | 'neck' | 'pressure';

/** Ручная поправка сложности: -1 — легче, 0 — как рассчитано, 1 — тяжелее. */
export type Difficulty = -1 | 0 | 1;

/** Инвентарь, который может требоваться упражнению. */
export type Gear = 'bar' | 'dumbbells' | 'barbell' | 'bands' | 'bench';

export interface Equipment {
  /** Турник */
  pullupBar: boolean;
  dumbbells: { has: boolean; weightKg: number; adjustable: boolean };
  barbell: { has: boolean; maxKg: number };
  bands: boolean;
  /** Скамья или устойчивый стул */
  bench: boolean;
  /** Что именно есть: скамья или стул (у стула меньше вариантов — лёжа на нём не позанимаешься) */
  benchType?: 'bench' | 'chair';
}

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  maxPushups: number;
  maxPullups: number;
  equipment: Equipment;
  /** Травмы и ограничения (опросник) */
  limitations?: Limitation[];
  /** Поправка сложности плана */
  difficulty?: Difficulty;
}

/** Двигательный паттерн — «слот» в тренировке. */
export type Pattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'push_h'
  | 'push_v'
  | 'pull_v'
  | 'pull_h'
  | 'core'
  | 'biceps'
  | 'triceps'
  | 'delts'
  | 'calves'
  | 'glutes';

export type LoadType = 'bodyweight' | 'dumbbell' | 'barbell' | 'band';

export interface Exercise {
  id: string;
  name: string;
  pattern: Pattern;
  loadType: LoadType;
  /** Весь инвентарь, без которого упражнение не выполнить. */
  requires: Gear[];
  level: Level;
  muscles: string[];
  steps: string[];
  mistakes: string[];
  /** Выполняется на время (секунды), а не на повторы. */
  isTime?: boolean;
  /** Выполняется на каждую сторону. */
  perSide?: boolean;
  /** Доля от доступного веса (гантель/штанга) для beginner/intermediate/advanced. */
  loadPct?: [number, number, number];
  /** Ограничения по текущей подготовке. */
  minPushups?: number;
  maxPushups?: number;
  minPullups?: number;
  maxPullups?: number;
  /** Прыжковое / ударное упражнение. */
  impact?: boolean;
  /** Чем больше — тем охотнее генератор выбирает упражнение при прочих равных. */
  priority?: number;
  /** Повторы считаются от максимума отжиманий/подтягиваний. */
  repsFrom?: 'pushups' | 'pullups';
  /** Нагружает эти зоны — исключается при соответствующих ограничениях. */
  stresses?: Limitation[];
  /** Вариант со стулом вместо скамьи: ok=false — на стуле делать нельзя (будет замена). */
  chair?: { ok: boolean; steps?: string[]; tip?: string };
}

export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  isTime: boolean;
  perSide: boolean;
  restSec: number;
  /** Рекомендуемый стартовый вес, кг (на одну гантель / общий вес штанги). */
  weightKg: number | null;
  note?: string;
}

export interface WorkoutTemplate {
  key: string;
  title: string;
  focus: string;
  exercises: PlannedExercise[];
}

export interface Plan {
  level: Level;
  goal: Goal;
  createdAt: string;
  /** Начало отсчёта недель (ISO). Сохраняется при пересоздании плана, чтобы не сбрасывать «Неделю N» и чередование. */
  weekAnchor?: string;
  days: Weekday[];
  workouts: Record<string, WorkoutTemplate>;
  /** Чередование недель: rotation[неделя % length][индекс тренировочного дня] = ключ тренировки. */
  rotation: string[][];
  splitName: string;
  tips: string[];
}

export interface WorkoutLog {
  id: string;
  date: string; // ISO
  workoutKey: string;
  title: string;
  durationMin: number;
  setsDone: number;
  setsTotal: number;
}
