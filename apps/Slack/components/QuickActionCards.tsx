import React from 'react';
import { useI18n } from '../i18n';
import { QUICK_ACTIONS } from '../constants';
import { IconRenderer, IcCompose } from '../res/icons';
import { NEUTRAL, PURPLE } from '../res/colors';
import type { Bind } from '../types';

/**
 * 一张浅灰圆角卡：「会议 / 频道」两行 + 深紫「消息」大按钮（IMG_2393）。
 * 主页 FAB 弹层与「更多」页底部是同一组内容，只有 transition 不同 ——
 * 所以 bindTap 由宿主页面按字面量绑好再传进来（校验脚本才认得出用到了哪些 id）。
 */
const QuickActionCards: React.FC<{
  huddleProps: Bind;
  channelProps: Bind;
  messageProps: Bind;
}> = ({ huddleProps, channelProps, messageProps }) => {
  const { t } = useI18n();
  const binds: Record<string, Bind> = { huddle: huddleProps, channel: channelProps };

  return (
    <div className="mx-3 rounded-2xl bg-[#F7F7F7] p-3">
      {QUICK_ACTIONS.map((a) => (
        <button
          key={a.id}
          {...binds[a.id]}
          className="flex w-full items-center gap-3 border-none bg-transparent px-1 py-2 text-left"
        >
          <span
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#EFE7F0]"
            style={{ color: PURPLE.aubergine }}
          >
            <IconRenderer name={a.icon} size={21} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
              {t(a.titleKey)}
            </span>
            <span className="block text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
              {t(a.descKey)}
            </span>
          </span>
        </button>
      ))}
      <button
        {...messageProps}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border-none py-3.5"
        style={{ backgroundColor: PURPLE.aubergine }}
      >
        <IcCompose size={19} className="text-white" />
        <span className="text-[16px] font-bold text-white">{t('quickAction.message')}</span>
      </button>
    </div>
  );
};

export default QuickActionCards;
