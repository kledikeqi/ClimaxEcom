export function parsePrice(price) {
  const digits = String(price == null ? '' : price).replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export function formatLek(value) {
  return `${Number(value || 0).toLocaleString('en-US')} LEK`;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

export function formatCompact(value) {
  const number = Number(value || 0);
  if (Math.abs(number) >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (Math.abs(number) >= 1_000) return `${Math.round(number / 1_000)}k`;
  return String(number);
}

export function formatGrowth(value) {
  if (value === null || value === undefined) return '—';
  return `${value > 0 ? '+' : ''}${value}%`;
}
