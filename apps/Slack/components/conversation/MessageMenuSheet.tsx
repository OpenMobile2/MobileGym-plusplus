import React from 'react';
import { useI18n } from '../../i18n';
import { QUICK_EMOJIS, MESSAGE_MENU_TILES, MESSAGE_MENU_ROWS } from '../../constants';
import { NEUTRAL, RED } from '../../res/colors';
import { IconRenderer, IcEmoji, IcChevronDown } from '../../res/icons';
import Sheet from '../Sheet';
import type { Bind } from '../../types';

export type MessageMenuBinds = {
  /** 快捷 emoji 排 */
  quickReact: (emoji: string) => Bind;
  /** ☺+ 更多表情 */
  moreEmoji: Bind;
  /** 三个方块：回复 / 前进 / 保存 */
  tile: (id: string) => Bind;
  /** 列表项 */
  row: (id: string) => Bind;
  /** 「更多操作 ⌄」 */
  expand: Bind;
};

/**
 * 长按消息面板（IMG_2415）。
 * 别人的消息没有「编辑消息」「删除消息」；「钉选」「选择文本」要点开「更多操作 ⌄」才出现。
 * 面板不做的行（如某层还没实现的）由调用方通过 hiddenRows 摘掉，避免点了没反应。
 */
const MessageMenuSheet: React.FC<{
  mine: boolean;
  expanded: boolean;
  binds: MessageMenuBinds;
  /** 当前是否已关掉该消息列的回复通知 / 已钉选，用来切文案 */
  threadMuted?: boolean;
  pinned?: boolean;
  hiddenRows?: string[];
  hiddenTiles?: string[];
}> = ({
  mine,
  expanded,
  binds,
  threadMuted = false,
  pinned = false,
  hiddenRows = [],
  hiddenTiles = [],
}) => {
  const { t } = useI18n();

  const rows = MESSAGE_MENU_ROWS.filter((r) => {
    if (hiddenRows.includes(r.id)) return false;
    if ('ownerOnly' in r && r.ownerOnly && !mine) return false;
    if ('inMore' in r && r.inMore && !expanded) return false;
    return true;
  });
  const tiles = MESSAGE_MENU_TILES.filter((x) => !hiddenTiles.includes(x.id));

  const labelOf = (id: string, fallback: string) => {
    if (id === 'unsubscribe') return threadMuted ? t('msgMenu.subscribe') : t('msgMenu.unsubscribe');
    if (id === 'pin') return pinned ? t('msgMenu.unpin') : t('msgMenu.pin');
    return fallback;
  };

  return (
    <Sheet>
      <div className="flex items-center gap-2 px-4 pb-3 pt-1">
        {QUICK_EMOJIS.map((e) => (
          <button
            key={e}
            {...binds.quickReact(e)}
            aria-label={e}
            className="flex h-10 w-10 items-center justify-center rounded-full border-none bg-[#F3F3F3] text-[20px]"
          >
            {e}
          </button>
        ))}
        <button
          {...binds.moreEmoji}
          aria-label="more-emoji"
          className="flex h-10 w-10 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
          style={{ color: NEUTRAL.textSecondary }}
        >
          <IcEmoji size={20} />
        </button>
      </div>

      <div className="flex gap-2 px-4 pb-2">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            {...binds.tile(tile.id)}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl border-none bg-[#F8F8F8] py-3"
            style={{ color: NEUTRAL.textPrimary }}
          >
            <IconRenderer name={tile.icon} size={20} />
            <span className="text-[13px]">{t(tile.labelKey)}</span>
          </button>
        ))}
      </div>

      <div className="pt-1">
        {rows.map((r) => (
          <button
            key={r.id}
            {...binds.row(r.id)}
            className="flex w-full items-center gap-3.5 border-none bg-transparent px-4 py-3 text-left"
            style={{
              color: 'destructive' in r && r.destructive ? RED.destructive : NEUTRAL.textPrimary,
            }}
          >
            <IconRenderer name={r.icon} size={19} />
            <span className="text-[16px]">{labelOf(r.id, t(r.labelKey))}</span>
          </button>
        ))}

        {!expanded && (
          <button
            {...binds.expand}
            className="flex w-full items-center gap-3.5 border-none bg-transparent px-4 py-3 text-left"
            style={{ color: NEUTRAL.textPrimary }}
          >
            <IcChevronDown size={19} />
            <span className="text-[16px]">{t('msgMenu.more')}</span>
          </button>
        )}
      </div>
    </Sheet>
  );
};

export default MessageMenuSheet;
