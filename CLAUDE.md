# HomeFit — заметки для Claude

Приложение для домашних тренировок под iOS (App Store). Владелец: deckkk491-creator.

## Стек и сборка
- Expo SDK 58, expo-router 58, React Native 0.88, React 19.3, TypeScript 6 strict, zustand + AsyncStorage.
- Всё хранится только на устройстве: нет сервера, аккаунтов и внешнего ИИ.
- Сборка только в облаке EAS: у владельца MacBook Air 2019, Xcode 26 на нём не ставится. App Store с 28.04.2026 требует Xcode 26 / iOS 26 SDK.
- Bundle ID: `com.deckkk491.homefit`.
- CI (`.github/workflows/ci.yml`): npm install, tsc, jest, expo-doctor, expo export ios. CI должен оставаться зелёным.

## Где что лежит
- `src/lib/planGenerator.ts` — генератор плана (детерминированный, покрыт тестами в `__tests__/`).
- `src/data/exercises.ts` — 61 упражнение. Фото из free-exercise-db (Unlicense) встроены в `assets/exercises/`. Карту фото генерирует `scripts/generate-image-map.js`.
- `docs/` — GitHub Pages: политика конфиденциальности и поддержка (https://deckkk491-creator.github.io/homefit/).
- `store/` — тексты для App Store Connect (RU/EN), ответы по App Privacy, заметки для ревью, план скриншотов.

## Правила
- Тексты в приложении на русском, обращение на «ты». В описании для App Store — на «вы».
- Рекомендация по умолчанию: 3 тренировки в неделю через день.
- Коммиты от имени deckkk491-creator <deckkk491@gmail.com>.

## Следующие шаги
1. Открыть в Expo Go на iPhone и проверить экраны в светлой и тёмной теме.
2. `package-lock.json` закоммичен (SDK 58). Тесты — babel-jest без пресета jest-expo.
3. Оплатить Apple Developer Program, затем `eas init`, `eas build -p ios --profile production` и `eas submit -p ios --latest`.
4. Скриншоты 6.9" (1320×2868) по `store/screenshots-plan.md`.
5. Проверить уведомление «Отдых окончен» (`src/lib/restNotification.ts`): отметить подход, заблокировать телефон — по окончании отдыха придёт уведомление. Разрешение спрашивается при первом запуске таймера.
