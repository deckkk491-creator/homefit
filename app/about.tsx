import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Card, Gap, type IconName, Row, SectionLabel, T } from '@/components/ui';
import { EXERCISES } from '@/data/exercises';
import { PRIVACY_URL, SUPPORT_EMAIL, SUPPORT_URL } from '@/data/legal';
import { space, useTheme } from '@/theme';

/** Строка-ссылка в группе: иконка, подпись, шеврон; высота ≥ 44 pt. */
function LinkRow({
  icon,
  label,
  onPress,
  role = 'link',
  last,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  role?: 'link' | 'button';
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole={role}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 52,
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: t.border,
      })}>
      <Row gap={space.md}>
        <Ionicons name={icon} size={22} color={t.text} />
        <T variant="bodyStrong" style={{ flex: 1 }}>
          {label}
        </T>
        <Ionicons name={role === 'link' ? 'open-outline' : 'chevron-forward'} size={20} color={t.textFaint} />
      </Row>
    </Pressable>
  );
}

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
        интернета, регистрации и передачи данных. Все данные хранятся только на телефоне. Удалить их можно в
        «Профиле» кнопкой «Сбросить все данные» или удалив приложение.
      </T>

      <SectionLabel>Документы и поддержка</SectionLabel>
      <Card style={{ paddingVertical: 0 }}>
        <LinkRow icon="medkit-outline" label="Здоровье и безопасность" role="button" onPress={() => router.push('/health')} />
        <LinkRow icon="shield-checkmark-outline" label="Политика конфиденциальности" onPress={() => Linking.openURL(PRIVACY_URL)} />
        <LinkRow icon="help-buoy-outline" label="Поддержка" onPress={() => Linking.openURL(SUPPORT_URL)} />
        <LinkRow
          icon="mail-outline"
          label={SUPPORT_EMAIL}
          last
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=HomeFit`)}
        />
      </Card>

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
        <Gap h={space.sm} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/health')}
          style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
          <T variant="bodyStrong" color={t.accentStrong}>
            Подробнее
          </T>
        </Pressable>
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
