import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Миллисекунды до ближайшей локальной полуночи (+1 с запаса). */
export function msUntilMidnight(d: Date): number {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return next.getTime() - d.getTime() + 1000;
}

/**
 * Текущая дата, которая обновляется в полночь и при возврате приложения из фона.
 * Без этого экран «Сегодня», открытый вчера, показывал бы вчерашнюю тренировку.
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setTimeout(() => setNow(new Date()), msUntilMidnight(now));
    return () => clearTimeout(id);
  }, [now]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setNow(new Date());
    });
    return () => sub.remove();
  }, []);

  return now;
}
