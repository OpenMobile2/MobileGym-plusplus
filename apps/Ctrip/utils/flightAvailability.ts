import type { Flight } from '../types';
import * as TimeService from '@/os/TimeService';

function hash(text: string): number {
  let value = 0;
  for (const ch of text) value = (value * 31 + ch.charCodeAt(0)) >>> 0;
  return value;
}

function dayOf(date: string): number {
  const parts = date.split('-');
  const value = Number(parts[parts.length - 1]);
  return Number.isFinite(value) ? value : 5;
}

/** Deterministic mock inventory: schedules and fares vary by travel date. */
export function isFlightAvailableOn(flight: Flight, date: string): boolean {
  return (hash(flight.id) + dayOf(date)) % 4 !== 0;
}

export function flightPriceOn(flight: Flight, date: string): number {
  const delta = (((hash(flight.id) + dayOf(date) * 17) % 9) - 4) * 20;
  return Math.max(199, flight.price + delta);
}

export function nearbyFlightDates(date: string): string[] {
  const [month, day] = date.split('-').map(Number);
  const now = TimeService.getDate();
  const selected = TimeService.fromLocalParts(now.getFullYear(), (month || now.getMonth() + 1) - 1, day || now.getDate());
  return Array.from({ length: 5 }, (_, index) => {
    const candidate = TimeService.fromTimestamp(selected.getTime());
    candidate.setDate(candidate.getDate() + index - 2);
    return `${String(candidate.getMonth() + 1).padStart(2, '0')}-${String(candidate.getDate()).padStart(2, '0')}`;
  });
}
