import * as TimeService from '@/os/TimeService';

const pad = (n: number) => String(n).padStart(2, '0');

/** 价格拆分:整数与小数 */
export function splitPrice(n: number): { int: string; dec: string } {
  const fixed = Math.round(n * 100) / 100;
  const [int, dec] = String(fixed).split('.');
  return { int, dec: dec ? `.${dec}` : '' };
}

export function formatMoney(n: number): string {
  const { int, dec } = splitPrice(n);
  return `${int}${dec}`;
}

/** dayOffset(0/1/2)→ '今天7月13日' 样式标签 */
export function dayLabel(offset: number, zh = true): string {
  const d = TimeService.fromTimestamp(TimeService.now() + offset * 86400000);
  const md = `${d.getMonth() + 1}月${d.getDate()}日`;
  const names = zh ? ['今天', '明天', '后天'] : ['Today', 'Tomorrow', 'Day after'];
  return `${names[offset] ?? ''}${zh ? md : ''}`;
}

/** mm:ss 倒计时 */
export function formatCountdownMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

export function formatDate(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * 确定性座位图:从 sessionId 派生已售分布(禁止 Math.random)。
 * 9排 × 12列;返回 'sold' | 'free' | 'aisle'。
 */
export function seatMap(sessionId: string): ('sold' | 'free')[][] {
  let h = 5381;
  for (const ch of sessionId) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  const rows = 9, cols = 12;
  const grid: ('sold' | 'free')[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: ('sold' | 'free')[] = [];
    for (let c = 0; c < cols; c++) {
      h = (h * 1103515245 + 12345) >>> 0;
      row.push((h >>> 16) % 100 < 28 ? 'sold' : 'free');
    }
    grid.push(row);
  }
  return grid;
}

/** 推荐 N 连座:从中心行找连续 free */
export function recommendSeats(grid: ('sold' | 'free')[][], n: number): string[] {
  const rows = grid.length, cols = grid[0]?.length ?? 0;
  const order = [4, 5, 3, 6, 2, 7, 1, 8, 0];
  for (const r of order) {
    if (r >= rows) continue;
    const center = Math.floor(cols / 2);
    for (let span = 0; span <= cols; span++) {
      for (const start of [center - Math.floor(n / 2) - span, center - Math.floor(n / 2) + span]) {
        if (start < 0 || start + n > cols) continue;
        let ok = true;
        for (let k = 0; k < n; k++) if (grid[r][start + k] !== 'free') { ok = false; break; }
        if (ok) {
          return Array.from({ length: n }, (_, k) => `${r + 1}-${pad(start + k + 1)}`);
        }
      }
    }
  }
  return [];
}
