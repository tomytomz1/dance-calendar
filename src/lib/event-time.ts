export function parseTimeTo12Hour(hhmm: string): { hour: number; minute: string; period: 'AM' | 'PM' } {
  const [hour, minute] = (hhmm || '00:00').split(':').map(Number);
  const h24 = hour ?? 0;
  return { hour: h24 % 12 || 12, minute: String(minute ?? 0).padStart(2, '0'), period: h24 < 12 ? 'AM' : 'PM' };
}

export function toHHmm(hour: number, minute: string, period: 'AM' | 'PM'): string {
  const h24 = hour % 12 + (period === 'PM' ? 12 : 0);
  return `${String(h24).padStart(2, '0')}:${minute}`;
}
