import { Platform } from 'react-native';
import { getOrRefreshToken } from './auth';

var Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('[Push] expo-notifications not available:', e.message);
}

var BASE_URL = 'http://168.131.224.195:8000';

export function setNotificationHandler() {
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function registerPushToken() {
  if (!Notifications) return;

  var { status: existing } = await Notifications.getPermissionsAsync();
  var finalStatus = existing;
  if (existing !== 'granted') {
    var { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('[Push] 알림 권한 거부됨');
    return;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('fire-alert', {
      name: '화재 경보',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF0000',
      sound: true,
    });
  }

  try {
    var tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'c180f013-a05e-4cc5-91cf-8eba7c5f2ce9',
    });
    var pushToken = tokenData.data;
    console.log('[Push] 토큰 발급:', pushToken);

    var authToken = await getOrRefreshToken();
    var res = await fetch(BASE_URL + '/api/push-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken,
      },
      body: JSON.stringify({ token: pushToken }),
    });
    if (res.ok) {
      console.log('[Push] 서버 등록 완료');
    } else {
      console.warn('[Push] 서버 등록 실패:', res.status);
    }
  } catch (e) {
    console.warn('[Push] 토큰 등록 실패:', e.message);
  }
}
