export const colors = {
  bg: '#000000',
  bgTint: '#1a0505',
  surface: '#111111',
  cardTop: '#1e1e24',
  cardBottom: '#0d0d0d',
  border: '#222222',
  borderStrong: '#333333',
  primary: '#D32F2F',
  primaryDark: '#8E1B1B',
  text: '#FFFFFF',
  textSoft: '#AAAAAA',
  textMuted: '#888888',
  success: '#2ECC71',
  warning: '#F1C40F',
  chartTrack: '#1C1C1F',
} as const;

export const radius = { sm: 4, md: 10, lg: 12, pill: 20 } as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

/**
 * LinearGradient requires a tuple of at least two colours, while product data
 * comes from the API as `string[]`. Normalise safely.
 */
export function toGradient(colorList?: string[]): [string, string, ...string[]] {
  if (colorList && colorList.length >= 2) {
    return [colorList[0], colorList[1], ...colorList.slice(2)];
  }
  return ['#333333', '#444444'];
}

