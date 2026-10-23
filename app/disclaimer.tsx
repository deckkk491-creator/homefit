import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { HealthPoints } from '@/components/HealthPoints';
import { Button, Gap, Screen, T } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { radius, space, useTheme } from '@/theme';

export default function Disclaimer() {
  const t = useTheme();
  const accept = useAppStore((s) => s.acceptDisclaimer);
  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <View style={{ padding: space.lg, paddingTop: space.sm }}>
          <Button title="Понятно, продолжить" icon="arrow-forward" onPress={accept} />
        </View>
      }>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.md,
          backgroundColor: t.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: space.xl,
        }}>
        <Ionicons name="medkit" size={30} color={t.accentInk} />
      </View>
      <Gap h={space.xl} />
      <T variant="h1">Сначала — о здоровье</T>
      <Gap h={space.sm} />
      <T color={t.textMuted}>Пожалуйста, прочитай перед первой тренировкой.</T>
      <Gap h={space.xl} />
      <HealthPoints />
    </Screen>
  );
}
