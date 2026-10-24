import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Row, T } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';

type Phase = 'ready' | 'countdown' | 'hold' | 'done';

const PREP = 3;

/**
 * Таймер удержания для упражнений «на время» (планка, боковая планка):
 * отсчёт 3-2-1, затем обратный отсчёт целевого времени с вибрацией на последних секундах.
 * По окончании вызывает onDone — подход отмечается выполненным и запускается отдых.
 */
export function HoldTimer({
  visible,
  title,
  setLabel,
  targetSec,
  minSec,
  maxSec,
  onDone,
  onClose,
}: {
  visible: boolean;
  title: string;
  setLabel: string;
  targetSec: number;
  minSec: number;
  maxSec: number;
  onDone: (heldSec: number) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [goal, setGoal] = useState(targetSec);
  const [phase, setPhase] = useState<Phase>('ready');
  const [left, setLeft] = useState(targetSec);
  const [prep, setPrep] = useState(PREP);
  const endAt = useRef(0);
  const startedAt = useRef(0);

  useEffect(() => {
    if (!visible) return;
    setGoal(targetSec);
    setLeft(targetSec);
    setPhase('ready');
    setPrep(PREP);
  }, [visible, targetSec]);

  // Отсчёт перед стартом
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (prep <= 0) {
      startedAt.current = Date.now();
      endAt.current = Date.now() + goal * 1000;
      setLeft(goal);
      setPhase('hold');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    const id = setTimeout(() => setPrep((p) => p - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, prep, goal]);

  // Удержание: считаем от времени окончания, а не по тикам — так точнее
  useEffect(() => {
    if (phase !== 'hold') return;
    let last = -1;
    const id = setInterval(() => {
      const l = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      if (l !== last) {
        last = l;
        setLeft(l);
        if (l > 0 && l <= 3) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      }
      if (l === 0) {
        clearInterval(id);
        setPhase('done');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  const held = phase === 'hold' ? Math.round((Date.now() - startedAt.current) / 1000) : goal;
  const progress = phase === 'hold' ? 1 - left / goal : phase === 'done' ? 1 : 0;
  const big = phase === 'countdown' ? String(prep) : phase === 'ready' ? `${goal}` : `${left}`;

  const stopEarly = () => {
    // Остановился раньше — засчитываем то, что выстоял, если это хотя бы половина цели
    const sec = Math.round((Date.now() - startedAt.current) / 1000);
    setPhase('ready');
    setLeft(goal);
    if (sec >= Math.ceil(goal / 2)) onDone(sec);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: phase === 'hold' || phase === 'done' ? t.accent : t.bg, paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.lg }}>
        <Row style={{ justifyContent: 'space-between', paddingHorizontal: space.lg }}>
          <View style={{ flex: 1 }}>
            <T variant="label" color={phase === 'hold' || phase === 'done' ? t.accentInk : t.textMuted}>
              {setLabel}
            </T>
            <T variant="h2" color={phase === 'hold' || phase === 'done' ? t.accentInk : t.text}>
              {title}
            </T>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрыть таймер"
            onPress={onClose}
            hitSlop={8}
            style={[styles.round, { borderColor: (phase === 'hold' || phase === 'done' ? t.accentInk : t.text) + '44' }]}>
            <Ionicons name="close" size={24} color={phase === 'hold' || phase === 'done' ? t.accentInk : t.text} />
          </Pressable>
        </Row>

        <View style={styles.center}>
          <T variant="label" color={phase === 'hold' || phase === 'done' ? t.accentInk : t.textMuted}>
            {phase === 'ready' ? 'Цель' : phase === 'countdown' ? 'Приготовься' : phase === 'hold' ? 'Держи!' : 'Готово!'}
          </T>
          <T
            accessibilityLiveRegion="polite"
            style={{ fontSize: 120, lineHeight: 128, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -4 }}
            color={phase === 'hold' || phase === 'done' ? t.accentInk : t.text}>
            {phase === 'done' ? '✓' : big}
          </T>
          <T variant="bodyStrong" color={phase === 'hold' || phase === 'done' ? t.accentInk : t.textMuted}>
            {phase === 'done' ? `Выстоял ${goal} сек` : 'секунд'}
          </T>
          <View style={[styles.track, { backgroundColor: (phase === 'hold' || phase === 'done' ? t.accentInk : t.text) + '22' }]}>
            <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: radius.pill, backgroundColor: phase === 'hold' || phase === 'done' ? t.accentInk : t.accent }} />
          </View>
        </View>

        <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
          {phase === 'ready' ? (
            <>
              <Row style={{ justifyContent: 'center' }} gap={space.lg}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Меньше на 5 секунд"
                  onPress={() => setGoal((g) => Math.max(5, g - 5))}
                  style={[styles.round, { borderColor: t.border }]}>
                  <T variant="bodyStrong">−5</T>
                </Pressable>
                <T variant="small" color={t.textMuted} style={{ textAlign: 'center', minWidth: 120 }}>
                  Рекомендуем {minSec === maxSec ? minSec : `${minSec}–${maxSec}`} сек
                </T>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Больше на 5 секунд"
                  onPress={() => setGoal((g) => Math.min(300, g + 5))}
                  style={[styles.round, { borderColor: t.border }]}>
                  <T variant="bodyStrong">+5</T>
                </Pressable>
              </Row>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setPrep(PREP);
                  setPhase('countdown');
                }}
                style={({ pressed }) => [styles.cta, { backgroundColor: t.accent, opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="play" size={22} color={t.accentInk} />
                <T variant="h3" color={t.accentInk}>
                  Старт
                </T>
              </Pressable>
            </>
          ) : phase === 'countdown' || phase === 'hold' ? (
            <Pressable
              accessibilityRole="button"
              onPress={phase === 'hold' ? stopEarly : () => setPhase('ready')}
              style={({ pressed }) => [styles.cta, { backgroundColor: phase === 'hold' ? t.accentInk : t.surfaceAlt, opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="stop" size={22} color={phase === 'hold' ? t.accent : t.text} />
              <T variant="h3" color={phase === 'hold' ? t.accent : t.text}>
                {phase === 'hold' ? `Стоп · ${held} сек` : 'Отмена'}
              </T>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => onDone(goal)}
              style={({ pressed }) => [styles.cta, { backgroundColor: t.accentInk, opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="checkmark" size={22} color={t.accent} />
              <T variant="h3" color={t.accent}>
                Отметить подход и отдыхать
              </T>
            </Pressable>
          )}
          {phase === 'hold' ? (
            <T variant="small" color={t.accentInk} style={{ textAlign: 'center' }}>
              Дыши ровно. Остановишься после половины времени — подход засчитаем.
            </T>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  round: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
  track: { width: '100%', height: 12, borderRadius: radius.pill, overflow: 'hidden', marginTop: space.xl },
  cta: { minHeight: 60, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
});
