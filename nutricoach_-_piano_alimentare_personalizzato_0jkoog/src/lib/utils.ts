import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Tronca a una cifra decimale (non arrotonda) e restituisce stringa con una cifra
export function formatOneDecimal(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '0.0';
  const truncated = Math.trunc(n * 10) / 10;
  return truncated.toFixed(1);
}
