import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(err: any, fallback = 'An unexpected error occurred'): string {
  if (err?.response?.data?.message) {
    const msg = err.response.data.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
  }
  if (err?.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  if (err?.message && typeof err.message === 'string') {
    return err.message;
  }
  return fallback;
}
