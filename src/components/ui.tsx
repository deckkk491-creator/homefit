import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { radius, space, type as typo, useTheme } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// ───────────── Типографика ─────────────

type Variant = keyof typeof typo;

export function T({
  variant = 'body',
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: string }) {
  const t = useTheme();
  return <Text {...rest} style={[typo[variant] as TextStyle, { color: color ?? t.text }, style]} />;
}

// ───────────── Каркас экрана ─────────────

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  contentStyle,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
}) {
  const t = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: t.bg }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  tone = 'surface',
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'surface' | 'accent' | 'alt';
  onPress?: () => void;
}) {
  const t = useTheme();
  const bg = tone === 'accent' ? t.accent : tone === 'alt' ? t.surfaceAlt : t.surface;
  const base: ViewStyle = {
    backgroundColor: bg,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: tone === 'surface' ? StyleSheet.hairlineWidth : 0,
    borderColor: t.border,
  };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const bg =
    variant === 'primary' ? t.accent : variant === 'secondary' ? t.surfaceAlt : 'transparent';
  const fg =
    variant === 'primary' ? t.accentInk : variant === 'danger' ? t.danger : t.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: t.border,
        },
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
      <Text style={[typo.bodyStrong, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? t.text : t.surface,
          borderColor: selected ? t.text : t.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      {icon ? <Ionicons name={icon} size={16} color={selected ? t.bg : t.textMuted} /> : null}
      <Text style={[typo.small, { color: selected ? t.bg : t.text, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

/** Крупная карточка выбора (цель, пол и т. п.). */
export function Choice({
  title,
  subtitle,
  selected,
  onPress,
  icon,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          backgroundColor: selected ? t.accent : t.surface,
          borderColor: selected ? t.accent : t.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      {icon ? (
        <View style={[styles.choiceIcon, { backgroundColor: selected ? t.accentInk : t.surfaceAlt }]}>
          <Ionicons name={icon} size={20} color={selected ? t.accent : t.text} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <T variant="bodyStrong" color={selected ? t.accentInk : t.text}>
          {title}
        </T>
        {subtitle ? (
          <T variant="small" color={selected ? t.accentInk : t.textMuted}>
            {subtitle}
          </T>
        ) : null}
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={selected ? t.accentInk : t.textFaint}
      />
    </Pressable>
  );
}

/** Числовое поле с кнопками − / +. */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  const t = useTheme();
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v * 10) / 10));
  return (
    <View style={[styles.stepper, { backgroundColor: t.surface, borderColor: t.border }]}>
      <T variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </T>
      <Pressable
        accessibilityLabel={`Уменьшить: ${label}`}
        hitSlop={8}
        onPress={() => onChange(clamp(value - step))}
        style={[styles.stepBtn, { backgroundColor: t.surfaceAlt }]}>
        <Ionicons name="remove" size={22} color={t.text} />
      </Pressable>
      <View style={styles.stepValue}>
        <TextInput
          accessibilityLabel={label}
          keyboardType="decimal-pad"
          value={String(value)}
          onChangeText={(s) => {
            const n = Number(s.replace(',', '.'));
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          style={[typo.h3, { color: t.text, textAlign: 'center', minWidth: 48, padding: 0 }]}
          selectTextOnFocus
        />
        {unit ? <T variant="small" color={t.textMuted}>{unit}</T> : null}
      </View>
      <Pressable
        accessibilityLabel={`Увеличить: ${label}`}
        hitSlop={8}
        onPress={() => onChange(clamp(value + step))}
        style={[styles.stepBtn, { backgroundColor: t.surfaceAlt }]}>
        <Ionicons name="add" size={22} color={t.text} />
      </Pressable>
    </View>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
  icon,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: IconName;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={[styles.toggle, { backgroundColor: t.surface, borderColor: value ? t.text : t.border }]}>
      {icon ? <Ionicons name={icon} size={22} color={t.text} /> : null}
      <View style={{ flex: 1 }}>
        <T variant="bodyStrong">{label}</T>
        {hint ? <T variant="small" color={t.textMuted}>{hint}</T> : null}
      </View>
      <View style={[styles.track, { backgroundColor: value ? t.accent : t.surfaceAlt }]}>
        <View
          style={[
            styles.thumb,
            { backgroundColor: value ? t.accentInk : t.textFaint, alignSelf: value ? 'flex-end' : 'flex-start' },
          ]}
        />
      </View>
    </Pressable>
  );
}

export function SectionLabel({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return (
    <T variant="label" color={t.textMuted} style={[{ marginTop: space.xl, marginBottom: space.sm }, style]}>
      {children}
    </T>
  );
}

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' }) {
  const t = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
        backgroundColor: tone === 'accent' ? t.accent : t.surfaceAlt,
        alignSelf: 'flex-start',
      }}>
      <Text style={[typo.small, { fontSize: 13, fontWeight: '700', color: tone === 'accent' ? t.accentInk : t.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export function Row({ children, gap = space.sm, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Gap({ h = space.md }: { h?: number }) {
  return <View style={{ height: h }} />;
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 120 },
  button: {
    minHeight: 56,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: space.sm,
  },
  choiceIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingLeft: space.lg,
    paddingRight: space.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.sm,
  },
  stepBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stepValue: { alignItems: 'center', minWidth: 64 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: space.sm,
  },
  track: { width: 52, height: 32, borderRadius: 16, padding: 4, justifyContent: 'center' },
  thumb: { width: 24, height: 24, borderRadius: 12 },
});
