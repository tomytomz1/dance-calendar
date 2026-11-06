/** Inputs have already been converted to Michigan wall-clock dates by EventCalendar. */
export function calendarDayKey(value: Date | string): string {
  const day = value instanceof Date ? value : new Date(value);
  return `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
}

/** Index once instead of scanning a year of events for every visible day. */
export function indexCalendarEvents<T extends { start: Date | string }>(events: readonly T[]): Map<string, T[]> {
  const days = new Map<string, T[]>();
  for (const event of events) {
    const key = calendarDayKey(event.start);
    const group = days.get(key);
    if (group) group.push(event); else days.set(key, [event]);
  }
  return days;
}
