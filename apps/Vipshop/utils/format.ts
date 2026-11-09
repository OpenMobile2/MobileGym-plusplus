import * as TimeService from '@/os/TimeService';

/** 价格拆分:整数部分与小数部分(无小数则 dec 为 '') */
export function splitPrice(n: number): { int: string; dec: string } {
  const fixed = Math.round(n * 100) / 100;
  const [int, dec] = String(fixed).split('.');
  return { int, dec: dec ? `.${dec}` : '' };
}

export function formatMoney(n: number): string {
  const { int, dec } = splitPrice(n);
  return `${int}${dec}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 列表时间:今天→HH:mm,昨天→昨天,其余→MM-dd */
export function formatListTime(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const now = TimeService.getDate();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const yesterday = TimeService.fromTimestamp(TimeService.now() - 86400000);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return '昨天';
  }
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDateTime(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDate(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 足迹分组标题:今天/昨天/M月d日 */
export function footprintGroupLabel(ts: number): string {
  const t = formatListTime(ts);
  if (t === '昨天') return '昨天';
  if (/^\d{2}:\d{2}$/.test(t)) return '今天';
  const d = TimeService.fromTimestamp(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 倒计时 mm:ss 或 HH:mm:ss */
export function formatCountdown(msLeft: number): string {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/** 剩余时长:x天y小时 */
export function formatRemain(msLeft: number): string {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return `${d}天${h}小时`;
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}小时${m}分` : `${m}分钟`;
}
