import * as TimeService from '../../../os/TimeService';
import { FORMAT_TOOLS } from '../constants';
import type { AppLocale } from '../i18n/locales';

/** Slack 消息时间是 12 小时制：中文「2:16 下午」，英文「2:16 PM」 */
export function formatTime(ts: number, locale: AppLocale = 'zh'): string {
  const d = TimeService.fromTimestamp(ts);
  const h24 = d.getHours();
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = d.getMinutes().toString().padStart(2, '0');
  if (locale === 'en') return `${h}:${mm} ${h24 < 12 ? 'AM' : 'PM'}`;
  return `${h}:${mm} ${h24 < 12 ? '上午' : '下午'}`;
}

function startOfDay(ts: number): number {
  const d = TimeService.fromTimestamp(ts);
  return TimeService.fromLocalParts(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** 会话内的日期分隔条：今天 / 昨天 / 8月2日（英文 Today / Yesterday / Aug 2） */
export function formatDayLabel(ts: number, locale: AppLocale = 'zh'): string {
  const today = startOfDay(TimeService.now());
  const day = startOfDay(ts);
  const diffDays = Math.round((today - day) / 86_400_000);
  if (diffDays === 0) return locale === 'en' ? 'Today' : '今天';
  if (diffDays === 1) return locale === 'en' ? 'Yesterday' : '昨天';
  return TimeService.formatDateTimeForLocale(TimeService.fromTimestamp(ts), {
    month: locale === 'en' ? 'short' : 'numeric',
    day: 'numeric',
  });
}

/** 列表行右侧的时间：当天给时刻，昨天给「昨天」，更早给日期 */
export function formatListTime(ts: number, locale: AppLocale = 'zh'): string {
  const today = startOfDay(TimeService.now());
  const day = startOfDay(ts);
  const diffDays = Math.round((today - day) / 86_400_000);
  if (diffDays === 0) return formatTime(ts, locale);
  return formatDayLabel(ts, locale);
}

/**
 * 输入栏格式键落到草稿上：wrap 的包住整条，prefix 的插在最后一行行首。
 * 返回 null 表示这个键没实现（调用方给「暂未开放」提示）。
 */
export function applyFormat(text: string, toolId: string): string | null {
  const tool = FORMAT_TOOLS.find((f) => f.id === toolId);
  if (!tool) return null;
  if ('wrap' in tool) {
    const mark = tool.wrap;
    return text ? `${mark}${text}${mark}` : `${mark}${mark}`;
  }
  if ('prefix' in tool) {
    const lines = text.split('\n');
    const last = lines.length - 1;
    if (lines[last].startsWith(tool.prefix)) return text;
    lines[last] = `${tool.prefix}${lines[last]}`;
    return lines.join('\n');
  }
  return null;
}

/** 把 '{{n}}' 之类的占位符替换掉 */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));
}
