import {
  cartCount,
  cartTotal,
  expiryValid,
  formatCardNumber,
  formatExpiry,
  luhnValid,
  validateCard,
} from '../checkout';
import { CartItem } from '../../types';

const item = (price: string, qty: number): CartItem =>
  ({
    id: 1,
    name: 'Test',
    category: 'Hoodies',
    price,
    description: '',
    colors: [],
    badge: null,
    stock: 10,
    sizes: ['M'],
    selectedSize: 'M',
    qty,
  }) as CartItem;

describe('cartTotal / cartCount', () => {
  it('multiplies price by quantity', () => {
    expect(cartTotal([item('6,200 LEK', 2), item('1,500 LEK', 1)])).toBe(13900);
  });

  it('returns 0 for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
    expect(cartCount([])).toBe(0);
  });

  it('sums quantities, defaulting missing qty to 1', () => {
    const weird = { ...item('100 LEK', 0), qty: undefined } as unknown as CartItem;
    expect(cartCount([item('100 LEK', 3), weird])).toBe(4);
  });
});

describe('luhnValid', () => {
  it('accepts standard test card numbers', () => {
    expect(luhnValid('4242 4242 4242 4242')).toBe(true);
    expect(luhnValid('4000056655665556')).toBe(true);
  });

  it('rejects numbers failing the checksum', () => {
    expect(luhnValid('4242 4242 4242 4241')).toBe(false);
  });

  it('rejects wrong lengths', () => {
    expect(luhnValid('4242')).toBe(false);
    expect(luhnValid('424242424242424242424242')).toBe(false);
  });
});

describe('expiryValid', () => {
  it('accepts a future date', () => {
    expect(expiryValid('12/30')).toBe(true);
  });

  it('rejects past dates', () => {
    expect(expiryValid('01/20')).toBe(false);
  });

  it('accepts the current month', () => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(2);
    expect(expiryValid(`${mm}/${yy}`)).toBe(true);
  });

  it('rejects malformed input and impossible months', () => {
    expect(expiryValid('abc')).toBe(false);
    expect(expiryValid('13/30')).toBe(false);
    expect(expiryValid('')).toBe(false);
  });
});

describe('validateCard', () => {
  it('accepts a fully valid demo card', () => {
    expect(validateCard({ number: '4242 4242 4242 4242', exp: '12/30', cvc: '123' })).toBeNull();
  });

  it('returns a message for each failure mode', () => {
    expect(validateCard({ number: '1234', exp: '12/30', cvc: '123' })).toMatch(/number/i);
    expect(validateCard({ number: '4242 4242 4242 4242', exp: '01/20', cvc: '123' })).toMatch(
      /expiry/i
    );
    expect(validateCard({ number: '4242 4242 4242 4242', exp: '12/30', cvc: 'ab' })).toMatch(/cvc/i);
  });
});

describe('input formatters', () => {
  it('groups card numbers into fours', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatCardNumber('4242a')).toBe('4242');
  });

  it('caps the card number at 16 digits', () => {
    expect(formatCardNumber('42424242424242424242').replace(/\s/g, '').length).toBe(16);
  });

  it('inserts the expiry slash', () => {
    expect(formatExpiry('1')).toBe('1');
    expect(formatExpiry('12')).toBe('12');
    expect(formatExpiry('123')).toBe('12/3');
    expect(formatExpiry('1230')).toBe('12/30');
  });
});
