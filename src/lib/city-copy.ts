const CITY_INTROS: Record<string, string> = {
  detroit:
    "Detroit's social dance scene spans downtown venues, weekly salsa socials, and bachata nights across the metro. MichiganDance.Life lists approved events so you never miss a party or class in the Motor City.",
  troy:
    "Troy and Oakland County host regular bachata and salsa socials at local studios and bars. Browse upcoming nights, venues, and styles—all in one Michigan calendar.",
  "ann-arbor":
    "Ann Arbor brings university energy and diverse dance communities—from Latin socials to swing. Find the next event near campus or downtown.",
  "grand-rapids":
    "Grand Rapids and West Michigan offer growing Latin and ballroom communities. See what's on the floor this week.",
};

export function getCityIntro(cityName: string, citySlug: string): string {
  const custom = CITY_INTROS[citySlug];
  if (custom) return custom;

  return `${cityName} has an active social dance community with salsa, bachata, swing, and more. MichiganDance.Life collects approved events in ${cityName}, Michigan so dancers can plan their week in one place. Check back often—new socials and classes are added regularly.`;
}
