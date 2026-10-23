import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Row, T } from '@/components/ui';
import { EXERCISE_IMAGES } from '@/data/exerciseImages';
import { radius, space, type as typo, useTheme } from '@/theme';

export function ExerciseThumb({ id, size = 64 }: { id: string; size?: number }) {
  const t = useTheme();
  const img = EXERCISE_IMAGES[id];
  return (
    <View style={{ width: size, height: size, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: t.surfaceAlt }}>
      {img ? (
        <Image source={img[1]} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : null}
    </View>
  );
}

/** Кнопки-подходы: нажатие отмечает подход выполненным. */
export function SetBoxes({
  total,
  done,
  onToggle,
}: {
  total: number;
  done: boolean[];
  onToggle: (i: number) => void;
}) {
  const t = useTheme();
  return (
    <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
      {Array.from({ length: total }, (_, i) => {
        const on = !!done[i];
        return (
          <Pressable
            key={i}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`Подход ${i + 1}`}
            onPress={() => onToggle(i)}
            style={({ pressed }) => [
              styles.set,
              {
                backgroundColor: on ? t.accent : t.surfaceAlt,
                borderColor: on ? t.accent : t.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            {on ? (
              <Ionicons name="checkmark" size={22} color={t.accentInk} />
            ) : (
              <T variant="bodyStrong" color={t.textMuted}>
                {i + 1}
              </T>
            )}
          </Pressable>
        );
      })}
    </Row>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Плавающий таймер отдыха. Запускается извне через `startKey` (меняется при каждом старте). */
export function RestTimer({
  seconds,
  startKey,
  onClose,
}: {
  seconds: number;
  startKey: number;
  onClose: () => void;
}) {
  const t = useTheme();
  const [endAt, setEndAt] = useState(() => Date.now() + seconds * 1000);
  const [left, setLeft] = useState(seconds);
  const buzzed = useRef(false);

  useEffect(() => {
    setEndAt(Date.now() + seconds * 1000);
    setLeft(seconds);
    buzzed.current = false;
  }, [startKey, seconds]);

  useEffect(() => {
    const id = setInterval(() => {
      const l = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setLeft(l);
      if (l === 0 && !buzzed.current) {
        buzzed.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
    }, 250);
    return () => clearInterval(id);
  }, [endAt]);

  const progress = seconds > 0 ? 1 - left / seconds : 1;
  const finished = left === 0;

  return (
    <View style={[styles.timer, { backgroundColor: finished ? t.accent : t.text }]}>
      <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: finished ? t.accent : t.accent + '33' }]} />
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <T variant="label" color={finished ? t.accentInk : t.bg} style={{ opacity: 0.7 }}>
            {finished ? 'Отдых окончен' : 'Отдых'}
          </T>
          <T style={[typo.h1, { fontVariant: ['tabular-nums'] }]} color={finished ? t.accentInk : t.bg}>
            {finished ? 'Следующий подход' : fmt(left)}
          </T>
        </View>
        <Row gap={space.sm}>
          {!finished ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Добавить 15 секунд"
              onPress={() => setEndAt(endAt + 15000)}
              style={[styles.timerBtn, { borderColor: t.bg + '55' }]}>
              <T variant="bodyStrong" color={t.bg}>
                +15
              </T>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрыть таймер"
            onPress={onClose}
            style={[styles.timerBtn, { borderColor: (finished ? t.accentInk : t.bg) + '55' }]}>
            <Ionicons name="close" size={22} color={finished ? t.accentInk : t.bg} />
          </Pressable>
        </Row>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  set: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    borderRadius: radius.lg,
    padding: space.lg,
    overflow: 'hidden',
  },
  timerFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  timerBtn: {
    minWidth: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
});
