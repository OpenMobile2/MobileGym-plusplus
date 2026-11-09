import type { TvContent } from '../types';

export interface SeasonEpisodeState {
  available: number;
  total: number;
  updatedTo?: number;
}

/** 只返回有独立集数配置的季，避免展示无法切换出真实内容的空季 Tab。 */
export function seasonNumbersOf(content?: TvContent): number[] {
  if (!content?.seasonEpisodes) return [];
  const configured = new Set(Object.keys(content.seasonEpisodes).map(Number));
  const declared = content.seasons ?? [...configured];
  return declared.filter((season) => configured.has(season));
}

export function currentSeasonOf(content: TvContent | undefined, seasons: number[]): number {
  const match = content?.title.match(/(?:第)?(\d+)季|(\d+)$/);
  const titleSeason = Number(match?.[1] ?? match?.[2]);
  if (seasons.includes(titleSeason)) return titleSeason;
  return seasons[seasons.length - 1] ?? 0;
}

export function seasonSubTabsOf(content: TvContent | undefined, season: number): string[] {
  if (!content) return [];
  if (!content.seasonEpisodes || !season) return content.subTabs ?? [];
  const configured = content.seasonEpisodes[String(season)]?.subTabs ?? {};
  return (content.subTabs ?? Object.keys(configured)).filter((tab) => configured[tab] !== undefined);
}

export function seasonEpisodeStateOf(
  content: TvContent | undefined,
  season: number,
  subTab: string,
): SeasonEpisodeState {
  const config = content?.seasonEpisodes?.[String(season)];
  if (config) {
    const mainAvailable = config.updatedTo ?? config.total;
    const subTabAvailable = config.subTabs?.[subTab];
    const available = Math.max(0, subTabAvailable ?? mainAvailable);
    return {
      available,
      total: subTab && subTab !== '正片' ? available : config.total,
      updatedTo: subTab && subTab !== '正片' ? available : mainAvailable,
    };
  }

  const total = Math.max(0, content?.episodes ?? 0);
  const updatedTo = Math.max(0, content?.updatedTo ?? total);
  return { available: updatedTo, total, updatedTo };
}
