import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { Button, Card, Gap, Row, Screen, T } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { radius, space, useTheme } from '@/theme';

const POINTS = [
  'HomeFit — приложение для самостоятельных тренировок. Это не медицинская консультация, не диагностика и не лечение.',
  'Перед началом занятий проконсультируйтесь с врачом, особенно если у вас есть заболевания сердца и сосудов, повышенное давление, травмы, болезни суставов или позвоночника, беременность, или вы давно не тренировались.',
  'Немедленно прекратите упражнение при боли в груди, головокружении, сильной одышке или острой боли в суставах.',
  'Используйте только устойчивые опоры и исправный инвентарь. Вы тренируетесь на свой страх и риск.',
];

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
      <T color={t.textMuted}>Пожалуйста, прочитайте перед первой тренировкой.</T>
      <Gap h={space.xl} />
      <Card>
        {POINTS.map((p, i) => (
          <Row key={i} gap={space.md} style={{ alignItems: 'flex-start', marginBottom: i < POINTS.length - 1 ? space.lg : 0 }}>
            <T variant="h3" color={t.accentStrong} style={{ width: 22 }}>
              {i + 1}
            </T>
            <T style={{ flex: 1 }}>{p}</T>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
