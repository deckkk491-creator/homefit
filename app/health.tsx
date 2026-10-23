import { ScrollView } from 'react-native';

import { HealthPoints } from '@/components/HealthPoints';
import { Gap, T } from '@/components/ui';
import { space, useTheme } from '@/theme';

/** Предупреждение о здоровье, доступное в любой момент (не только при первом запуске). */
export default function Health() {
  const t = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: space.lg, paddingBottom: 64 }}>
      <T color={t.textMuted}>Это же предупреждение показывалось при первом запуске.</T>
      <Gap h={space.lg} />
      <HealthPoints />
    </ScrollView>
  );
}
