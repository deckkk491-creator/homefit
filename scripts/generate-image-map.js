// Генерирует src/data/exerciseImages.ts со статическими импортами фото для Metro.
// Запуск: node scripts/generate-image-map.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'assets', 'exercises');
const ids = fs
  .readdirSync(dir)
  .filter((d) => fs.statSync(path.join(dir, d)).isDirectory())
  .sort();

const v = (id) => 'i_' + id.replace(/[^A-Za-z0-9]/g, '_');
const lines = [
  '// Файл сгенерирован scripts/generate-image-map.js — не редактируйте вручную.',
  '// Фото: free-exercise-db (github.com/yuhonas/free-exercise-db), лицензия Unlicense (public domain).',
  ...ids.flatMap((id) => [
    `import ${v(id)}_0 from '../../assets/exercises/${id}/0.jpg';`,
    `import ${v(id)}_1 from '../../assets/exercises/${id}/1.jpg';`,
  ]),
  '',
  'export const EXERCISE_IMAGES: Record<string, [number, number]> = {',
  ...ids.map((id) => `  '${id}': [${v(id)}_0, ${v(id)}_1],`),
  '};',
  '',
];
fs.writeFileSync(path.join(root, 'src', 'data', 'exerciseImages.ts'), lines.join('\n'));
console.log(`OK: ${ids.length} exercises`);
