import { APP_EMAIL, APP_PASSWORD } from '../config/appCredentials';

var SecureStore = null;
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  console.warn('[Auth] expo-secure-store not available:', e.message);
}

var BASE_URL  = 'http://43.201.8.118:8000';
var TOKEN_KEY = 'fas_auth_token';

export async function getStoredToken() {
  if (!SecureStore) return null;
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export async function login() {
  var res = await fetch(BASE_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: APP_EMAIL, password: APP_PASSWORD }),
  });
  if (!res.ok) throw new Error('[Auth] login failed: HTTP ' + res.status);
  var data = await res.json();
  var token = data.token;
  if (SecureStore && token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
  console.log('[Auth] login success');
  return token;
}

export async function getOrRefreshToken() {
  var token = await getStoredToken();
  if (token) return token;
  return await login();
}

export async function clearToken() {
  if (!SecureStore) return;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (e) {}
}
