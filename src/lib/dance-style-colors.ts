import { DANCE_STYLES } from "@/lib/types";

/** Tailwind classes for chip/badge backgrounds and text (light mode). */
export type StyleChipClasses = {
  chip: string;
  badge: string;
};

const STYLE_CHIP_MAP: Record<string, StyleChipClasses> = {
  Salsa: {
    chip: "bg-rose-600 hover:bg-rose-700 text-white",
    badge: "bg-rose-100 text-rose-800",
  },
  Bachata: {
    chip: "bg-fuchsia-600 hover:bg-fuchsia-700 text-white",
    badge: "bg-fuchsia-100 text-fuchsia-800",
  },
  Kizomba: {
    chip: "bg-violet-600 hover:bg-violet-700 text-white",
    badge: "bg-violet-100 text-violet-800",
  },
  Zouk: {
    chip: "bg-purple-600 hover:bg-purple-700 text-white",
    badge: "bg-purple-100 text-purple-800",
  },
  Swing: {
    chip: "bg-teal-600 hover:bg-teal-700 text-white",
    badge: "bg-teal-100 text-teal-800",
  },
  "Lindy Hop": {
    chip: "bg-cyan-600 hover:bg-cyan-700 text-white",
    badge: "bg-cyan-100 text-cyan-800",
  },
  "West Coast Swing": {
    chip: "bg-sky-600 hover:bg-sky-700 text-white",
    badge: "bg-sky-100 text-sky-800",
  },
  Ballroom: {
    chip: "bg-amber-600 hover:bg-amber-700 text-white",
    badge: "bg-amber-100 text-amber-800",
  },
  Latin: {
    chip: "bg-orange-600 hover:bg-orange-700 text-white",
    badge: "bg-orange-100 text-orange-800",
  },
  Tango: {
    chip: "bg-red-700 hover:bg-red-800 text-white",
    badge: "bg-red-100 text-red-800",
  },
  Contemporary: {
    chip: "bg-indigo-600 hover:bg-indigo-700 text-white",
    badge: "bg-indigo-100 text-indigo-800",
  },
  "Hip Hop": {
    chip: "bg-slate-700 hover:bg-slate-800 text-white",
    badge: "bg-slate-100 text-slate-800",
  },
  Breaking: {
    chip: "bg-stone-700 hover:bg-stone-800 text-white",
    badge: "bg-stone-100 text-stone-800",
  },
  House: {
    chip: "bg-lime-700 hover:bg-lime-800 text-white",
    badge: "bg-lime-100 text-lime-900",
  },
  Afrobeats: {
    chip: "bg-yellow-600 hover:bg-yellow-700 text-white",
    badge: "bg-yellow-100 text-yellow-900",
  },
  Reggaeton: {
    chip: "bg-pink-600 hover:bg-pink-700 text-white",
    badge: "bg-pink-100 text-pink-800",
  },
  Other: {
    chip: "bg-primary/90 hover:bg-primary text-primary-foreground",
    badge: "bg-primary/10 text-primary",
  },
};

const FALLBACK_PALETTE: StyleChipClasses[] = [
  {
    chip: "bg-blue-600 hover:bg-blue-700 text-white",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    chip: "bg-emerald-600 hover:bg-emerald-700 text-white",
    badge: "bg-emerald-100 text-emerald-800",
  },
  {
    chip: "bg-amber-600 hover:bg-amber-700 text-white",
    badge: "bg-amber-100 text-amber-800",
  },
];

function hashStyle(style: string): number {
  let h = 0;
  for (let i = 0; i < style.length; i++) {
    h = (h << 5) - h + style.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Primary style for chip coloring (first listed style, or Other). */
export function getPrimaryDanceStyle(danceStyles: string[]): string {
  if (danceStyles.length === 0) return "Other";
  return danceStyles[0];
}

export function getStyleChipClasses(style: string): StyleChipClasses {
  const known = STYLE_CHIP_MAP[style];
  if (known) return known;

  if (DANCE_STYLES.includes(style as (typeof DANCE_STYLES)[number])) {
    return STYLE_CHIP_MAP.Other;
  }

  return FALLBACK_PALETTE[hashStyle(style) % FALLBACK_PALETTE.length];
}
