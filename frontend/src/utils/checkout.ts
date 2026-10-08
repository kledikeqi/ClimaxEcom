import { CartItem, DemoCard } from '../types';
import { parsePrice } from './format';

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + parsePrice(item.price) * (item.qty || 1), 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.qty || 1), 0);
}

export function luhnValid(raw: string): boolean {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let checksum = 0;
  const parity = digits.length % 2;
  for (let i = 0; i < digits.length; i += 1) {
    let digit = Number(digits[i]);
    if (i % 2 === parity) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    checksum += digit;
  }
  return checksum % 10 === 0;
}

export function expiryValid(exp: string): boolean {
  const match = exp.replace(/\s/g, '').match(/^(\d{1,2})\/(\d{2,4})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = Number(match[2].length === 2 ? `20${match[2]}` : match[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

export function validateCard(card: DemoCard): string | null {
  if (!luhnValid(card.number)) return 'Card number is invalid';
  if (!expiryValid(card.exp)) return 'Card expiry is invalid';
  const cvc = card.cvc.trim();
  if (!/^\d{3,4}$/.test(cvc)) return 'Card CVC is invalid';
  return null;
}

export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
