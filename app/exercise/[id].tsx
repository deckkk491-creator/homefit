import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { Card, Gap, Pill, Row, SectionLabel, T } from '@/components/ui';
import { EXERCISE_IMAGES } from '@/data/exerciseImages';
import { GEAR_LABELS, getExercise, LEVEL_LABELS } from '@/data/exercises';
import { radius, space, useTheme } from '@/theme';

const CAPTIONS = ['Исходное положение', 'Конечное положение'];

export default function ExerciseDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ex = getExercise(String(id));
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);

  if (!ex) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, padding: space.lg }}>
        <T>Упражнение не найдено.</T>
      </View>
    );
  }

  const images = EXERCISE_IMAGES[ex.id] ?? [];
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

      <SectionLabel>Техника</SectionLabel>
      <Card>
        {ex.steps.map((s, i) => (
          <Row key={i} gap={space.md} style={{ alignItems: 'flex-start', marginBottom: i < ex.steps.length - 1 ? space.lg : 0 }}>
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
