import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

/**
 * Локальное уведомление об окончании отдыха.
 * Нужно, когда телефон заблокирован или открыто другое приложение: таймер на экране тогда не видно.
 * Всё работает на устройстве, сервер и push-токены не нужны.
 */

const ID = 'rest-end';

// Пока приложение открыто, баннер не показываем: таймер и вибрация уже на экране
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const active = AppState.currentState === 'active';
    return {
      shouldShowBanner: !active,
      shouldShowList: !active,
      shouldPlaySound: !active,
      shouldSetBadge: false,
    };
  },
});

let permissionRequest: Promise<boolean> | null = null;

/** Спрашивает разрешение один раз; параллельные вызовы делят один запрос. */
function ensurePermission(): Promise<boolean> {
  if (!permissionRequest) {
    permissionRequest = (async () => {
      const current = await Notifications.getPermissionsAsync();
      if (current.granted) return true;
      if (!current.canAskAgain) return false;
      const req = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      });
      return req.granted;
    })()
      .catch(() => false)
      .finally(() => {
        permissionRequest = null;
      });
  }
  return permissionRequest;
}

// Номер последнего запроса: если таймер успели закрыть, пока шёл запрос разрешения, не планируем
let generation = 0;

/** Планирует (или переносит) уведомление на момент endAt. */
export async function scheduleRestEnd(endAt: number): Promise<void> {
  if (Platform.OS === 'web') return;
  const gen = ++generation;
  try {
    if (endAt - Date.now() < 1000) return;
    const granted = await ensurePermission();
    if (!granted || gen !== generation) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('rest', {
        name: 'Таймер отдыха',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    if (gen !== generation) return;
    // тот же identifier заменяет прежнее уведомление (например, после «+15»)
    await Notifications.scheduleNotificationAsync({
      identifier: ID,
      content: {
        title: 'Отдых окончен',
        body: 'Пора на следующий подход 💪',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endAt),
        channelId: Platform.OS === 'android' ? 'rest' : undefined,
      },
    });
    // таймер закрыли, пока уведомление планировалось — убираем его
    if (gen !== generation) await Notifications.cancelScheduledNotificationAsync(ID);
  } catch (e) {
    console.warn('scheduleRestEnd failed', e);
  }
}

/** Отменяет запланированное уведомление и убирает уже показанное. */
export async function cancelRestEnd(): Promise<void> {
  if (Platform.OS === 'web') return;
  generation++;
  try {
    await Notifications.cancelScheduledNotificationAsync(ID);
    await Notifications.dismissNotificationAsync(ID);
  } catch {
    // уведомления может уже не быть — это нормально
  }
}
