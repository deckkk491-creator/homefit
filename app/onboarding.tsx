import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  BodyFields,
  DayPicker,
  EquipmentFields,
  GoalFields,
  LevelFields,
} from '@/components/ProfileFields';
import { Button, Gap, Row, Screen, T } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { radius, space, useTheme } from '@/theme';

const STEPS = [
  { title: 'Расскажи о себе', hint: 'Это поможет точнее подобрать нагрузку.' },
  { title: 'Твоя цель', hint: 'От цели зависят подходы, повторения и отдых.' },
  { title: 'Текущий уровень', hint: 'Честный ответ — безопасный старт.' },
  { title: 'Инвентарь дома', hint: 'Отметь всё, что есть под рукой.' },
  { title: 'Дни тренировок', hint: 'Выбери дни недели для занятий.' },
];

export default function Onboarding() {
  const t = useTheme();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const days = useAppStore((s) => s.days);
  const setDays = useAppStore((s) => s.setDays);
  const complete = useAppStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <View style={{ padding: space.lg, paddingTop: space.sm }}>
          <Button
            title={last ? 'Составить план' : 'Далее'}
            icon={last ? 'sparkles' : 'arrow-forward'}
            onPress={() => (last ? complete() : setStep(step + 1))}
          />
        </View>
      }>
      <Row style={{ justifyContent: 'space-between', minHeight: 44 }}>
        {step > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Назад"
            hitSlop={12}
            onPress={() => setStep(step - 1)}
            style={{ width: 44, height: 44, justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={28} color={t.text} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <T variant="label" color={t.textMuted}>
          Шаг {step + 1} из {STEPS.length}
        </T>
        <View style={{ width: 44 }} />
      </Row>
      <Row gap={6} style={{ marginTop: space.sm }}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: i <= step ? t.accent : t.surfaceAlt,
            }}
          />
        ))}
      </Row>
      <Gap h={space.xl} />
      <T variant="h1">{STEPS[step].title}</T>
      <Gap h={space.xs} />
      <T color={t.textMuted}>{STEPS[step].hint}</T>
      <Gap h={space.xl} />
      {step === 0 && <BodyFields profile={profile} onChange={setProfile} />}
      {step === 1 && <GoalFields profile={profile} onChange={setProfile} />}
      {step === 2 && <LevelFields profile={profile} onChange={setProfile} />}
      {step === 3 && <EquipmentFields profile={profile} onChange={setProfile} />}
      {step === 4 && <DayPicker days={days} onChange={setDays} />}
    </Screen>
  );
}
