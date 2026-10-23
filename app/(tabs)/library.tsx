import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Chip, Gap, Row, T } from '@/components/ui';
import { ExerciseThumb } from '@/components/workout';
import { EXERCISES, GEAR_LABELS, LEVEL_LABELS } from '@/data/exercises';
import type { Gear } from '@/lib/types';
import { radius, space, type as typo, useTheme } from '@/theme';

type Filter = 'all' | 'none' | Gear;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'none', label: 'Без инвентаря' },
  { value: 'dumbbells', label: GEAR_LABELS.dumbbells },
  { value: 'barbell', label: GEAR_LABELS.barbell },
  { value: 'bar', label: GEAR_LABELS.bar },
  { value: 'bands', label: GEAR_LABELS.bands },
  { value: 'bench', label: GEAR_LABELS.bench },
];

export default function Library() {
  const t = useTheme();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const data = useMemo(() => {
    const query = q.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (filter === 'none' && e.requires.length > 0) return false;
      if (filter !== 'all' && filter !== 'none' && !e.requires.includes(filter)) return false;
      if (!query) return true;
      return e.name.toLowerCase().includes(query) || e.muscles.some((m) => m.toLowerCase().includes(query));
    }).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [q, filter]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={data}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space.lg, paddingBottom: 120 }}
        ListHeaderComponent={
          <View>
            <T variant="display">Упражнения</T>
            <Gap h={space.lg} />
            <Row
              gap={space.sm}
              style={{
                backgroundColor: t.surface,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: t.border,
                paddingHorizontal: space.lg,
                minHeight: 52,
              }}>
              <Ionicons name="search" size={20} color={t.textMuted} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Название или мышца"
                placeholderTextColor={t.textMuted}
                style={[typo.body, { flex: 1, color: t.text, paddingVertical: space.md }]}
                clearButtonMode="while-editing"
                returnKeyType="search"
                accessibilityLabel="Поиск упражнений"
              />
            </Row>
            <Gap h={space.md} />
            <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
              {FILTERS.map((f) => (
                <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
              ))}
            </Row>
            <Gap h={space.md} />
            <T variant="small" color={t.textMuted}>
              Найдено: {data.length}
            </T>
            <Gap h={space.sm} />
          </View>
        }
        ListEmptyComponent={
          <T color={t.textMuted} style={{ textAlign: 'center', marginTop: space.xl }}>
            Ничего не нашлось. Попробуй другой запрос.
          </T>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/exercise/${item.id}`)} style={{ marginBottom: space.sm, padding: space.md }}>
            <Row gap={space.md}>
              <ExerciseThumb id={item.id} size={64} />
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong">{item.name}</T>
                <T variant="small" color={t.textMuted} numberOfLines={1}>
                  {item.muscles.slice(0, 3).join(', ')}
                </T>
                <T variant="small" color={t.textMuted} numberOfLines={1}>
                  {LEVEL_LABELS[item.level]} ·{' '}
                  {item.requires.length ? item.requires.map((g) => GEAR_LABELS[g]).join(', ') : 'без инвентаря'}
                </T>
              </View>
              <Ionicons name="chevron-forward" size={20} color={t.textFaint} />
            </Row>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
