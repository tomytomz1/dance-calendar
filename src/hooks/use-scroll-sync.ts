"use client";

import { useRef, useCallback, useEffect } from "react";

/**
 * Registers day sections for scroll-sync and observes which section is in view.
 * When a section becomes the "active" one (near top of viewport), calls onDateSelect.
 * scrollToSection skips observer updates briefly to avoid feedback loops.
 */
export function useScrollSync(
  scrollContainerRef: React.RefObject<HTMLElement | null>,
  onDateSelect: (date: Date) => void,
  viewKey: string,
  options?: {
    /** Skip observer updates for this many ms after programmatic scroll */
    skipAfterScrollMs?: number;
    /** Root margin for intersection: "top right bottom left" */
    rootMargin?: string;
  }
) {
  const sectionsRef = useRef<Map<string, { date: Date; element: HTMLElement }>>(
    new Map()
  );
  const skipUntilRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastActiveRef = useRef<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const skipAfterScrollMs = options?.skipAfterScrollMs ?? 300;
  const rootMargin = options?.rootMargin ?? "-10% 0px -70% 0px";

  const registerSection = useCallback((date: Date, element: HTMLElement | null) => {
    const key = date.toDateString();
    if (element) {
      sectionsRef.current.set(key, { date, element });
    } else {
      sectionsRef.current.delete(key);
    }
  }, []);

  const scrollToSection = useCallback(
    (date: Date) => {
      const key = date.toDateString();
      const entry = sectionsRef.current.get(key);
      const container = scrollContainerRef.current;
      if (entry && container) {
        skipUntilRef.current = Date.now() + skipAfterScrollMs;
        // Use header (first child) as scroll target so date snaps flush to calendar
        const scrollTarget = entry.element.firstElementChild ?? entry.element;
        const rect = scrollTarget.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const paddingTop = parseFloat(getComputedStyle(container).paddingTop) || 0;
        // Add paddingTop to scroll more: align header to container's top edge (flush with calendar),
        // not the inner content area, so no previous content peeks through
        const scrollTop =
          container.scrollTop + (rect.top - containerRect.top) + paddingTop;
        container.scrollTo({ top: Math.max(0, scrollTop), behavior: "instant" });
      }
    },
    [scrollContainerRef, skipAfterScrollMs]
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    lastActiveRef.current = null;

    const timeoutId = setTimeout(() => {
      const sections = Array.from(sectionsRef.current.values());
      if (sections.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (Date.now() < skipUntilRef.current) return;

          const visible = entries
            .filter((e) => e.isIntersecting)
            .map((e) => {
              const found = Array.from(sectionsRef.current.entries()).find(
                ([, v]) => v.element === e.target
              );
              return found ? { key: found[0], entry: found[1] } : null;
            })
            .filter(Boolean) as { key: string; entry: { date: Date; element: HTMLElement } }[];

          if (visible.length === 0) return;

          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const sorted = [...visible].sort((a, b) => {
              const rectA = a.entry.element.getBoundingClientRect();
              const rectB = b.entry.element.getBoundingClientRect();
              return rectA.top - rectB.top;
            });
            const topmost = sorted[0];
            if (topmost && topmost.key !== lastActiveRef.current) {
              lastActiveRef.current = topmost.key;
              onDateSelect(topmost.entry.date);
            }
          });
        },
        { root: container, rootMargin, threshold: [0, 0.1, 0.5, 1] }
      );

      sections.forEach(({ element }) => observer.observe(element));
      cleanupRef.current = () => {
        sections.forEach(({ element }) => observer.unobserve(element));
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        cleanupRef.current = null;
      };
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      cleanupRef.current?.();
    };
  }, [scrollContainerRef, onDateSelect, rootMargin, viewKey]);

  return { registerSection, scrollToSection };
}
