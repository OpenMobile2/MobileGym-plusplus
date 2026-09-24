import * as TimeService from '../../../os/TimeService';

/** 当前模拟时钟分钟数 0~1439 */
export function nowMinutes(): number {
  const d = TimeService.getDate();
  return d.getHours() * 60 + d.getMinutes();
}

export function parseHm(hm: string): number {
  const [h, m] = hm.split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}

export function fmtDistance(m: number): string {
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}
