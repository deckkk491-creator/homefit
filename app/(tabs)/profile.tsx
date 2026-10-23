import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { BodyFields, DayPicker, EquipmentFields, GoalFields, LevelFields } from '@/components/ProfileFields';
import { Button, Card, Gap, Row, Screen, SectionLabel, T } from '@/components/ui';
import { LEVEL_LABELS } from '@/data/exercises';
import { computeLevel } from '@/lib/planGenerator';
import type { Profile, Weekday } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import { space, useTheme } from '@/theme';

export default function ProfileScreen() {
  const t = useTheme();
  const saved = useAppStore((s) => s.profile);
  const savedDays = useAppStore((s) => s.days);
  const setProfile = useAppStore((s) => s.setProfile);
  const setDays = useAppStore((s) => s.setDays);
  const regenerate = useAppStore((s) => s.regenerate);
  const resetAll = useAppStore((s) => s.resetAll);

  // Черновик: изменения применяются только по кнопке «Пересоздать план».
  const [draft, setDraft] = useState<Profile>(saved);
  const [days, setDraftDays] = useState<Weekday[]>(savedDays);
  useEffect(() => setDraft(saved), [saved]);
  useEffect(() => setDraftDays(savedDays), [savedDays]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved) || days.join() !== savedDays.join();

  const apply = () => {
    setProfile(draft);
    setDays(days);
    regenerate();
    Alert.alert('План обновлён', `Уровень: ${LEVEL_LABELS[computeLevel(draft)]}. Загляни на вкладку «План».`);
  };

  return (
    <Screen>
      <T variant="display">Профиль</T>
      <Gap h={space.sm} />
      <T color={t.textMuted}>Измени данные и пересоздай план — например, когда станешь сильнее или купишь гантели.</T>
      <Gap h={space.lg} />
      <Card tone="alt">
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="bodyStrong">Расчётный уровень</T>
          <T variant="h3" color={t.accentStrong}>
            {LEVEL_LABELS[computeLevel(draft)]}
          </T>
        </Row>
      </Card>

      <SectionLabel>О себе</SectionLabel>
      <BodyFields profile={draft} onChange={setDraft} />
      <SectionLabel>Цель</SectionLabel>
      <GoalFields profile={draft} onChange={setDraft} />
      <SectionLabel>Уровень</SectionLabel>
      <LevelFields profile={draft} onChange={setDraft} />
      <SectionLabel>Инвентарь</SectionLabel>
      <EquipmentFields profile={draft} onChange={setDraft} />
      <SectionLabel>Дни тренировок</SectionLabel>
      <DayPicker days={days} onChange={setDraftDays} />

      <Gap h={space.xl} />
      <Button title={dirty ? 'Сохранить и пересоздать план' : 'Пересоздать план'} icon="refresh" onPress={apply} />
      <Gap h={space.xl} />

      <Card onPress={() => router.push('/health')} style={{ marginBottom: space.sm }}>
        <Row gap={space.md}>
          <Ionicons name="medkit-outline" size={24} color={t.text} />
          <T variant="bodyStrong" style={{ flex: 1 }}>
            Здоровье и безопасность
          </T>
          <Ionicons name="chevron-forward" size={20} color={t.textFaint} />
        </Row>
      </Card>
      <Card onPress={() => router.push('/about')}>
        <Row gap={space.md}>
          <Ionicons name="information-circle-outline" size={24} color={t.text} />
          <T variant="bodyStrong" style={{ flex: 1 }}>
            О приложении
          </T>
          <Ionicons name="chevron-forward" size={20} color={t.textFaint} />
        </Row>
      </Card>
      <Gap h={space.md} />
      <Button
        title="Сбросить все данные"
        variant="danger"
        onPress={() =>
          Alert.alert('Сбросить все данные?', 'Профиль, план и журнал тренировок будут удалены.', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Сбросить', style: 'destructive', onPress: resetAll },
          ])
        }
      />
    </Screen>
  );
}
