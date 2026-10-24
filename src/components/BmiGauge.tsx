import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Row, T } from '@/components/ui';
import { bmi } from '@/lib/planGenerator';
import { radius, space, useTheme } from '@/theme';

// Шкала от 15 до 40: всё, что за краями, прижимается к краю
const MIN = 15;
const MAX = 40;
const ZONES = [
  { to: 18.5, key: 'info', label: 'Недовес' },
  { to: 25, key: 'success', label: 'Норма' },
  { to: 30, key: 'warn', label: 'Избыток' },
  { to: MAX, key: 'danger', label: 'Ожирение' },
] as const;

const pos = (v: number) => (Math.max(MIN, Math.min(MAX, v)) - MIN) / (MAX - MIN);

/**
 * Индекс массы тела наглядно: цветная шкала с зонами, отметка пользователя
 * и нормальный вес для его роста. ИМТ — грубая оценка: не учитывает мышцы.
 */
export function BmiGauge({ heightCm, weightKg }: { heightCm: number; weightKg: number }) {
  const t = useTheme();
  const value = bmi({ heightCm, weightKg });
  const anim = useRef(new Animated.Value(pos(value))).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: pos(value), duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [value, anim]);

  if (!value) return null;
  const zone = ZONES.find((z) => value < z.to) ?? ZONES[ZONES.length - 1];
  const color = t[zone.key];
  const h = heightCm / 100;
  const normFrom = Math.round(18.5 * h * h);
  const normTo = Math.round(24.9 * h * h);
  const left = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View
      accessible
      accessibilityLabel={`Индекс массы тела ${value.toFixed(1)}, ${zone.label}. Нормальный вес для твоего роста от ${normFrom} до ${normTo} килограммов.`}
      style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <T variant="label" color={t.textMuted}>
            Индекс массы тела
          </T>
          <Row gap={space.sm} style={{ alignItems: 'baseline', marginTop: 4 }}>
            <T style={{ fontSize: 34, lineHeight: 38, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{value.toFixed(1)}</T>
            <View style={[styles.badge, { backgroundColor: color }]}>
              <T variant="small" color={t.scheme === 'dark' ? t.bg : '#FFFFFF'} style={{ fontWeight: '700' }}>
                {zone.label}
              </T>
            </View>
          </Row>
        </View>
      </Row>

      <View style={{ marginTop: space.lg, paddingTop: 14 }}>
        {/* отметка */}
        <Animated.View style={[styles.markerWrap, { left }]} pointerEvents="none">
          <View style={[styles.marker, { borderTopColor: t.text }]} />
        </Animated.View>
        <View style={styles.bar}>
          {ZONES.map((z, i) => {
            const from = i === 0 ? MIN : ZONES[i - 1].to;
            return <View key={z.key} style={{ flex: z.to - from, backgroundColor: t[z.key], opacity: z.key === zone.key ? 1 : 0.45 }} />;
          })}
        </View>
        <View style={styles.ticks}>
          {[18.5, 25, 30].map((v) => (
            <T key={v} variant="small" color={t.textMuted} style={[styles.tick, { left: `${pos(v) * 100}%` }]}>
              {String(v).replace('.', ',')}
            </T>
          ))}
        </View>
      </View>

      <T variant="small" color={t.textMuted} style={{ marginTop: space.lg }}>
        Норма для твоего роста: <T variant="small" style={{ fontWeight: '700' }}>{normFrom}–{normTo} кг</T>. ИМТ не учитывает мышцы:
        у тренированных людей он бывает выше нормы.
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: space.lg, marginTop: space.md },
  badge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.pill },
  bar: { flexDirection: 'row', height: 12, borderRadius: radius.pill, overflow: 'hidden' },
  markerWrap: { position: 'absolute', top: 0, width: 0, alignItems: 'center' },
  marker: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  ticks: { height: 22, marginTop: 4 },
  tick: { position: 'absolute', width: 40, marginLeft: -20, textAlign: 'center', fontSize: 12 },
});
