import { formatCompact, formatGrowth, formatLek, formatNumber, parsePrice } from '../format';

describe('parsePrice', () => {
  it('extracts digits from formatted prices', () => {
    expect(parsePrice('6,200 LEK')).toBe(6200);
    expect(parsePrice('12,000 LEK')).toBe(12000);
  });

  it('returns 0 for empty or non-numeric input', () => {
    expect(parsePrice(null)).toBe(0);
    expect(parsePrice(undefined)).toBe(0);
    expect(parsePrice('free')).toBe(0);
    expect(parsePrice('')).toBe(0);
  });

  it('passes numbers through', () => {
    expect(parsePrice(1500)).toBe(1500);
  });
});

describe('formatLek', () => {
  it('formats with thousands separators', () => {
    expect(formatLek(6200)).toBe('6,200 LEK');
    expect(formatLek(0)).toBe('0 LEK');
  });
});

describe('formatNumber', () => {
  it('formats with thousands separators', () => {
    expect(formatNumber(12345)).toBe('12,345');
  });
});

describe('formatCompact', () => {
  it('keeps small numbers as-is', () => {
    expect(formatCompact(999)).toBe('999');
    expect(formatCompact(0)).toBe('0');
  });

  it('abbreviates thousands and millions', () => {
    expect(formatCompact(1500)).toBe('2k');
    expect(formatCompact(23_000)).toBe('23k');
    expect(formatCompact(2_500_000)).toBe('2.5M');
  });
});

describe('formatGrowth', () => {
  it('renders null as an em dash', () => {
    expect(formatGrowth(null)).toBe('—');
    expect(formatGrowth(undefined)).toBe('—');
  });

  it('prefixes positive values with +', () => {
    expect(formatGrowth(12.5)).toBe('+12.5%');
  });

  it('keeps the minus sign for negatives', () => {
    expect(formatGrowth(-3)).toBe('-3%');
  });

  it('renders zero without sign', () => {
    expect(formatGrowth(0)).toBe('0%');
  });
});
