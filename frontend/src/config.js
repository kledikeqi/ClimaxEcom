import { Platform } from 'react-native';

// Fallback LAN IP used by the native app (Expo Go on a phone cannot reach
// `localhost` — it would point at the phone itself).
const LAN_HOST = '192.168.1.6';

function resolveHost() {
  if (process.env.EXPO_PUBLIC_API_URL) return null;
  if (Platform.OS !== 'web') return LAN_HOST;
  if (typeof window === 'undefined' || !window.location) return 'localhost';
  const { hostname } = window.location;
  // Served from this machine -> API on localhost.
  // Served from another device (http://192.168.x.x:8081) -> same host, port 8000.
  return hostname === 'localhost' || hostname === '127.0.0.1' ? 'localhost' : hostname;
}

const host = resolveHost();

export const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${host}:8000`;
