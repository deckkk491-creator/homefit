import { View } from 'react-native';

import { useTheme } from '@/theme';

/** Пустой стартовый экран: Gate в _layout сразу перенаправит куда нужно. */
export default function Index() {
  const t = useTheme();
  return <View style={{ flex: 1, backgroundColor: t.bg }} />;
}
