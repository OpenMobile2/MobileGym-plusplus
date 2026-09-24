// apps/Keep/components/recordFormat.tsx —— 簇B 共享:运动记录格式化/分组/图标(纯展示,无手势绑定)
import React from 'react';
import { getDate, parseToTimestamp } from '@/os/TimeService';
import type { KeepRunRecord } from '../types';

const DAY_MS = 24 * 3600 * 1000;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** 秒 → "00:22:08" */
export function fmtHMS(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
}

/** 秒 → "22:40"(分:秒,跑步中计时) */
export function fmtMS(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

/** 秒/公里 → "07'21''";null → "--'--''" */
export function fmtPace(secPerKm: number | null | undefined): string {
  if (secPerKm == null || !isFinite(secPerKm) || secPerKm <= 0 || secPerKm > 3600) return "--'--''";
  const s = Math.round(secPerKm);
  return `${pad2(Math.floor(s / 60))}'${pad2(s % 60)}''`;
}

/** 记录类型 → 圆形图标底色(证据 recG_f010:紫/绿/蓝) */
export function typeColor(type: string): string {
  if (type === '户外跑步') return '#24C789';
  if (type === '户外行走') return '#3C7CFC';
  if (type === '户外骑行') return '#FF7D41';
  if (type === '室内跑步') return '#0FB27A';
  return '#7A5AF8'; // 室内有氧
}

/** 记录列表彩色圆图标(白色小人) */
export function TypeDot({ type, size = 40 }: { type: string; size?: number }) {
  return (
    <span
      className="rounded-full shrink-0 flex items-center justify-center"
      style={{ width: size, height: size, background: typeColor(type) }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <circle cx="14" cy="5" r="2.4" fill="#fff" />
        <path
          d="M13 8.5 L9 11 L10.5 14 L7.5 19 M13 8.5 L15 12.5 L13 17 L14.5 20.5 M13 8.5 L17.5 10"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** 标题:名称 + 距离(户外跑步 3.00 公里) */
export function recordTitle(r: KeepRunRecord): string {
  return r.km != null ? `${r.name}  ${r.km.toFixed(2)} 公里` : r.name;
}

/** 副行:用时/消耗/配速/步数(按类型取舍,证据 recG_f010) */
export function recordMeta(r: KeepRunRecord): string {
  const parts = [`用时 ${fmtHMS(r.durationSec)}`];
  if (r.paceSecPerKm != null) parts.push(`配速 ${fmtPace(r.paceSecPerKm)}`);
  else if (r.steps != null) parts.push(`步数 ${r.steps}`);
  else parts.push(`消耗 ${r.kcal} 千卡`);
  return parts.join('   ');
}

/** "2026-07-13" → 今天/昨天/7月13日 */
export function dateLabel(dateStr: string): string {
  const d = getDate();
  const todayMid = parseToTimestamp(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
  const diff = Math.round((todayMid - parseToTimestamp(dateStr)) / DAY_MS);
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  return `${Number(dateStr.slice(5, 7))}月${Number(dateStr.slice(8, 10))}日`;
}

/** 距今日天数(0=今天) */
export function daysAgo(dateStr: string): number {
  const d = getDate();
  const todayMid = parseToTimestamp(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
  return Math.round((todayMid - parseToTimestamp(dateStr)) / DAY_MS);
}

/** 按日期分组(降序),供 records.all / records.sync 列表 */
export function groupByDate(records: KeepRunRecord[]): { label: string; date: string; items: KeepRunRecord[] }[] {
  const sorted = [...records].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const groups: { label: string; date: string; items: KeepRunRecord[] }[] = [];
  for (const r of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === r.date) last.items.push(r);
    else groups.push({ label: dateLabel(r.date), date: r.date, items: [r] });
  }
  return groups;
}
