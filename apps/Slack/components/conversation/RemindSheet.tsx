import React from 'react';
import { useI18n } from '../../i18n';
import { REMIND_OPTIONS } from '../../constants';
import { NEUTRAL } from '../../res/colors';
import { IcClock } from '../../res/icons';
import Sheet from '../Sheet';
import type { Bind } from '../../types';

/** 「提醒我」时间选项弹层。选中后到点由 Slackbot 私信提醒 */
const RemindSheet: React.FC<{ pick: (id: string) => Bind }> = ({ pick }) => {
  const { t } = useI18n();

  return (
    <Sheet>
      <h2
        className="flex items-center gap-2 px-4 pb-1 pt-1 text-[15px] font-bold"
        style={{ color: NEUTRAL.textPrimary }}
      >
        <IcClock size={16} />
        {t('remind.title')}
      </h2>
      {REMIND_OPTIONS.map((o) => (
        <button
          key={o.id}
          {...pick(o.id)}
          className="flex w-full items-center border-none bg-transparent px-4 py-3 text-left text-[16px]"
          style={{ color: NEUTRAL.textPrimary }}
        >
          {t(o.labelKey)}
        </button>
      ))}
    </Sheet>
  );
};

export default RemindSheet;
