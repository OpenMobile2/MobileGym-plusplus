import * as TimeService from '../../../os/TimeService';

/**
 * 种子时间映射(参考 Cainiao):defaults.json 用 { dayOffset, hm } 相对描述,
 * store 初始化时映射到模拟时钟「今天」附近的绝对时间戳,保证订单/物流/足迹/评价
 * 的相对日期永远自洽,种子里不写死日历日期。
 */

/** dayOffset=0 为模拟今天;hm 支持 "HH:mm" 或 "HH:mm:ss" */
export function seedTs(dayOffset: number, hm: string): number {
  const now = TimeService.getDate();
  const parts = hm.split(':').map((x) => parseInt(x, 10));
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const sec = parts[2] || 0;
  const d = TimeService.fromLocalParts(now.getFullYear(), now.getMonth(), now.getDate(), h, m, sec);
  return d.getTime() + dayOffset * 86400000;
}

/** 模拟今天 00:00 的时间戳(足迹「今天」去重等) */
export function dayStart(ts?: number): number {
  const d = ts == null ? TimeService.getDate() : TimeService.fromTimestamp(ts);
  return TimeService.fromLocalParts(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime();
}

/** 预计送达日:今天+N 天的 00:00 时间戳(配合 fmtYmd 生成「预计2026-07-28送达」) */
export function etaTs(dayOffset: number): number {
  return dayStart() + dayOffset * 86400000;
}

const p2 = (n: number) => String(n).padStart(2, '0');

/** 2026-07-28 */
export function fmtYmd(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

/** 07-28 */
export function fmtMonthDay(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

/** 20:15 */
export function fmtHm(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/** 07-28 20:15 */
export function fmtMdHm(ts: number): string {
  return `${fmtMonthDay(ts)} ${fmtHm(ts)}`;
}

/** 2026-07-28 20:15:33(订单时间明细) */
export function fmtFull(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${fmtYmd(ts)} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
}

const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 07-25(周六)(结算配送行) */
export function fmtMdWeek(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${p2(d.getMonth() + 1)}-${p2(d.getDate())}(${WEEK_CN[d.getDay()]})`;
}

/** 7月25日(周六)(配送时段弹层日期列表) */
export function fmtCnDateWeek(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日(${WEEK_CN[d.getDay()]})`;
}
