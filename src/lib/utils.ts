import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'S/') {
  return `${currency} ${amount.toFixed(2)}`;
}

export function generateProductCode(prefix: string, count: number) {
  return `${prefix}${String(count + 1).padStart(3, '0')}`;
}
