// Разбор и форматирование чисел для полей ввода (чистые функции, покрыты тестами).

/**
 * Разбор числа из поля ввода: принимает запятую и точку, пробелы.
 * Пустая строка и мусор → null (значение не меняем).
 */
export function parseNumberInput(s: string): number | null {
  const norm = s.replace(/\s/g, '').replace(',', '.');
  if (norm === '' || norm === '.' || norm === '-') return null;
  const n = Number(norm);
  return Number.isFinite(n) ? n : null;
}

/** Ограничение диапазоном и округление: целые шаги — до целого, дробные — до 0,1. */
export function clampStep(v: number, min: number, max: number, step: number): number {
  const rounded = Number.isInteger(step) ? Math.round(v) : Math.round(v * 10) / 10;
  return Math.max(min, Math.min(max, rounded));
}

/** Число для поля ввода в русском формате: 75.5 → «75,5». */
export function formatNumber(v: number): string {
  return String(v).replace('.', ',');
}
