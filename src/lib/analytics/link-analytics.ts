export interface ClickEvent {
  ts: number;
  country: string;
  referer: string;
}

export interface LinkAnalytics {
  code: string;
  url: string;
  clicks: ClickEvent[];
  createdAt: number;
}

export function analyticsKey(code: string): string {
  return `analytics:${code}`;
}

export const LINK_RETENTION_SECONDS = 60 * 60 * 72;

export function aggregateByCountry(clicks: ClickEvent[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const c of clicks) {
    const key = c.country || "Unknown";
    map[key] = (map[key] ?? 0) + 1;
  }
  return map;
}

export function aggregateByDay(clicks: ClickEvent[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const c of clicks) {
    const day = new Date(c.ts).toISOString().slice(0, 10);
    map[day] = (map[day] ?? 0) + 1;
  }
  return map;
}
