import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Pressable, ScrollView } from 'react-native';

import { Card, Gap, SectionLabel, T } from '@/components/ui';
import { EXERCISES } from '@/data/exercises';
import { space, useTheme } from '@/theme';

export default function About() {
  const t = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: space.lg, paddingBottom: 64 }}>
      <T variant="h1">HomeFit</T>
      <T color={t.textMuted}>Версия {version}</T>
      <Gap h={space.lg} />
      <T>
        Домашние тренировки по персональному плану. План составляется прямо на устройстве по твоей анкете — без
        интернета, регистрации и передачи данных. Все данные хранятся только на телефоне.
      </T>

      <SectionLabel>Фотографии упражнений</SectionLabel>
      <Card>
        <T>
          Фотографии {EXERCISES.length} упражнений взяты из открытой базы Free Exercise DB (автор — yuhonas),
          распространяемой как общественное достояние по лицензии The Unlicense.
        </T>
        <Gap h={space.sm} />
        <Pressable
          accessibilityRole="link"
          style={{ minHeight: 44, justifyContent: 'center' }}
          onPress={() => Linking.openURL('https://github.com/yuhonas/free-exercise-db')}>
          <T variant="bodyStrong" color={t.accentStrong}>
            github.com/yuhonas/free-exercise-db
          </T>
        </Pressable>
      </Card>

      <SectionLabel>Здоровье</SectionLabel>
      <Card tone="alt">
        <T>
          Приложение не является медицинской консультацией. Перед началом тренировок посоветуйся с врачом, особенно
          при хронических заболеваниях, травмах или беременности. Прекрати упражнение при боли или плохом
          самочувствии.
        </T>
      </Card>

      <SectionLabel>Как работает план</SectionLabel>
      <Card>
        <T>
          • Уровень определяется по максимуму отжиманий и подтягиваний, с поправкой на ИМТ и возраст.{'\n'}• Упражнения
          подбираются под твой инвентарь: сначала базовые многосуставные.{'\n'}• 2–3 дня — всё тело, 4 — верх/низ, 5 —
          верх/низ + всё тело, 6 — жимы/тяги/ноги.{'\n'}• Стартовый вес — процент от веса твоих гантелей или штанги.
        </T>
      </Card>
    </ScrollView>
  );
}
