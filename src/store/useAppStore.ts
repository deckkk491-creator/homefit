import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { generatePlan, RECOMMENDED_DAYS } from '@/lib/planGenerator';
import type { Plan, Profile, Weekday, WorkoutLog } from '@/lib/types';

export const DEFAULT_PROFILE: Profile = {
  sex: 'unspecified',
  age: 30,
  heightCm: 175,
  weightKg: 75,
  goal: 'strength',
  maxPushups: 10,
  maxPullups: 0,
  equipment: {
    pullupBar: false,
    dumbbells: { has: false, weightKg: 10, adjustable: true },
    barbell: { has: false, maxKg: 40 },
    bands: false,
    bench: false,
  },
};

/** Прогресс текущей (незавершённой) тренировки. */
export interface ActiveSession {
  /** YYYY-MM-DD */
  date: string;
  workoutKey: string;
  startedAt: string;
  /** exerciseIndex → массив отмеченных подходов */
  done: Record<number, boolean[]>;
}

interface AppState {
  hydrated: boolean;
  disclaimerAccepted: boolean;
  onboarded: boolean;
  profile: Profile;
  days: Weekday[];
  plan: Plan | null;
  logs: WorkoutLog[];
  session: ActiveSession | null;

  setHydrated: () => void;
  acceptDisclaimer: () => void;
  setProfile: (p: Profile) => void;
  setDays: (d: Weekday[]) => void;
  regenerate: () => void;
  completeOnboarding: () => void;
  startSession: (date: string, workoutKey: string) => void;
  toggleSet: (exerciseIndex: number, setIndex: number, totalSets: number) => void;
  finishSession: (log: Omit<WorkoutLog, 'id'>) => void;
  discardSession: () => void;
  deleteLog: (id: string) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      disclaimerAccepted: false,
      onboarded: false,
      profile: DEFAULT_PROFILE,
      days: RECOMMENDED_DAYS,
      plan: null,
      logs: [],
      session: null,

      setHydrated: () => set({ hydrated: true }),
      acceptDisclaimer: () => set({ disclaimerAccepted: true }),
      setProfile: (profile) => set({ profile }),
      setDays: (days) => set({ days }),
      regenerate: () => {
        // Журнал (logs) не трогаем. Сессию сбрасываем: номера упражнений в новом плане другие.
        const { profile, days, plan: prev } = get();
        const next = generatePlan(profile, days);
        if (prev) next.weekAnchor = prev.weekAnchor ?? prev.createdAt;
        set({ plan: next, session: null });
      },
      completeOnboarding: () => {
        const { profile, days } = get();
        set({ plan: generatePlan(profile, days), onboarded: true, session: null });
      },
      startSession: (date, workoutKey) => {
        const s = get().session;
        if (s && s.date === date && s.workoutKey === workoutKey) return;
        set({ session: { date, workoutKey, startedAt: new Date().toISOString(), done: {} } });
      },
      toggleSet: (ei, si, total) => {
        const s = get().session;
        if (!s) return;
        const row = [...(s.done[ei] ?? Array<boolean>(total).fill(false))];
        row[si] = !row[si];
        set({ session: { ...s, done: { ...s.done, [ei]: row } } });
      },
      finishSession: (log) => {
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        set({ logs: [{ ...log, id }, ...get().logs], session: null });
      },
      discardSession: () => set({ session: null }),
      deleteLog: (id) => set({ logs: get().logs.filter((l) => l.id !== id) }),
      resetAll: () =>
        set({
          disclaimerAccepted: false,
          onboarded: false,
          profile: DEFAULT_PROFILE,
          days: RECOMMENDED_DAYS,
          plan: null,
          logs: [],
          session: null,
        }),
    }),
    {
      name: 'homefit-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _h, ...rest }) => rest,
      // Даже при ошибке чтения хранилища показываем приложение, а не вечный сплэш.
      onRehydrateStorage: () => () => useAppStore.setState({ hydrated: true }),
    }
  )
);

export function todayKey(d: Date = new Date()): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
