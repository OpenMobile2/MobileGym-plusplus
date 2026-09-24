/**
 * 列表页底部悬浮工具栏 —— 对照 IMG_2168（常态）与 IMG_2202（筛选态）。
 * 常态：左=筛选 ≡ / 中=Search 框 / 右=撰写 ✏️
 * 筛选态：左侧变蓝色实心并展开「Filtered by: Unread」，中间搜索框收缩成放大镜圆钮
 * 多选态：整条换成 Flag / Move / Trash 三键
 */
import React from 'react';
import { useMailGestures } from '../hooks/useMailGestures';
import { useAppStrings } from '../../../os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { colors as C } from '../res/colors';
import { showToast } from './ui';
import { IcChevronDown, IcCompose, IcFilter, IcFlag, IcFolder, IcMic, IcSearch, IcTrash } from '../res/icons';

const CIRCLE = 'flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.12)]';

export const BottomBar: React.FC<{ mailboxId: string; filtered?: boolean }> = ({ mailboxId, filtered }) => {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack } = useMailGestures();

  return (
    <div
      className="flex flex-shrink-0 items-center gap-2 px-3 pb-2 pt-1"
      data-hide-on-keyboard="true"
    >
      {filtered ? (
        <>
          <button
            {...bindBack()}
            className="flex h-11 items-center gap-2 rounded-full pl-3 pr-4 text-white shadow-[0_1px_6px_rgba(0,0,0,0.12)]"
            style={{ background: C.accent }}
          >
            <IcFilter size={20} />
            <span className="text-[13px] leading-tight text-white/85">
              {s.filtered_by}
              <span className="block font-medium text-white">{s.filter_unread}</span>
            </span>
            <IcChevronDown size={14} />
          </button>
          <div className="flex-1" />
          <button {...bindTap('search.open')} className={CIRCLE} aria-label={s.search}>
            <IcSearch size={20} />
          </button>
        </>
      ) : (
        <>
          <button
            {...bindTap('list.filter.enter', { params: { mailboxId } })}
            className={CIRCLE}
            aria-label={s.filtered_by}
          >
            <IcFilter size={20} />
          </button>
          <button
            {...bindTap('search.open')}
            className="flex h-11 flex-1 items-center gap-2 rounded-full bg-white px-4 shadow-[0_1px_6px_rgba(0,0,0,0.12)]"
          >
            <IcSearch size={18} style={{ color: C.secondaryLabel }} />
            <span className="flex-1 text-left text-[16px]" style={{ color: C.secondaryLabel }}>
              {s.search}
            </span>
            <span
              {...bindTap({ kind: 'action', id: 'mail.search.voice' }, {
                stopPropagation: true,
                onTrigger: () => showToast(s.feature_unavailable),
              })}
            >
              <IcMic size={18} style={{ color: C.secondaryLabel }} />
            </span>
          </button>
        </>
      )}
      <button {...bindTap('compose.open')} className={CIRCLE} aria-label={s.new_message}>
        <IcCompose size={20} />
      </button>
    </div>
  );
};

/** 多选模式下的底部三键 */
export const SelectionBar: React.FC<{
  mailboxId: string;
  count: number;
  onFlag: () => void;
  onTrash: () => void;
}> = ({ mailboxId, count, onFlag, onTrash }) => {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  const disabled = count === 0;
  const tint = disabled ? C.tertiaryLabel : '#000';

  return (
    <div className="flex flex-shrink-0 items-center justify-between px-6 pb-3 pt-2" data-hide-on-keyboard="true">
      <button
        {...bindTap({ kind: 'action', id: 'mail.select.flag' }, { onTrigger: onFlag })}
        className={CIRCLE}
        disabled={disabled}
        aria-label={s.flag}
      >
        <IcFlag size={20} style={{ color: tint }} />
      </button>
      <button
        {...bindTap('list.move.open', { params: { mailboxId } })}
        className={CIRCLE}
        disabled={disabled}
        aria-label={s.move_to}
      >
        <IcFolder size={20} style={{ color: tint }} />
      </button>
      <button
        {...bindTap({ kind: 'action', id: 'mail.select.trash' }, { onTrigger: onTrash })}
        className={CIRCLE}
        disabled={disabled}
        aria-label={s.trash}
      >
        <IcTrash size={20} style={{ color: tint }} />
      </button>
    </div>
  );
};
