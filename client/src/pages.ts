// One source of truth for each page's name, used both as its menu label and as its big heading,
// so they can never drift apart. `accent` is the part rendered in the header's italic style.
export interface PageInfo {
  path: string;
  title: string; // plain part, e.g. "Protein" — empty for a single-word name
  accent: string; // italicized part, e.g. "tracker"
}

export const PAGES: PageInfo[] = [
  { path: '/', title: 'Protein', accent: 'tracker' },
  { path: '/calendar', title: 'Calendar', accent: 'view' },
  { path: '/workout', title: 'Workout', accent: 'tracker' },
  { path: '/supplements', title: '', accent: 'Supplements' },
];

export const menuLabel = (page: PageInfo) => (page.title ? `${page.title} ${page.accent}` : page.accent);

export const pageInfo = (path: string): PageInfo => PAGES.find((p) => p.path === path) ?? PAGES[0];
