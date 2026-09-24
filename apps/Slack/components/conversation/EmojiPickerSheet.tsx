import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import { EMOJI_CATEGORIES } from '../../constants';
import { NEUTRAL } from '../../res/colors';
import { IcSearch } from '../../res/icons';
import Sheet from '../Sheet';
import type { Bind } from '../../types';

export type EmojiPickerBinds = {
  pick: (emoji: string) => Bind;
  search: Bind;
  category: (id: string) => Bind;
};

/**
 * emoji 选择面板（inferred I-4：真机未拍到，按官方面板结构外推）。
 * 搜索框 + 「最近使用」+ 分类分组 + 右侧分类快捷条。
 */
const EmojiPickerSheet: React.FC<{ binds: EmojiPickerBinds }> = ({ binds }) => {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [active, setActive] = useState<string>(EMOJI_CATEGORIES[0].id);

  const term = q.trim().toLowerCase();
  const groups = term
    ? EMOJI_CATEGORIES.map((c) => ({
        ...c,
        items: c.items.filter((e) => e.includes(term) || t(c.labelKey).toLowerCase().includes(term)),
      })).filter((c) => c.items.length > 0)
    : EMOJI_CATEGORIES;

  return (
    <Sheet className="h-[62%]">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center gap-2 px-4 pb-2">
          <span
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2"
            style={{ backgroundColor: '#F3F3F3' }}
          >
            <IcSearch size={16} style={{ color: NEUTRAL.textSecondary }} />
            <input
              {...binds.search}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('emoji.searchPlaceholder')}
              className="min-w-0 flex-1 border-none bg-transparent text-[16px] outline-none"
              style={{ color: NEUTRAL.textPrimary }}
            />
          </span>
        </div>

        <div className="flex min-h-0 flex-1">
          <div
            className="min-h-0 flex-1 overflow-y-auto px-3"
            data-scroll-container="emoji"
            data-scroll-direction="vertical"
          >
            {groups.length === 0 ? (
              <p className="px-1 py-6 text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
                {t('emoji.noResult')}
              </p>
            ) : (
              groups.map((c) => (
                <div key={c.id} id={`emoji-${c.id}`}>
                  <h3
                    className="px-1 pb-1 pt-3 text-[13px] font-bold"
                    style={{ color: NEUTRAL.textSecondary }}
                  >
                    {t(c.labelKey)}
                  </h3>
                  <div className="grid grid-cols-8 gap-1">
                    {c.items.map((e) => (
                      <button
                        key={`${c.id}-${e}`}
                        {...binds.pick(e)}
                        aria-label={e}
                        className="flex h-9 items-center justify-center rounded border-none bg-transparent text-[22px]"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex w-9 flex-shrink-0 flex-col items-center gap-1 py-3">
            {EMOJI_CATEGORIES.map((c) => (
              // 滚动定位挂在外层，内层按钮的打标/触发保持原样
              <span
                key={c.id}
                onClick={() => {
                  setActive(c.id);
                  document.getElementById(`emoji-${c.id}`)?.scrollIntoView({ block: 'start' });
                }}
              >
                <button
                  {...binds.category(c.id)}
                  aria-label={t(c.labelKey)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-none text-[15px]"
                  style={{ backgroundColor: active === c.id ? '#EDEAEF' : 'transparent' }}
                >
                  {c.icon}
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
};

export default EmojiPickerSheet;
