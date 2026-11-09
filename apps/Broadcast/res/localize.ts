import type { BroadcastStrings } from '../hooks/useBroadcastStrings';

export function formatString(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

export function localizeGenre(id: string, fallback: string, s: BroadcastStrings) {
  const key = `genre_${id}` as keyof BroadcastStrings;
  return s[key] || fallback;
}

export function localizeCadence(value: string, s: BroadcastStrings) {
  const key = value.includes('每日') ? 'cadence_daily'
    : value.includes('两周') ? 'cadence_biweekly'
      : value.includes('每月') || value.includes('月更') ? 'cadence_monthly'
        : value.includes('每周') || value.includes('周更') || value.includes('一周') ? 'cadence_weekly'
          : value.includes('不定期') ? 'cadence_irregular'
            : value.includes('系列') ? 'cadence_series'
              : null;
  return key ? s[key] : value;
}
