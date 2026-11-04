"use client";

import { useSyncExternalStore } from 'react';
const query = '(max-width: 767px)';
const getSnapshot = () => window.matchMedia(query).matches;
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};

/** Match the calendar's md breakpoint without mounting the hidden layout. */
export function useMobileViewport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
