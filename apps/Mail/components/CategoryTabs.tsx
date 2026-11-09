/**
 * 智能分类标签行 —— 对照 IMG_2168/2169/2170/2172/2211。
 * 选中的 pill 展开显示图标+文字并上色，未选中的收成纯图标灰底。
 * 横向可滚动，声明为 scrollContainer "categoryTabs"。
 */
import React from 'react';
import { useMailGestures } from '../hooks/useMailGestures';
import { useAppStrings } from '../../../os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { colors as C } from '../res/colors';
import { CATEGORY_TABS } from '../constants';
import { IconRenderer } from '../res/icons';
import type { MailCategory } from '../types';

export const CategoryTabs: React.FC<{
  mailboxId: string;
  active: MailCategory | 'all';
  /** 各分类是否有未读，未选中的 pill 右上角显示小黑点 */
  unreadByCategory: Record<string, boolean>;
}> = ({ mailboxId, active, unreadByCategory }) => {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();

  return (
    <div
      className="flex flex-shrink-0 gap-2 overflow-x-auto px-4 pb-2 pt-1 no-scrollbar"
      data-scroll-container="categoryTabs"
      data-scroll-direction="horizontal"
    >
      {CATEGORY_TABS.map((tab) => {
        const isActive = tab.id === active;
        const bg = isActive ? C[tab.colorKey] : '#E9E9EB';
        return (
          <button
            key={tab.id}
            {...bindTap('list.category.switch', { params: { mailboxId, category: tab.id } })}
            className={`relative flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full transition-all ${
              isActive ? 'px-4' : 'w-14 justify-center'
            }`}
            style={{ background: bg, color: isActive ? '#fff' : '#3C3C43' }}
            aria-label={s[tab.labelKey]}
          >
            <IconRenderer name={tab.icon} size={18} />
            {isActive && <span className="text-[15px] font-medium">{s[tab.labelKey]}</span>}
            {!isActive && unreadByCategory[tab.id] && (
              <span className="absolute right-3 top-1.5 h-1.5 w-1.5 rounded-full bg-black" />
            )}
          </button>
        );
      })}
    </div>
  );
};
