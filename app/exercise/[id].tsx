import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { Card, Gap, Pill, Row, SectionLabel, T } from '@/components/ui';
import { EXERCISE_IMAGES } from '@/data/exerciseImages';
import { GEAR_LABELS, getExercise, LEVEL_LABELS } from '@/data/exercises';
import { useAppStore } from '@/store/useAppStore';
import { radius, space, useTheme } from '@/theme';

const CAPTIONS = ['Исходное положение', 'Конечное положение'];

export default function ExerciseDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ex = getExercise(String(id));
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const benchType = useAppStore((s) => s.profile.equipment.benchType);
  // Скамья или стул: по умолчанию — то, что у пользователя
  const [variant, setVariant] = useState<'bench' | 'chair'>(benchType === 'chair' ? 'chair' : 'bench');

  if (!ex) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, padding: space.lg }}>
        <T>Упражнение не найдено.</T>
      </View>
    );
  }

  const images = EXERCISE_IMAGES[ex.id] ?? [];
  const chairMode = !!ex.chair && variant === 'chair';
  const steps = chairMode && ex.chair?.ok && ex.chair.steps ? ex.chair.steps : ex.steps;
  const imgW = width - space.lg * 2;
  const imgH = Math.round(imgW * 0.667);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / imgW));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: space.lg, paddingBottom: 64 }}>
      <Stack.Screen options={{ title: '' }} />
      <T variant="h1">{ex.name}</T>
      <Gap h={space.md} />
      <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
        <Pill label={LEVEL_LABELS[ex.level]} tone="accent" />
        {ex.requires.length ? ex.requires.map((g) => <Pill key={g} label={GEAR_LABELS[g]} />) : <Pill label="Без инвентаря" />}
      </Row>
      <Gap h={space.lg} />
      {ex.chair ? (
        <View style={{ flexDirection: 'row', backgroundColor: t.surfaceAlt, borderRadius: radius.pill, padding: 4, marginBottom: space.lg }}>
          {(['bench', 'chair'] as const).map((v) => {
            const on = variant === v;
            return (
              <Pressable
                key={v}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setVariant(v)}
                style={{ flex: 1, minHeight: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.surface : 'transparent' }}>
                <T variant="bodyStrong" color={on ? t.text : t.textMuted}>
                  {v === 'bench' ? 'На скамье' : 'На стуле'}
                </T>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* Карусель: старт / финиш */}
      <View style={{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: t.photoBg }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}>
          {images.map((src, i) => (
            <Image
              key={i}
              source={src}
              style={{ width: imgW, height: imgH }}
              resizeMode="contain"
              accessibilityLabel={`${ex.name}: ${CAPTIONS[i]}`}
            />
          ))}
        </ScrollView>
      </View>
      <Gap h={space.sm} />
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="small" color={t.textMuted}>
          {CAPTIONS[page] ?? ''}
        </T>
        <Row gap={6}>
          {images.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === page ? 22 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === page ? t.accentStrong : t.border,
              }}
            />
          ))}
        </Row>
      </Row>

      <SectionLabel>Мышцы</SectionLabel>
      <T variant="bodyStrong">{ex.muscles.join(' · ')}</T>

      {chairMode && ex.chair && !ex.chair.ok ? (
        <>
          <Gap h={space.lg} />
          <Card tone="alt">
            <T variant="bodyStrong">На стуле это упражнение не делают</T>
            <Gap h={space.xs} />
            <T color={t.textMuted}>
              Лёжа на стуле легко упасть. Если у тебя стул, план подберёт замену автоматически: например, вариант на полу.
            </T>
          </Card>
        </>
      ) : null}
      {chairMode && ex.chair?.ok && ex.chair.tip ? (
        <>
          <Gap h={space.lg} />
          <Card tone="alt">
            <T variant="bodyStrong">🪑 Вариант со стулом</T>
            <Gap h={space.xs} />
            <T color={t.textMuted}>{ex.chair.tip} На фото — скамья, движение то же.</T>
          </Card>
        </>
      ) : null}

      <SectionLabel>{chairMode && ex.chair?.ok && ex.chair.steps ? 'Техника на стуле' : 'Техника'}</SectionLabel>
      <Card>
        {steps.map((s, i) => (
          <Row key={i} gap={space.md} style={{ alignItems: 'flex-start', marginBottom: i < steps.length - 1 ? space.lg : 0 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: t.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <T variant="bodyStrong" color={t.accentInk}>
                {i + 1}
              </T>
            </View>
            <T style={{ flex: 1 }}>{s}</T>
          </Row>
        ))}
      </Card>

      <SectionLabel>Частые ошибки</SectionLabel>
      <Card tone="alt">
        {ex.mistakes.map((m, i) => (
          <Row key={i} gap={space.md} style={{ alignItems: 'flex-start', marginBottom: i < ex.mistakes.length - 1 ? space.md : 0 }}>
            <T variant="bodyStrong" color={t.danger}>
              ✕
            </T>
            <T style={{ flex: 1 }}>{m}</T>
          </Row>
        ))}
      </Card>

      <Gap h={space.lg} />
      <T variant="small" color={t.textMuted}>
        Фото: free-exercise-db (общественное достояние).
      </T>
    </ScrollView>
  );
}
