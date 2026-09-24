// apps/Douban/components/MarkSheetCore.tsx —— 标记/评分弹层的可复用内核(FOUNDATION)。
// 完整弹层页在 /subject/markSheet(overlay 路由,页面簇 agent 实现);
// 这里提供:状态三tab / 五星选择器(实时文案 很差…力荐)/ 标签 chips 区。
// 所有绑定页面侧字面量生成后传入。
import React from 'react';
import type { MarkStatus, SubjectType } from '../types';
import { C, RATING_LABELS } from './ui';

/** 各条目类型的状态 tab 文案(电影仅 想看/看过;tv/book/music 三tab) */
export const MARK_TABS: Record<SubjectType, { id: MarkStatus; label: string }[]> = {
  movie: [
    { id: 'wish', label: '想看' },
    { id: 'done', label: '看过' },
  ],
  tv: [
    { id: 'wish', label: '想看' },
    { id: 'doing', label: '在看' },
    { id: 'done', label: '看过' },
  ],
  book: [
    { id: 'wish', label: '想读' },
    { id: 'doing', label: '在读' },
    { id: 'done', label: '读过' },
  ],
  music: [
    { id: 'wish', label: '想听' },
    { id: 'doing', label: '在听' },
    { id: 'done', label: '听过' },
  ],
  podcast: [
    { id: 'wish', label: '想听' },
    { id: 'done', label: '听过' },
  ],
};

/** 已标记按钮态文案:markStatusLabel('movie','wish') → 「想看」 */
export function markStatusLabel(type: SubjectType, status: MarkStatus): string {
  return MARK_TABS[type].find((t) => t.id === status)?.label ?? '想看';
}

/** 状态三tab(想读/在读/读过) */
export function MarkStatusTabs({
  type,
  active,
  bindTab,
}: {
  type: SubjectType;
  active: MarkStatus;
  bindTab: (status: MarkStatus) => object;
}) {
  const tabs = MARK_TABS[type];
  return (
    <div className="flex justify-center gap-9 py-3">
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            {...bindTab(t.id)}
            className="bg-transparent border-none cursor-pointer text-base relative pb-1.5 p-0"
            style={{ color: isActive ? C.text : C.sub, fontWeight: isActive ? 700 : 400 }}
          >
            {t.label}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full" style={{ background: C.text }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 五星选择器 + 实时文案(1很差/2较差/3还行/4推荐/5力荐)。
 * value 为星数 0-5;想看/想读 tab 由页面隐藏本组件。
 */
export function StarPicker({
  value,
  bindStar,
  size = 34,
}: {
  value: number;
  bindStar: (n: number) => object;
  size?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-2">
      {/* 实时文案在星星上方(evidence t0045/t0060) */}
      <div className="text-sm h-5" style={{ color: value > 0 ? C.gold : C.sub }}>
        {value > 0 ? RATING_LABELS[value] : '点击星星评分'}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} {...bindStar(n)} className="bg-transparent border-none cursor-pointer p-0">
            <svg width={size} height={size} viewBox="0 0 20 20">
              <path
                d="M10 1.5l2.47 5.36 5.86.63-4.36 3.96 1.2 5.77L10 14.3l-5.17 2.92 1.2-5.77-4.36-3.96 5.86-.63L10 1.5z"
                fill={n <= value ? C.gold : '#E4E7EB'}
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 标签 chips 区:预置标签(图书有/音乐无)+ 已选自建标签 + 「+新标签」。
 * 选中态金色描边(evidence frame:8b7ecc@t0045)。
 */
export function TagChips({
  presetTags,
  customTags,
  selected,
  bindTag,
  bindNewTag,
}: {
  presetTags: string[];
  customTags: string[];
  selected: string[];
  /** 预置/自建标签 chip 切换选中 */
  bindTag: (tag: string) => object;
  /** 「+新标签」→ 添加标签弹窗(最多24字符) */
  bindNewTag: object;
}) {
  const all = [...presetTags, ...customTags.filter((t) => !presetTags.includes(t))];
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {all.map((tag) => {
        const isSel = selected.includes(tag);
        return (
          <button
            key={tag}
            {...bindTag(tag)}
            className="px-3 py-1.5 rounded-full text-xs cursor-pointer"
            style={{
              background: isSel ? '#FFF8EC' : '#FAFBFC',
              color: isSel ? C.gold : C.sub,
              border: isSel ? `1px solid ${C.gold}` : `1px solid ${C.border}`,
            }}
          >
            {tag}
          </button>
        );
      })}
      <button
        {...bindNewTag}
        className="px-3 py-1.5 rounded-full text-xs cursor-pointer"
        style={{ background: '#FAFBFC', color: C.sub, border: '1px dashed #C3C9D1' }}
      >
        + 新标签
      </button>
    </div>
  );
}
