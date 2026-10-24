import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { type ReactNode, useMemo, useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { T } from '@/components/ui';
import { radius, useTheme } from '@/theme';

const ACTION_W = 92;

export type SwipeAction = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tone: 'accent' | 'danger';
  onPress: () => void;
};

/**
 * Строка со свайпом влево: открывает кнопки действий (например, «Заменить» и «Удалить»).
 * Сделано на PanResponder + Animated, без сторонних библиотек.
 * Вертикальная прокрутка не перехватывается: свайп срабатывает только на явно горизонтальное движение.
 */
export function SwipeRow({ children, actions, style }: { children: ReactNode; actions: SwipeAction[]; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const width = ACTION_W * actions.length;
  // В тёмной теме danger светлый — белый текст на нём нечитаем
  const onDanger = t.scheme === 'dark' ? t.bg : '#FFFFFF';
  const x = useRef(new Animated.Value(0)).current;
  const open = useRef(false);

  const snap = (to: number) => {
    open.current = to !== 0;
    Animated.spring(x, { toValue: to, useNativeDriver: true, bounciness: 4, speed: 18 }).start();
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => {
          const base = open.current ? -width : 0;
          const next = Math.max(-width - 24, Math.min(0, base + g.dx));
          x.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const base = open.current ? -width : 0;
          const pos = base + g.dx;
          const shouldOpen = pos < -width / 2 || g.vx < -0.5;
          if (shouldOpen && !open.current) Haptics.selectionAsync().catch(() => undefined);
          snap(shouldOpen && g.vx < 0.5 ? -width : 0);
        },
        onPanResponderTerminate: () => snap(open.current ? -width : 0),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width],
  );

  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.actions, { width }]}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            onPress={() => {
              snap(0);
              a.onPress();
            }}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: a.tone === 'danger' ? t.danger : t.accent, opacity: pressed ? 0.85 : 1 },
            ]}>
            <Ionicons name={a.icon} size={22} color={a.tone === 'danger' ? onDanger : t.accentInk} />
            <T variant="small" color={a.tone === 'danger' ? onDanger : t.accentInk} style={{ fontWeight: '700', fontSize: 13 }}>
              {a.label}
            </T>
          </Pressable>
        ))}
      </View>
      <Animated.View style={{ transform: [{ translateX: x }] }} {...responder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  actions: { position: 'absolute', right: 0, top: 0, bottom: 0, flexDirection: 'row', borderRadius: radius.md, overflow: 'hidden' },
  action: { width: ACTION_W, alignItems: 'center', justifyContent: 'center', gap: 4 },
});
