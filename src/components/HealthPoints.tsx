import { Card, Row, T } from '@/components/ui';
import { HEALTH_POINTS } from '@/data/legal';
import { space, useTheme } from '@/theme';

/** Нумерованный список предупреждений о здоровье. */
export function HealthPoints() {
  const t = useTheme();
  return (
    <Card>
      {HEALTH_POINTS.map((p, i) => (
        <Row key={i} gap={space.md} style={{ alignItems: 'flex-start', marginBottom: i < HEALTH_POINTS.length - 1 ? space.lg : 0 }}>
          <T variant="h3" color={t.accentStrong} style={{ width: 22 }}>
            {i + 1}
          </T>
          <T style={{ flex: 1 }}>{p}</T>
        </Row>
      ))}
    </Card>
  );
}
